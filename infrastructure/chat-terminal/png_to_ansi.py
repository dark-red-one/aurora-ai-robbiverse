#!/usr/bin/env python3
"""Convert Robbie's PNG avatar to colorful ANSI art"""

from PIL import Image
import sys

def rgb_to_ansi(r, g, b):
    """Convert RGB to closest ANSI 256 color"""
    if r == g == b:
        if r < 8:
            return 16
        if r > 248:
            return 231
        return round(((r - 8) / 247) * 24) + 232
    
    ansi = 16
    ansi += 36 * round(r / 255 * 5)
    ansi += 6 * round(g / 255 * 5)
    ansi += round(b / 255 * 5)
    return ansi

def pixel_to_block(r, g, b):
    """Convert pixel to colored block character"""
    ansi = rgb_to_ansi(r, g, b)
    return f'\033[48;5;{ansi}m  \033[0m'

def convert_to_ansi(image_path, width=40):
    """Convert image to ANSI art"""
    img = Image.open(image_path)
    
    # Calculate height maintaining aspect ratio
    aspect = img.height / img.width
    height = int(width * aspect * 0.5)  # 0.5 because terminal chars are taller
    
    # Resize image
    img = img.resize((width, height), Image.Resampling.LANCZOS)
    img = img.convert('RGB')
    
    # Convert to ANSI
    ansi_lines = []
    for y in range(height):
        line = ""
        for x in range(width):
            r, g, b = img.getpixel((x, y))
            line += pixel_to_block(r, g, b)
        ansi_lines.append(line)
    
    return ansi_lines

if __name__ == "__main__":
    image_path = sys.argv[1] if len(sys.argv) > 1 else "robbie-friendly.png"
    width = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    
    lines = convert_to_ansi(image_path, width)
    
    # Output as JSON array for easy JS integration
    import json
    print(json.dumps(lines))

