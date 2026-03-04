use super::PacketInfo;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A network session (TCP connection or UDP flow).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub id: String,
    pub src: String,
    pub dst: String,
    pub protocol: String,
    pub packet_count: usize,
    pub total_bytes: usize,
    pub start_time: f64,
    pub end_time: f64,
    pub duration: f64,
}

/// Generate a session key from a packet (bidirectional).
fn session_key(packet: &PacketInfo) -> String {
    let a = &packet.src;
    let b = &packet.dst;
    if a < b {
        format!("{}|{}|{}", a, b, packet.protocol)
    } else {
        format!("{}|{}|{}", b, a, packet.protocol)
    }
}

/// Assemble packets into sessions/flows.
pub fn assemble_sessions(packets: &[PacketInfo]) -> Vec<SessionInfo> {
    let mut sessions: HashMap<String, SessionInfo> = HashMap::new();

    for packet in packets {
        let key = session_key(packet);

        let session = sessions.entry(key.clone()).or_insert_with(|| SessionInfo {
            id: key.clone(),
            src: packet.src.clone(),
            dst: packet.dst.clone(),
            protocol: packet.protocol.clone(),
            packet_count: 0,
            total_bytes: 0,
            start_time: packet.timestamp,
            end_time: packet.timestamp,
            duration: 0.0,
        });

        session.packet_count += 1;
        session.total_bytes += packet.length;
        if packet.timestamp < session.start_time {
            session.start_time = packet.timestamp;
        }
        if packet.timestamp > session.end_time {
            session.end_time = packet.timestamp;
        }
        session.duration = session.end_time - session.start_time;
    }

    let mut result: Vec<SessionInfo> = sessions.into_values().collect();
    result.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap_or(std::cmp::Ordering::Equal));
    result
}

/// Compute protocol statistics.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolStats {
    pub protocol: String,
    pub count: usize,
    pub total_bytes: usize,
    pub percentage: f64,
}

pub fn compute_protocol_stats(packets: &[PacketInfo]) -> Vec<ProtocolStats> {
    let mut stats: HashMap<String, (usize, usize)> = HashMap::new();

    for packet in packets {
        let entry = stats.entry(packet.protocol.clone()).or_insert((0, 0));
        entry.0 += 1;
        entry.1 += packet.length;
    }

    let total = packets.len() as f64;
    let mut result: Vec<ProtocolStats> = stats
        .into_iter()
        .map(|(protocol, (count, bytes))| ProtocolStats {
            protocol,
            count,
            total_bytes: bytes,
            percentage: if total > 0.0 { (count as f64 / total) * 100.0 } else { 0.0 },
        })
        .collect();

    result.sort_by(|a, b| b.count.cmp(&a.count));
    result
}
