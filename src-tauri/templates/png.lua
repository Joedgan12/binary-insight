-- PNG Format Template
-- Parses PNG chunks and IHDR data

print("=== PNG Format Analysis ===")
print("File size: " .. file_size() .. " bytes")

-- Read PNG signature
local sig = read_bytes(8)
print("Signature: " .. tostring(sig))

-- Parse chunks
local chunk_count = 0
while not eof() do
    local length = read_u32_be()
    local chunk_type = read_string(4)
    chunk_count = chunk_count + 1

    print(string.format("Chunk #%d: %s (%d bytes)", chunk_count, chunk_type, length))
    label(chunk_type, length + 12, "chunk")

    -- Parse IHDR specially
    if chunk_type == "IHDR" and length >= 13 then
        local pos_before = tell()
        seek(pos_before)
        local width = read_u32_be()
        local height = read_u32_be()
        local bit_depth = read_u8()
        local color_type = read_u8()
        print(string.format("  Dimensions: %dx%d", width, height))
        print(string.format("  Bit depth: %d, Color type: %d", bit_depth, color_type))
        -- Skip remaining IHDR bytes
        local remaining = length - 13
        if remaining > 0 then
            read_bytes(remaining)
        end
        -- Read compression, filter, interlace
        local compression = read_u8()
        local filter = read_u8()
        local interlace = read_u8()
        print(string.format("  Compression: %d, Filter: %d, Interlace: %d", compression, filter, interlace))
    else
        -- Skip chunk data
        if length > 0 then
            read_bytes(length)
        end
    end

    -- Skip CRC
    read_bytes(4)

    if chunk_type == "IEND" then
        print("End of PNG data")
        break
    end
end

print(string.format("\nTotal chunks: %d", chunk_count))
