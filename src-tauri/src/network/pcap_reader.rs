use anyhow::{Context, Result};
use pcap_parser::*;
use pcap_parser::traits::PcapReaderIterator;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::BufReader;

/// Parsed packet information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PacketInfo {
    pub id: usize,
    pub timestamp: f64,
    pub src: String,
    pub dst: String,
    pub protocol: String,
    pub length: usize,
    pub info: String,
    pub src_port: Option<u16>,
    pub dst_port: Option<u16>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub raw_data: Vec<u8>,
}

/// Result of parsing a PCAP file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PcapResult {
    pub packets: Vec<PacketInfo>,
    pub total_packets: usize,
    pub file_size: u64,
    pub link_type: u32,
}

/// Parse an IPv4 address from 4 bytes.
fn parse_ipv4(data: &[u8]) -> String {
    if data.len() >= 4 {
        format!("{}.{}.{}.{}", data[0], data[1], data[2], data[3])
    } else {
        "?.?.?.?".to_string()
    }
}

/// Parse a MAC address from 6 bytes.
fn parse_mac(data: &[u8]) -> String {
    if data.len() >= 6 {
        format!(
            "{:02x}:{:02x}:{:02x}:{:02x}:{:02x}:{:02x}",
            data[0], data[1], data[2], data[3], data[4], data[5]
        )
    } else {
        "??:??:??:??:??:??".to_string()
    }
}

/// Parse a u16 from two bytes big-endian.
fn read_u16_be(data: &[u8]) -> u16 {
    if data.len() >= 2 {
        ((data[0] as u16) << 8) | (data[1] as u16)
    } else {
        0
    }
}

/// Parse a PCAP file and return parsed packets.
pub fn parse_pcap(path: &str) -> Result<PcapResult> {
    let file = File::open(path).with_context(|| format!("Failed to open PCAP: {}", path))?;
    let file_size = file.metadata()?.len();
    let _reader = BufReader::new(file);

    let mut packets = Vec::new();
    let mut packet_id = 0;
    let mut link_type = 0u32;

    // Try legacy PCAP format first
    let file2 = File::open(path)?;
    let reader2 = BufReader::new(file2);
    let mut pcap_reader = LegacyPcapReader::new(65536, reader2)?;

    loop {
        match pcap_reader.next() {
            Ok((offset, block)) => {
                match block {
                    PcapBlockOwned::Legacy(packet) => {
                        let data = packet.data.to_vec();
                        let ts = packet.ts_sec as f64 + packet.ts_usec as f64 / 1_000_000.0;

                        let parsed = parse_ethernet_packet(&data, packet_id, ts);
                        packets.push(parsed);
                        packet_id += 1;
                    }
                    PcapBlockOwned::LegacyHeader(header) => {
                        link_type = header.network.0 as u32;
                    }
                    _ => {}
                }
                pcap_reader.consume(offset);
            }
            Err(PcapError::Eof) => break,
            Err(PcapError::Incomplete(_)) => {
                pcap_reader.refill().unwrap_or(());
            }
            Err(_e) => break,
        }
    }

    Ok(PcapResult {
        total_packets: packets.len(),
        packets,
        file_size,
        link_type,
    })
}

/// Parse an Ethernet frame into a PacketInfo.
fn parse_ethernet_packet(data: &[u8], id: usize, timestamp: f64) -> PacketInfo {
    if data.len() < 14 {
        return PacketInfo {
            id,
            timestamp,
            src: "Unknown".to_string(),
            dst: "Unknown".to_string(),
            protocol: "Unknown".to_string(),
            length: data.len(),
            info: format!("Truncated frame ({} bytes)", data.len()),
            src_port: None,
            dst_port: None,
            raw_data: data.to_vec(),
        };
    }

    let _dst_mac = parse_mac(&data[0..6]);
    let _src_mac = parse_mac(&data[6..12]);
    let ethertype = read_u16_be(&data[12..14]);
    let payload = &data[14..];

    match ethertype {
        0x0800 => parse_ipv4_packet(payload, id, timestamp, data),
        0x0806 => PacketInfo {
            id,
            timestamp,
            src: parse_mac(&data[6..12]),
            dst: parse_mac(&data[0..6]),
            protocol: "ARP".to_string(),
            length: data.len(),
            info: "ARP request/reply".to_string(),
            src_port: None,
            dst_port: None,
            raw_data: data.to_vec(),
        },
        0x86DD => PacketInfo {
            id,
            timestamp,
            src: "IPv6".to_string(),
            dst: "IPv6".to_string(),
            protocol: "IPv6".to_string(),
            length: data.len(),
            info: "IPv6 packet".to_string(),
            src_port: None,
            dst_port: None,
            raw_data: data.to_vec(),
        },
        _ => PacketInfo {
            id,
            timestamp,
            src: parse_mac(&data[6..12]),
            dst: parse_mac(&data[0..6]),
            protocol: format!("Ether(0x{:04X})", ethertype),
            length: data.len(),
            info: format!("Ethernet frame, type 0x{:04X}", ethertype),
            src_port: None,
            dst_port: None,
            raw_data: data.to_vec(),
        },
    }
}

/// Parse an IPv4 packet.
fn parse_ipv4_packet(ip_data: &[u8], id: usize, timestamp: f64, raw: &[u8]) -> PacketInfo {
    if ip_data.len() < 20 {
        return PacketInfo {
            id,
            timestamp,
            src: "?".to_string(),
            dst: "?".to_string(),
            protocol: "IPv4".to_string(),
            length: raw.len(),
            info: "Truncated IPv4".to_string(),
            src_port: None,
            dst_port: None,
            raw_data: raw.to_vec(),
        };
    }

    let ihl = ((ip_data[0] & 0x0F) as usize) * 4;
    let _total_length = read_u16_be(&ip_data[2..4]) as usize;
    let protocol = ip_data[9];
    let src_ip = parse_ipv4(&ip_data[12..16]);
    let dst_ip = parse_ipv4(&ip_data[16..20]);

    let transport_data = if ip_data.len() > ihl { &ip_data[ihl..] } else { &[] };

    let (proto_name, info, src_port, dst_port) = match protocol {
        6 => parse_tcp_info(transport_data),
        17 => parse_udp_info(transport_data),
        1 => ("ICMP".to_string(), "ICMP message".to_string(), None, None),
        _ => (format!("IP({})", protocol), format!("IP protocol {}", protocol), None, None),
    };

    PacketInfo {
        id,
        timestamp,
        src: if let Some(sp) = src_port { format!("{}:{}", src_ip, sp) } else { src_ip },
        dst: if let Some(dp) = dst_port { format!("{}:{}", dst_ip, dp) } else { dst_ip },
        protocol: proto_name,
        length: raw.len(),
        info,
        src_port,
        dst_port,
        raw_data: raw.to_vec(),
    }
}

/// Parse TCP header info.
fn parse_tcp_info(data: &[u8]) -> (String, String, Option<u16>, Option<u16>) {
    if data.len() < 20 {
        return ("TCP".to_string(), "Truncated TCP".to_string(), None, None);
    }

    let src_port = read_u16_be(&data[0..2]);
    let dst_port = read_u16_be(&data[2..4]);
    let _seq = ((data[4] as u32) << 24) | ((data[5] as u32) << 16) | ((data[6] as u32) << 8) | (data[7] as u32);
    let flags = data[13];

    let mut flag_str = Vec::new();
    if flags & 0x02 != 0 { flag_str.push("SYN"); }
    if flags & 0x10 != 0 { flag_str.push("ACK"); }
    if flags & 0x01 != 0 { flag_str.push("FIN"); }
    if flags & 0x04 != 0 { flag_str.push("RST"); }
    if flags & 0x08 != 0 { flag_str.push("PSH"); }

    let proto = if dst_port == 80 || src_port == 80 || dst_port == 8080 || src_port == 8080 {
        "HTTP".to_string()
    } else if dst_port == 443 || src_port == 443 {
        "TLS".to_string()
    } else if dst_port == 22 || src_port == 22 {
        "SSH".to_string()
    } else {
        "TCP".to_string()
    };

    let info = format!(
        "{} → {} [{}] Len={}",
        src_port,
        dst_port,
        flag_str.join(","),
        data.len().saturating_sub(20)
    );

    (proto, info, Some(src_port), Some(dst_port))
}

/// Parse UDP header info.
fn parse_udp_info(data: &[u8]) -> (String, String, Option<u16>, Option<u16>) {
    if data.len() < 8 {
        return ("UDP".to_string(), "Truncated UDP".to_string(), None, None);
    }

    let src_port = read_u16_be(&data[0..2]);
    let dst_port = read_u16_be(&data[2..4]);
    let length = read_u16_be(&data[4..6]);

    let proto = if dst_port == 53 || src_port == 53 {
        "DNS".to_string()
    } else if dst_port == 67 || dst_port == 68 || src_port == 67 || src_port == 68 {
        "DHCP".to_string()
    } else {
        "UDP".to_string()
    };

    let info = format!("{} → {} Len={}", src_port, dst_port, length);

    (proto, info, Some(src_port), Some(dst_port))
}
