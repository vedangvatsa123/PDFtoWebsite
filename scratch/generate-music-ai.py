#!/usr/bin/env python3
"""
Generate 15 unique music tracks using Meta's MusicGen (free, open source).
Each track gets a different mood/style prompt.
"""
import os
import sys

print("Loading MusicGen model (first run downloads ~500MB)...")
from transformers import pipeline
import scipy.io.wavfile
import numpy as np

synthesiser = pipeline("text-to-audio", "facebook/musicgen-small", device="cpu")

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "music")
os.makedirs(out_dir, exist_ok=True)

# 15 unique prompts — fun, playful, upbeat
prompts = [
    "upbeat lo-fi hip hop beat with jazzy piano chords, fun and playful",
    "sunny acoustic guitar melody, happy and carefree summer vibes",
    "bouncy electronic pop beat with bright synths and claps",
    "chill tropical house with ocean waves and steel drums",
    "playful pizzicato strings with light percussion, quirky and fun",
    "groovy funk bass line with wah guitar, feel-good party",
    "dreamy indie pop with shimmering guitars and soft drums",
    "uplifting dance beat with piano drops and euphoric melody",
    "mellow bossa nova with nylon guitar and light brushes",
    "energetic retro synthwave with driving bass and arpeggios",
    "happy ukulele strumming with light tambourine, carefree",
    "smooth jazz with walking bass and brushed snare, cool vibes",
    "bright chiptune melody with bouncy 8-bit drums, playful",
    "warm R&B beat with soft keys and vinyl crackle, cozy",
    "festive marimba melody with hand claps, joyful celebration",
]

for i, prompt in enumerate(prompts):
    n = i + 1
    outfile = os.path.join(out_dir, f"track{n:02d}.wav")
    print(f"  🎵 #{n:02d} generating: {prompt[:50]}...")
    
    try:
        music = synthesiser(
            prompt,
            forward_params={"do_sample": True, "max_new_tokens": 512}
        )
        scipy.io.wavfile.write(
            outfile,
            rate=music["sampling_rate"],
            data=music["audio"].squeeze()
        )
        size_kb = os.path.getsize(outfile) // 1024
        print(f"  ✅ #{n:02d} — {size_kb}KB")
    except Exception as e:
        print(f"  ❌ #{n:02d} — {e}")

print(f"\nDone. {len(prompts)} tracks in {out_dir}")
