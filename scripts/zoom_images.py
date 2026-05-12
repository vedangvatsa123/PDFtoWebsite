import os
from PIL import Image

image_dir = '/Users/vedang/Desktop/linkedin_viral_posts'

# Format: filename, (crop_left_pct, crop_top_pct, crop_right_pct, crop_bottom_pct)
# This dictates how much we crop off each side.
# e.g., (0.1, 0.15, 0.1, 0.15) means crop 10% from left/right, 15% from top/bottom.
crops = {
    '1_toxic_slack.png': (0.10, 0.15, 0.10, 0.20),
    '2_delusional_recruiter.png': (0.15, 0.20, 0.15, 0.20),
    '3_unhinged_rto.png': (0.15, 0.25, 0.15, 0.30),
    '4_chatgpt_firing.png': (0.05, 0.25, 0.05, 0.25),
    '5_weekend_email.png': (0.15, 0.20, 0.15, 0.25),
    '6_unlimited_pto_trap.png': (0.15, 0.25, 0.15, 0.30),
    '7_unpaid_startup.png': (0.15, 0.25, 0.15, 0.30),
    '8_mouse_tracker.png': (0.10, 0.20, 0.10, 0.30),
    '9_automated_rejection.png': (0.20, 0.25, 0.20, 0.30),
    '10_sick_day_zoom.png': (0.20, 0.30, 0.20, 0.30)
}

for filename, (left_pct, top_pct, right_pct, bottom_pct) in crops.items():
    path = os.path.join(image_dir, filename)
    if not os.path.exists(path):
        print(f"Skipping {filename}, not found.")
        continue
        
    img = Image.open(path)
    width, height = img.size
    
    left = width * left_pct
    top = height * top_pct
    right = width * (1 - right_pct)
    bottom = height * (1 - bottom_pct)
    
    img_cropped = img.crop((left, top, right, bottom))
    img_cropped.save(path)
    print(f"Zoomed in {filename}")
