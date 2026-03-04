use super::FieldRegion;
use byteorder::{BigEndian, ReadBytesExt};
use std::io::Cursor;

/// Parse PNG file structure into field regions.
pub fn parse_png(data: &[u8]) -> Vec<FieldRegion> {
    let mut regions = Vec::new();

    if data.len() < 8 {
        return regions;
    }

    // PNG Signature
    regions.push(FieldRegion::new(
        "PNG Signature",
        0,
        8,
        "header",
        "PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A",
        "\\x89PNG\\r\\n\\x1A\\n",
    ));

    let mut offset = 8;

    // Parse chunks
    while offset + 12 <= data.len() {
        let chunk_start = offset;

        // Read chunk length (4 bytes, big-endian)
        let mut cursor = Cursor::new(&data[offset..offset + 4]);
        let length = match cursor.read_u32::<BigEndian>() {
            Ok(l) => l as usize,
            Err(_) => break,
        };
        offset += 4;

        // Read chunk type (4 bytes ASCII)
        if offset + 4 > data.len() {
            break;
        }
        let chunk_type = String::from_utf8_lossy(&data[offset..offset + 4]).to_string();
        offset += 4;

        // Chunk data
        let data_start = offset;
        let data_end = (offset + length).min(data.len());
        offset = data_end;

        // CRC (4 bytes)
        let crc_end = (offset + 4).min(data.len());
        offset = crc_end;

        let chunk_end = offset;
        let chunk_type_upper = chunk_type.to_uppercase();

        let description = match chunk_type_upper.as_str() {
            "IHDR" => "Image Header — dimensions, bit depth, color type",
            "PLTE" => "Palette — color table for indexed color images",
            "IDAT" => "Image Data — compressed pixel data",
            "IEND" => "Image End — marks end of PNG datastream",
            "TRNS" => "Transparency — alpha information",
            "CHRM" => "Primary Chromaticities — color space info",
            "GAMA" => "Image Gamma — display gamma value",
            "ICCP" => "Embedded ICC Profile",
            "SBIT" => "Significant Bits",
            "SRGB" => "Standard RGB Color Space",
            "TEXT" => "Textual Data",
            "ZTXT" => "Compressed Textual Data",
            "ITXT" => "International Textual Data",
            "BKGD" => "Background Color",
            "HIST" => "Image Histogram",
            "PHYS" => "Physical Pixel Dimensions",
            "TIME" => "Image Last-Modification Time",
            _ => "Unknown chunk",
        };

        let mut children = vec![
            FieldRegion::new(
                "Length",
                chunk_start,
                chunk_start + 4,
                "metadata",
                &format!("Chunk data length: {} bytes", length),
                &length.to_string(),
            ),
            FieldRegion::new(
                "Type",
                chunk_start + 4,
                chunk_start + 8,
                "metadata",
                &format!("Chunk type code: {}", chunk_type),
                &chunk_type,
            ),
        ];

        if length > 0 {
            // Parse IHDR specially
            if chunk_type_upper == "IHDR" && length >= 13 {
                let ihdr_data = &data[data_start..data_end];
                let mut c = Cursor::new(ihdr_data);
                if let (Ok(width), Ok(height)) = (
                    c.read_u32::<BigEndian>(),
                    c.read_u32::<BigEndian>(),
                ) {
                    let bit_depth = ihdr_data.get(8).copied().unwrap_or(0);
                    let color_type = ihdr_data.get(9).copied().unwrap_or(0);
                    let color_type_name = match color_type {
                        0 => "Grayscale",
                        2 => "RGB",
                        3 => "Indexed",
                        4 => "Grayscale + Alpha",
                        6 => "RGBA",
                        _ => "Unknown",
                    };

                    children.push(FieldRegion::new(
                        "Width",
                        data_start,
                        data_start + 4,
                        "metadata",
                        "Image width in pixels",
                        &width.to_string(),
                    ));
                    children.push(FieldRegion::new(
                        "Height",
                        data_start + 4,
                        data_start + 8,
                        "metadata",
                        "Image height in pixels",
                        &height.to_string(),
                    ));
                    children.push(FieldRegion::new(
                        "Bit Depth",
                        data_start + 8,
                        data_start + 9,
                        "metadata",
                        "Bits per sample/palette index",
                        &bit_depth.to_string(),
                    ));
                    children.push(FieldRegion::new(
                        "Color Type",
                        data_start + 9,
                        data_start + 10,
                        "metadata",
                        &format!("{} ({})", color_type_name, color_type),
                        color_type_name,
                    ));
                }
            } else {
                children.push(FieldRegion::new(
                    "Data",
                    data_start,
                    data_end,
                    "payload",
                    &format!("{} bytes of chunk data", length),
                    &format!("[{} bytes]", length),
                ));
            }
        }

        if crc_end > data_end {
            children.push(FieldRegion::new(
                "CRC",
                data_end,
                crc_end,
                "checksum",
                "CRC32 checksum of type + data",
                &format!("0x{}", hex::encode(&data[data_end..crc_end])),
            ));
        }

        let chunk_region = FieldRegion::new(
            &format!("{} Chunk", chunk_type),
            chunk_start,
            chunk_end,
            "chunk",
            description,
            &format!("{} ({} bytes)", chunk_type, length),
        )
        .with_children(children);

        regions.push(chunk_region);

        if chunk_type_upper == "IEND" {
            break;
        }
    }

    regions
}
