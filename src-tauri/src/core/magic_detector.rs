use serde::{Deserialize, Serialize};
use std::fmt;

/// Known file formats detected by magic bytes.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum FileFormat {
    PNG,
    JPEG,
    GIF,
    BMP,
    TIFF,
    WebP,
    PDF,
    ZIP,
    GZip,
    SevenZip,
    RAR,
    TAR,
    PE,       // Windows EXE/DLL
    ELF,      // Linux executable
    MachO,    // macOS executable
    SQLite,
    MP4,
    MKV,
    AVI,
    MP3,
    FLAC,
    OGG,
    WAV,
    WASM,
    PCAP,
    PCAPng,
    DEX,      // Android
    ClassFile, // Java
    Unknown,
}

impl fmt::Display for FileFormat {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FileFormat::PNG => write!(f, "PNG"),
            FileFormat::JPEG => write!(f, "JPEG"),
            FileFormat::GIF => write!(f, "GIF"),
            FileFormat::BMP => write!(f, "BMP"),
            FileFormat::TIFF => write!(f, "TIFF"),
            FileFormat::WebP => write!(f, "WebP"),
            FileFormat::PDF => write!(f, "PDF"),
            FileFormat::ZIP => write!(f, "ZIP"),
            FileFormat::GZip => write!(f, "GZip"),
            FileFormat::SevenZip => write!(f, "7z"),
            FileFormat::RAR => write!(f, "RAR"),
            FileFormat::TAR => write!(f, "TAR"),
            FileFormat::PE => write!(f, "PE"),
            FileFormat::ELF => write!(f, "ELF"),
            FileFormat::MachO => write!(f, "Mach-O"),
            FileFormat::SQLite => write!(f, "SQLite"),
            FileFormat::MP4 => write!(f, "MP4"),
            FileFormat::MKV => write!(f, "MKV"),
            FileFormat::AVI => write!(f, "AVI"),
            FileFormat::MP3 => write!(f, "MP3"),
            FileFormat::FLAC => write!(f, "FLAC"),
            FileFormat::OGG => write!(f, "OGG"),
            FileFormat::WAV => write!(f, "WAV"),
            FileFormat::WASM => write!(f, "WASM"),
            FileFormat::PCAP => write!(f, "PCAP"),
            FileFormat::PCAPng => write!(f, "PCAPng"),
            FileFormat::DEX => write!(f, "DEX"),
            FileFormat::ClassFile => write!(f, "Java Class"),
            FileFormat::Unknown => write!(f, "Unknown"),
        }
    }
}

/// Magic byte signatures for format detection.
struct MagicSignature {
    magic: &'static [u8],
    offset: usize,
    format: FileFormat,
}

const SIGNATURES: &[MagicSignature] = &[
    MagicSignature { magic: b"\x89PNG\r\n\x1a\n", offset: 0, format: FileFormat::PNG },
    MagicSignature { magic: b"\xFF\xD8\xFF", offset: 0, format: FileFormat::JPEG },
    MagicSignature { magic: b"GIF87a", offset: 0, format: FileFormat::GIF },
    MagicSignature { magic: b"GIF89a", offset: 0, format: FileFormat::GIF },
    MagicSignature { magic: b"BM", offset: 0, format: FileFormat::BMP },
    MagicSignature { magic: b"II\x2a\x00", offset: 0, format: FileFormat::TIFF },
    MagicSignature { magic: b"MM\x00\x2a", offset: 0, format: FileFormat::TIFF },
    MagicSignature { magic: b"RIFF", offset: 0, format: FileFormat::WebP }, // further check needed
    MagicSignature { magic: b"%PDF", offset: 0, format: FileFormat::PDF },
    MagicSignature { magic: b"PK\x03\x04", offset: 0, format: FileFormat::ZIP },
    MagicSignature { magic: b"\x1f\x8b", offset: 0, format: FileFormat::GZip },
    MagicSignature { magic: b"7z\xBC\xAF\x27\x1C", offset: 0, format: FileFormat::SevenZip },
    MagicSignature { magic: b"Rar!\x1a\x07", offset: 0, format: FileFormat::RAR },
    MagicSignature { magic: b"MZ", offset: 0, format: FileFormat::PE },
    MagicSignature { magic: b"\x7fELF", offset: 0, format: FileFormat::ELF },
    MagicSignature { magic: b"\xFE\xED\xFA\xCE", offset: 0, format: FileFormat::MachO },
    MagicSignature { magic: b"\xFE\xED\xFA\xCF", offset: 0, format: FileFormat::MachO },
    MagicSignature { magic: b"\xCE\xFA\xED\xFE", offset: 0, format: FileFormat::MachO },
    MagicSignature { magic: b"\xCF\xFA\xED\xFE", offset: 0, format: FileFormat::MachO },
    MagicSignature { magic: b"SQLite format 3\x00", offset: 0, format: FileFormat::SQLite },
    MagicSignature { magic: b"ftyp", offset: 4, format: FileFormat::MP4 },
    MagicSignature { magic: b"\x1aE\xdf\xa3", offset: 0, format: FileFormat::MKV },
    MagicSignature { magic: b"ID3", offset: 0, format: FileFormat::MP3 },
    MagicSignature { magic: b"\xFF\xFB", offset: 0, format: FileFormat::MP3 },
    MagicSignature { magic: b"fLaC", offset: 0, format: FileFormat::FLAC },
    MagicSignature { magic: b"OggS", offset: 0, format: FileFormat::OGG },
    MagicSignature { magic: b"\x00asm", offset: 0, format: FileFormat::WASM },
    MagicSignature { magic: b"\xd4\xc3\xb2\xa1", offset: 0, format: FileFormat::PCAP },
    MagicSignature { magic: b"\xa1\xb2\xc3\xd4", offset: 0, format: FileFormat::PCAP },
    MagicSignature { magic: b"\x0a\x0d\x0d\x0a", offset: 0, format: FileFormat::PCAPng },
    MagicSignature { magic: b"dex\n", offset: 0, format: FileFormat::DEX },
    MagicSignature { magic: b"\xCA\xFE\xBA\xBE", offset: 0, format: FileFormat::ClassFile },
];

/// Detect file format from the first bytes using magic signatures.
pub fn detect_file_format(data: &[u8]) -> FileFormat {
    for sig in SIGNATURES {
        let end = sig.offset + sig.magic.len();
        if data.len() >= end && &data[sig.offset..end] == sig.magic {
            // Special case: RIFF can be WAV or AVI or WebP
            if sig.magic == b"RIFF" && data.len() >= 12 {
                return match &data[8..12] {
                    b"WAVE" => FileFormat::WAV,
                    b"AVI " => FileFormat::AVI,
                    b"WEBP" => FileFormat::WebP,
                    _ => FileFormat::Unknown,
                };
            }
            return sig.format.clone();
        }
    }

    // Check for TAR (ustar at offset 257)
    if data.len() > 262 && &data[257..262] == b"ustar" {
        return FileFormat::TAR;
    }

    FileFormat::Unknown
}
