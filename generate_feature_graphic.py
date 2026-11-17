import os
from PIL import Image, ImageDraw, ImageFont

def create_feature_graphic():
    width = 1024
    height = 500
    img = Image.new("RGBA", (width, height), (7, 13, 34, 255)) # #070d22 dark navy
    draw = ImageDraw.Draw(img)

    # 1. Subtle gradient / court perspective lines
    # Draw dark blue court grid perspective
    grid_color = (0, 180, 255, 35)
    for x in range(0, width + 200, 80):
        draw.line([(x, height), (width // 2 + (x - width // 2) // 3, 0)], fill=grid_color, width=2)
    for y in range(height // 2, height, 40):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)

    # 2. Add decorative neon glow arcs
    draw.arc([-100, -100, 450, 450], start=0, end=360, fill=(0, 240, 255, 45), width=3)
    draw.arc([width - 350, 50, width + 250, 650], start=0, end=360, fill=(168, 85, 247, 45), width=3)

    # 3. Embed Badminton Icon if available
    icon_path = "frontend/public/playstore_icon_512.png"
    if os.path.exists(icon_path):
        icon = Image.open(icon_path).convert("RGBA")
        icon_resized = icon.resize((240, 240), Image.Resampling.LANCZOS)
        img.paste(icon_resized, (80, (height - 240) // 2), icon_resized)

    # 4. Text typography
    # Try to load a clean TTF font or fallback to default
    font_large = None
    font_sub = None
    font_badge = None
    font_paths = [
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\tahoma.ttf"
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font_large = ImageFont.truetype(fp, 56)
                font_sub = ImageFont.truetype(fp, 24)
                font_badge = ImageFont.truetype(fp, 18)
                break
            except Exception:
                pass

    if not font_large:
        font_large = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_badge = ImageFont.load_default()

    text_x = 360
    # App Category Badge
    badge_text = "AI BADMINTON ANALYTICS & TELEMETRY"
    draw.rectangle([text_x, 110, text_x + 360, 140], fill=(0, 240, 255, 30), outline=(0, 240, 255, 120), width=1)
    draw.text((text_x + 15, 116), badge_text, font=font_badge, fill=(0, 240, 255, 255))

    # App Title
    draw.text((text_x, 155), "RallyVision Pro", font=font_large, fill=(255, 255, 255, 255))

    # Subtitle / Key highlights
    draw.text((text_x, 235), "Real-Time Shot Tracking & Stroke Analysis", font=font_sub, fill=(226, 232, 240, 230))
    draw.text((text_x, 275), "Defensive Lifts • Smashes • Speed Telemetry", font=font_sub, fill=(148, 163, 184, 210))
    draw.text((text_x, 315), "100% Private & Secure Household Tracking", font=font_sub, fill=(56, 189, 248, 230))

    # Features Pill Tags
    pills = ["Offline Ready", "Zero Ad Tracking", "Smart Vision AI"]
    pill_x = text_x
    for p in pills:
        pill_w = len(p) * 11 + 24
        draw.rectangle([pill_x, 370, pill_x + pill_w, 404], fill=(15, 23, 42, 220), outline=(51, 65, 85, 255), width=1)
        draw.text((pill_x + 12, 377), p, font=font_badge, fill=(241, 245, 249, 230))
        pill_x += pill_w + 14

    # Convert to RGB (Play Store strictly requires JPEG or 24-bit PNG without alpha issues)
    final_img = Image.new("RGB", (width, height), (7, 13, 34))
    final_img.paste(img, (0, 0), img)

    os.makedirs("frontend/public", exist_ok=True)
    os.makedirs("docs", exist_ok=True)
    
    out_public = "frontend/public/playstore_feature_graphic_1024x500.png"
    out_docs = "docs/playstore_feature_graphic_1024x500.png"
    final_img.save(out_public, "PNG")
    final_img.save(out_docs, "PNG")
    print(f"Generated Play Store 1024x500 Feature Graphic: {out_public}")

if __name__ == "__main__":
    create_feature_graphic()
