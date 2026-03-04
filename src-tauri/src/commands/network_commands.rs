use crate::network::{self, PacketInfo, SessionInfo, pcap_reader};
use crate::network::session;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// Cached PCAP data.
struct PcapCache {
    packets: Vec<PacketInfo>,
}

/// Load and parse a PCAP file.
#[tauri::command]
pub async fn load_pcap(path: String) -> Result<network::PcapResult, String> {
    network::parse_pcap(&path).map_err(|e| e.to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PacketDetailResult {
    pub packet: PacketInfo,
    pub hex_dump: String,
    pub layers: Vec<LayerInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayerInfo {
    pub name: String,
    pub protocol: String,
    pub fields: Vec<FieldInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldInfo {
    pub name: String,
    pub value: String,
    pub offset: usize,
    pub size: usize,
}

/// Get detailed packet information.
#[tauri::command]
pub async fn get_packet_detail(path: String, packet_id: usize) -> Result<PacketDetailResult, String> {
    let pcap_result = network::parse_pcap(&path).map_err(|e| e.to_string())?;

    let packet = pcap_result
        .packets
        .into_iter()
        .find(|p| p.id == packet_id)
        .ok_or_else(|| format!("Packet {} not found", packet_id))?;

    // Generate hex dump
    let hex_dump: String = packet
        .raw_data
        .chunks(16)
        .enumerate()
        .map(|(i, chunk)| {
            let hex: Vec<String> = chunk.iter().map(|b| format!("{:02X}", b)).collect();
            let ascii: String = chunk
                .iter()
                .map(|&b| if b >= 0x20 && b < 0x7F { b as char } else { '.' })
                .collect();
            format!("{:08X}  {:48}  {}", i * 16, hex.join(" "), ascii)
        })
        .collect::<Vec<_>>()
        .join("\n");

    // Parse layers (simplified)
    let layers = parse_packet_layers(&packet.raw_data);

    Ok(PacketDetailResult {
        packet,
        hex_dump,
        layers,
    })
}

/// Parse packet into protocol layers.
fn parse_packet_layers(data: &[u8]) -> Vec<LayerInfo> {
    let mut layers = Vec::new();

    if data.len() < 14 {
        return layers;
    }

    // Ethernet layer
    layers.push(LayerInfo {
        name: "Ethernet II".to_string(),
        protocol: "Ethernet".to_string(),
        fields: vec![
            FieldInfo { name: "Destination MAC".to_string(), value: format_mac(&data[0..6]), offset: 0, size: 6 },
            FieldInfo { name: "Source MAC".to_string(), value: format_mac(&data[6..12]), offset: 6, size: 6 },
            FieldInfo { name: "EtherType".to_string(), value: format!("0x{:04X}", read_u16_be(&data[12..14])), offset: 12, size: 2 },
        ],
    });

    let ethertype = read_u16_be(&data[12..14]);
    if ethertype == 0x0800 && data.len() >= 34 {
        // IPv4 layer
        let ip = &data[14..];
        let ihl = ((ip[0] & 0x0F) as usize) * 4;
        layers.push(LayerInfo {
            name: "Internet Protocol Version 4".to_string(),
            protocol: "IPv4".to_string(),
            fields: vec![
                FieldInfo { name: "Version".to_string(), value: "4".to_string(), offset: 14, size: 1 },
                FieldInfo { name: "IHL".to_string(), value: format!("{} ({} bytes)", ip[0] & 0x0F, ihl), offset: 14, size: 1 },
                FieldInfo { name: "Total Length".to_string(), value: read_u16_be(&ip[2..4]).to_string(), offset: 16, size: 2 },
                FieldInfo { name: "TTL".to_string(), value: ip[8].to_string(), offset: 22, size: 1 },
                FieldInfo { name: "Protocol".to_string(), value: ip[9].to_string(), offset: 23, size: 1 },
                FieldInfo { name: "Source IP".to_string(), value: format_ipv4(&ip[12..16]), offset: 26, size: 4 },
                FieldInfo { name: "Destination IP".to_string(), value: format_ipv4(&ip[16..20]), offset: 30, size: 4 },
            ],
        });

        // Transport layer
        if ip.len() > ihl {
            let transport = &ip[ihl..];
            match ip[9] {
                6 if transport.len() >= 20 => {
                    layers.push(LayerInfo {
                        name: "Transmission Control Protocol".to_string(),
                        protocol: "TCP".to_string(),
                        fields: vec![
                            FieldInfo { name: "Source Port".to_string(), value: read_u16_be(&transport[0..2]).to_string(), offset: 14 + ihl, size: 2 },
                            FieldInfo { name: "Destination Port".to_string(), value: read_u16_be(&transport[2..4]).to_string(), offset: 14 + ihl + 2, size: 2 },
                            FieldInfo { name: "Sequence Number".to_string(), value: read_u32_be(&transport[4..8]).to_string(), offset: 14 + ihl + 4, size: 4 },
                            FieldInfo { name: "Flags".to_string(), value: format!("0x{:02X}", transport[13]), offset: 14 + ihl + 13, size: 1 },
                            FieldInfo { name: "Window Size".to_string(), value: read_u16_be(&transport[14..16]).to_string(), offset: 14 + ihl + 14, size: 2 },
                        ],
                    });
                }
                17 if transport.len() >= 8 => {
                    layers.push(LayerInfo {
                        name: "User Datagram Protocol".to_string(),
                        protocol: "UDP".to_string(),
                        fields: vec![
                            FieldInfo { name: "Source Port".to_string(), value: read_u16_be(&transport[0..2]).to_string(), offset: 14 + ihl, size: 2 },
                            FieldInfo { name: "Destination Port".to_string(), value: read_u16_be(&transport[2..4]).to_string(), offset: 14 + ihl + 2, size: 2 },
                            FieldInfo { name: "Length".to_string(), value: read_u16_be(&transport[4..6]).to_string(), offset: 14 + ihl + 4, size: 2 },
                        ],
                    });
                }
                _ => {}
            }
        }
    }

    layers
}

fn format_mac(data: &[u8]) -> String {
    format!("{:02x}:{:02x}:{:02x}:{:02x}:{:02x}:{:02x}", data[0], data[1], data[2], data[3], data[4], data[5])
}

fn format_ipv4(data: &[u8]) -> String {
    format!("{}.{}.{}.{}", data[0], data[1], data[2], data[3])
}

fn read_u16_be(data: &[u8]) -> u16 {
    ((data[0] as u16) << 8) | (data[1] as u16)
}

fn read_u32_be(data: &[u8]) -> u32 {
    ((data[0] as u32) << 24) | ((data[1] as u32) << 16) | ((data[2] as u32) << 8) | (data[3] as u32)
}

/// Get assembled session flows.
#[tauri::command]
pub async fn get_sessions(path: String) -> Result<Vec<SessionInfo>, String> {
    let pcap_result = network::parse_pcap(&path).map_err(|e| e.to_string())?;
    Ok(session::assemble_sessions(&pcap_result.packets))
}

/// Get protocol statistics.
#[tauri::command]
pub async fn get_protocol_stats(path: String) -> Result<Vec<session::ProtocolStats>, String> {
    let pcap_result = network::parse_pcap(&path).map_err(|e| e.to_string())?;
    Ok(session::compute_protocol_stats(&pcap_result.packets))
}
