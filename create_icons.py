#!/usr/bin/env python3
"""
Simple script to create placeholder PNG icons for Chrome extension
"""

import struct
import zlib

def create_png(width, height, bg_color=(255, 165, 0), text_color=(255, 255, 255)):
    """Create a simple PNG with a colored background"""

    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk (image header)
    def make_chunk(chunk_type, data):
        chunk = chunk_type + data
        crc = zlib.crc32(chunk) & 0xffffffff
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', crc)

    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = make_chunk(b'IHDR', ihdr_data)

    # Create image data with orange background and a simple pattern
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type: None
        for x in range(width):
            # Create a simple mosaic/pixelated pattern in the center
            center_x, center_y = width // 2, height // 2
            dist = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5

            # Create concentric squares pattern
            if abs(x - center_x) < width // 4 and abs(y - center_y) < height // 4:
                # Inner square - lighter color
                r, g, b = 255, 200, 100
            else:
                # Outer area - main color
                r, g, b = bg_color

            raw_data += bytes([r, g, b])

    # Compress the image data
    compressed_data = zlib.compress(raw_data, 9)
    idat_chunk = make_chunk(b'IDAT', compressed_data)

    # IEND chunk
    iend_chunk = make_chunk(b'IEND', b'')

    # Combine all parts
    png_data = png_signature + ihdr_chunk + idat_chunk + iend_chunk
    return png_data

# Create icons
sizes = [16, 48, 128]
for size in sizes:
    png_data = create_png(size, size)
    with open(f'/home/user/mosaic-man/icons/icon{size}.png', 'wb') as f:
        f.write(png_data)
    print(f'Created icon{size}.png')

print('All icons created successfully!')
