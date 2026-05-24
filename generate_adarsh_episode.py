#!/usr/bin/env python3
"""
Generate Adarsh podcast episodes: TTS audio + optional CogVideo clip.

Usage:
    pip install edge-tts
    python generate_adarsh_episode.py --episode 1
    python generate_adarsh_episode.py --all   # one at a time

Optional CogVideo (local GPU): clone https://github.com/zai-org/CogVideo
Set COGVIDEO_DIR to the repo path. Video generation is optional — audio always works.

Output:
    adarsh/audio/ep1.mp3
    adarsh/video/ep1.mp4  (if CogVideo configured)
    updates data/adarsh_episodes.json
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EPISODES_JSON = ROOT / "data" / "adarsh_episodes.json"
AUDIO_DIR = ROOT / "adarsh" / "audio"
VIDEO_DIR = ROOT / "adarsh" / "video"


def load_episodes() -> dict:
    with open(EPISODES_JSON, encoding="utf-8") as f:
        return json.load(f)


def save_episodes(data: dict) -> None:
    with open(EPISODES_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


async def make_tts_edge(text: str, out_path: Path) -> None:
    import edge_tts
    communicate = edge_tts.Communicate(text, voice="en-US-GuyNeural")
    await communicate.save(str(out_path))


def make_tts_pyttsx3(text: str, out_path: Path) -> None:
    import pyttsx3
    engine = pyttsx3.init()
    engine.setProperty("rate", 165)
    engine.save_to_file(text, str(out_path))
    engine.runAndWait()


def make_tts(text: str, out_path: Path) -> Path:
    try:
        asyncio.run(make_tts_edge(text, out_path))
        return out_path
    except Exception as exc:
        print(f"  edge-tts failed ({exc}), trying pyttsx3…")
    try:
        wav_path = out_path.with_suffix(".wav")
        make_tts_pyttsx3(text, wav_path)
        return wav_path
    except Exception as exc2:
        print(f"  pyttsx3 failed: {exc2}", file=sys.stderr)
        sys.exit(1)


def maybe_cogvideo(prompt: str, out_path: Path) -> bool:
    cog_dir = os.environ.get("COGVIDEO_DIR")
    if not cog_dir:
        print("  (skip video — set COGVIDEO_DIR to CogVideo repo for AI video)")
        return False

    cog_path = Path(cog_dir)
    if not cog_path.exists():
        print(f"  COGVIDEO_DIR not found: {cog_path}", file=sys.stderr)
        return False

    print("  CogVideo: run inference manually — see CogVideo README for your GPU setup")
    print(f"  Prompt: {prompt[:120]}…")
    print(f"  Save output to: {out_path}")
    return False


def generate_one(episode_num: int) -> None:
    data = load_episodes()
    ep = next((e for e in data["episodes"] if e["episode"] == episode_num), None)
    if not ep:
        print(f"Episode {episode_num} not found", file=sys.stderr)
        sys.exit(1)

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)

    audio_path = AUDIO_DIR / f"ep{episode_num}.wav"
    video_path = VIDEO_DIR / f"ep{episode_num}.mp4"

    print(f"Episode {episode_num}: {ep['title']}")
    print("  generating TTS audio…")
    result_path = make_tts(ep["script"], audio_path)
    final_audio = result_path if isinstance(result_path, Path) else audio_path

    ep["audio_file"] = f"adarsh/audio/{final_audio.name}"
    ep["status"] = "ready"
    ep["generated_at"] = datetime.utcnow().isoformat() + "Z"

    video_prompt = (
        "cinematic news broadcast studio, teenage host at desk, professional lighting, "
        "slow camera movement, podcast aesthetic"
    )
    if maybe_cogvideo(video_prompt, video_path) and video_path.exists():
        ep["video_file"] = f"adarsh/video/ep{episode_num}.mp4"

    save_episodes(data)
    print(f"  done → {ep['audio_file']}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--episode", type=int, choices=[1, 2, 3, 4, 5])
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()

    if args.all:
        for n in range(1, 6):
            generate_one(n)
    elif args.episode:
        generate_one(args.episode)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
