import os
from PIL import Image, ImageDraw, ImageFont

def draw_badminton_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size / 2
    r = size * 0.46

    # 1. Outer rounded shield background
    bg_color = (7, 13, 34, 255) # Deep navy #070d22
    rim_color = (0, 240, 255, 230) # Neon cyan #00f0ff
    
    # Draw circular background
    draw.ellipse([center - r, center - r, center + r, center + r], fill=bg_color, outline=rim_color, width=max(2, int(size * 0.035)))

    # 2. Draw subtle inner glow ring
    inner_r = r * 0.88
    draw.ellipse([center - inner_r, center - inner_r, center + inner_r, center + inner_r], outline=(0, 180, 255, 60), width=max(1, int(size * 0.015)))

    # 3. Draw Left Racket (Head at top-left, handle at bottom-right)
    # Head center: (center - r*0.35, center - r*0.25)
    scale = size / 512.0
    
    # Racket 1: angle approx -35 deg
    racket_color = (255, 255, 255, 240)
    cyan_accent = (0, 240, 255, 255)
    gold_accent = (255, 200, 50, 255)

    # Simplified clean geometric drawing scaled
    head1_center = (center - 70 * scale, center - 60 * scale)
    head2_center = (center + 70 * scale, center - 60 * scale)
    head_rx = 55 * scale
    head_ry = 65 * scale

    # Left racket head
    draw.ellipse([head1_center[0] - head_rx, head1_center[1] - head_ry, head1_center[0] + head_rx, head1_center[1] + head_ry], outline=cyan_accent, width=int(10 * scale))
    # Right racket head
    draw.ellipse([head2_center[0] - head_rx, head2_center[1] - head_ry, head2_center[0] + head_rx, head2_center[1] + head_ry], outline=racket_color, width=int(10 * scale))

    # Grid string lines inside left racket
    for i in range(-2, 3):
        x_off = i * 16 * scale
        draw.line([head1_center[0] + x_off, head1_center[1] - head_ry * 0.7, head1_center[0] + x_off, head1_center[1] + head_ry * 0.7], fill=(0, 240, 255, 90), width=max(1, int(2 * scale)))
    for j in range(-2, 3):
        y_off = j * 18 * scale
        draw.line([head1_center[0] - head_rx * 0.7, head1_center[1] + y_off, head1_center[0] + head_rx * 0.7, head1_center[1] + y_off], fill=(0, 240, 255, 90), width=max(1, int(2 * scale)))

    # Grid string lines inside right racket
    for i in range(-2, 3):
        x_off = i * 16 * scale
        draw.line([head2_center[0] + x_off, head2_center[1] - head_ry * 0.7, head2_center[0] + x_off, head2_center[1] + head_ry * 0.7], fill=(255, 255, 255, 90), width=max(1, int(2 * scale)))
    for j in range(-2, 3):
        y_off = j * 18 * scale
        draw.line([head2_center[0] - head_rx * 0.7, head2_center[1] + y_off, head2_center[0] + head_rx * 0.7, head2_center[1] + y_off], fill=(255, 255, 255, 90), width=max(1, int(2 * scale)))

    # Shafts crossing at bottom center
    # Shaft 1 (from left head to bottom right)
    draw.line([head1_center[0] + 25 * scale, head1_center[1] + 55 * scale, center + 120 * scale, center + 170 * scale], fill=cyan_accent, width=int(8 * scale))
    # Shaft 2 (from right head to bottom left)
    draw.line([head2_center[0] - 25 * scale, head2_center[1] + 55 * scale, center - 120 * scale, center + 170 * scale], fill=racket_color, width=int(8 * scale))

    # Handles / Grips
    draw.line([center + 90 * scale, center + 130 * scale, center + 130 * scale, center + 185 * scale], fill=(0, 180, 220, 255), width=int(14 * scale))
    draw.line([center - 90 * scale, center + 130 * scale, center - 130 * scale, center + 185 * scale], fill=(220, 220, 220, 255), width=int(14 * scale))

    # 4. Central Shuttlecock at upper apex
    shuttle_x = center
    shuttle_y = center - 80 * scale

    # Feathers (fan flare)
    draw.polygon([
        (shuttle_x - 30 * scale, shuttle_y - 25 * scale),
        (shuttle_x + 30 * scale, shuttle_y - 25 * scale),
        (shuttle_x + 12 * scale, shuttle_y + 20 * scale),
        (shuttle_x - 12 * scale, shuttle_y + 20 * scale)
    ], fill=(255, 255, 255, 230), outline=cyan_accent, width=max(1, int(2 * scale)))

    # Cork base (gold/cork dome at bottom)
    draw.chord([shuttle_x - 14 * scale, shuttle_y + 10 * scale, shuttle_x + 14 * scale, shuttle_y + 35 * scale], start=0, end=180, fill=gold_accent, outline=(255, 255, 255, 255), width=max(1, int(2 * scale)))

    # Speed streak dots
    draw.circle((center, center + 30 * scale), radius=4 * scale, fill=(0, 240, 255, 200))
    draw.circle((center, center + 55 * scale), radius=3 * scale, fill=(0, 240, 255, 140))
    draw.circle((center, center + 75 * scale), radius=2 * scale, fill=(0, 240, 255, 90))

    return img

# Target directories and sizes
targets = {
    "frontend/android/app/src/main/res/mipmap-mdpi": 48,
    "frontend/android/app/src/main/res/mipmap-hdpi": 72,
    "frontend/android/app/src/main/res/mipmap-xhdpi": 96,
    "frontend/android/app/src/main/res/mipmap-xxhdpi": 144,
    "frontend/android/app/src/main/res/mipmap-xxxhdpi": 192,
}

for folder, sz in targets.items():
    if os.path.exists(folder):
        icon = draw_badminton_icon(sz)
        icon.save(os.path.join(folder, "ic_launcher.png"), "PNG")
        icon.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")
        print(f"Generated {sz}x{sz} icon in {folder}")

# Also generate 512x512 official Google Play Store icon
playstore_icon = draw_badminton_icon(512)
os.makedirs("frontend/public", exist_ok=True)
playstore_icon.save("frontend/public/playstore_icon_512.png", "PNG")
playstore_icon.save("frontend/android/app/src/main/ic_launcher-playstore.png", "PNG")
print("Generated 512x512 Google Play Store official icon")

