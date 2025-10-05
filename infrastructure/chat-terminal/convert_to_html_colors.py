#!/usr/bin/env python3
"""Convert Robbie's PNG to HTML with inline color spans"""

from PIL import Image
import json

# ANSI 256 color palette to RGB
def ansi256_to_rgb(code):
    """Convert ANSI 256 color code to RGB hex"""
    if code < 16:
        # Standard colors
        colors = [
            '000000', '800000', '008000', '808000', '000080', '800080', '008080', 'c0c0c0',
            '808080', 'ff0000', '00ff00', 'ffff00', '0000ff', 'ff00ff', '00ffff', 'ffffff'
        ]
        return colors[code]
    elif code < 232:
        # 216 color cube
        code -= 16
        r = (code // 36) * 51
        g = ((code % 36) // 6) * 51
        b = (code % 6) * 51
        return f'{r:02x}{g:02x}{b:02x}'
    else:
        # Grayscale
        gray = 8 + (code - 232) * 10
        return f'{gray:02x}{gray:02x}{gray:02x}'

def convert_to_html(image_path, width=35):
    """Convert image to HTML colored blocks"""
    img = Image.open(image_path)
    
    # Calculate height maintaining aspect ratio
    aspect = img.height / img.width
    height = int(width * aspect * 0.5)
    
    # Resize image
    img = img.resize((width, height), Image.Resampling.LANCZOS)
    img = img.convert('RGB')
    
    # Convert to HTML lines
    html_lines = []
    for y in range(height):
        line_spans = []
        for x in range(width):
            r, g, b = img.getpixel((x, y))
            # Convert to hex
            hex_color = f'#{r:02x}{g:02x}{b:02x}'
            line_spans.append(f'<span style="background-color:{hex_color};color:{hex_color};">██</span>')
        html_lines.append(''.join(line_spans))
    
    return html_lines

if __name__ == "__main__":
    import sys
    image_path = sys.argv[1] if len(sys.argv) > 1 else "robbie-friendly.png"
    width = int(sys.argv[2]) if len(sys.argv) > 2 else 35
    
    lines = convert_to_html(image_path, width)
    
    # Output as JSON array
    print(json.dumps(lines))

