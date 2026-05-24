#!/usr/bin/env python3
"""
Generate a daily satirical news story for The Adarsh News Outlet using Ollama.

Usage:
    python generate_story.py              # generate today's story if missing
    python generate_story.py --force      # regenerate today's story
    python generate_story.py --date 2026-05-20

Requires: ollama running locally (ollama serve) and a model pulled (default: llama3.2)
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
from datetime import date, datetime
from pathlib import Path

try:
    import ollama
except ImportError:
    print("Install dependencies: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent
STORIES_PATH = ROOT / "data" / "stories.json"

CATEGORIES = [
    "campus",
    "kingdom",
    "sports",
    "tech",
    "opinion",
    "lifestyle",
    "breaking",
]

BYLINES = [
    "Maya Chen, Campus Correspondent",
    "Jordan Reeves, Kingdom Bureau Chief",
    "Priya Sharma, Investigative Reporter",
    "Alex Kim, Sports Desk",
    "Sam Ortiz, Tech & Culture",
    "The San Ramon Gazette Staff",
]

SYSTEM_PROMPT = """You are a satirical news writer for "The Adarsh News Outlet," a fake newspaper \
that publishes humorous daily stories about Adarsh Upadhyaya.

Facts about the subject (use consistently):
- Adarsh Upadhyaya is a 9th grader at Quarry Lane High School in Dublin, California.
- He is widely known as "The King of San Ramon" (San Ramon, California is his royal domain).
- Stories should be lighthearted, absurd, and affectionate — like The Onion or local satire.
- Never mean-spirited, offensive, or include real harmful allegations.
- Invent plausible school/neighborhood scenarios: cafeteria diplomacy, hallway politics, \
  homework legends, bus stop summits, group chat decrees, PE class heroics, etc.

Output ONLY valid JSON with this exact schema (no markdown, no extra text):
{
  "headline": "string — punchy newspaper headline",
  "dek": "string — one-sentence subheadline in italics style",
  "category": "one of: campus, kingdom, sports, tech, opinion, lifestyle, breaking",
  "byline": "string — reporter name and title",
  "body": ["paragraph 1", "paragraph 2", "paragraph 3"]
}

Rules:
- headline: max 120 chars, newspaper style
- dek: witty one-liner summarizing the story
- body: exactly 3 paragraphs, 2-4 sentences each, third person journalism tone
- Make each story unique and randomly creative
"""


def load_stories() -> dict:
    if STORIES_PATH.exists():
        with open(STORIES_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {"stories": []}


def save_stories(data: dict) -> None:
    STORIES_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(STORIES_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def story_exists_for_date(stories: list, target: str) -> bool:
    return any(s.get("date") == target for s in stories)


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:60] or "story"


def parse_json_response(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def validate_story(story: dict) -> dict:
    required = {"headline", "dek", "category", "body"}
    missing = required - set(story.keys())
    if missing:
        raise ValueError(f"Missing fields: {missing}")

    if story["category"] not in CATEGORIES:
        story["category"] = random.choice(CATEGORIES)

    if not isinstance(story["body"], list) or len(story["body"]) < 2:
        raise ValueError("body must be a list of at least 2 paragraphs")

    story["headline"] = str(story["headline"]).strip()[:120]
    story["dek"] = str(story["dek"]).strip()
    story["byline"] = str(story.get("byline") or random.choice(BYLINES)).strip()
    story["body"] = [str(p).strip() for p in story["body"] if str(p).strip()]
    return story


def build_user_prompt(target_date: str, recent_headlines: list[str]) -> str:
    avoid = ""
    if recent_headlines:
        avoid = "Avoid repeating these recent headlines:\n" + "\n".join(recent_headlines[:5]) + "\n"

    seeds = [
        "a diplomatic incident in the cafeteria",
        "a new decree posted in the San Ramon group chat",
        "an unexpected alliance in PE class",
        "a homework assignment that becomes campus legend",
        "a bus stop summit with neighborhood officials",
        "a science fair project with royal implications",
        "a debate club controversy",
        "a lost-and-found mystery",
        "a vending machine treaty",
        "a hallway traffic reform initiative",
    ]
    seed = random.choice(seeds)

    return f"""Write today's edition for {target_date}.

Story seed (use as inspiration, be creative): {seed}

{avoid}
Category suggestion: {random.choice(CATEGORIES)}
Remember: output ONLY the JSON object, nothing else."""


def generate_with_ollama(target_date: str, model: str, recent_headlines: list[str]) -> dict:
    user_prompt = build_user_prompt(target_date, recent_headlines)

    response = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        options={
            "temperature": 0.95,
            "top_p": 0.9,
        },
    )

    raw = response["message"]["content"]
    return validate_story(parse_json_response(raw))


def make_story_record(story: dict, target_date: str) -> dict:
    story_id = f"{target_date}-{slugify(story['headline'])}"
    return {
        "id": story_id,
        "date": target_date,
        "headline": story["headline"],
        "dek": story["dek"],
        "category": story["category"],
        "byline": story["byline"],
        "body": story["body"],
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a daily Adarsh News story via Ollama")
    parser.add_argument("--date", help="ISO date (YYYY-MM-DD), default: today")
    parser.add_argument("--force", action="store_true", help="Replace existing story for that date")
    parser.add_argument("--model", default="llama3.2", help="Ollama model name (default: llama3.2)")
    args = parser.parse_args()

    target_date = args.date or date.today().isoformat()

    data = load_stories()
    stories = data.get("stories", [])

    if story_exists_for_date(stories, target_date) and not args.force:
        print(f"Story for {target_date} already exists. Use --force to regenerate.")
        return 0

    recent_headlines = [s["headline"] for s in sorted(stories, key=lambda x: x.get("date", ""), reverse=True)]

    print(f"Generating story for {target_date} using model '{args.model}'…")

    try:
        generated = generate_with_ollama(target_date, args.model, recent_headlines)
    except Exception as exc:
        print(f"Error generating story: {exc}", file=sys.stderr)
        print("\nMake sure Ollama is running: ollama serve", file=sys.stderr)
        print(f"And the model is pulled: ollama pull {args.model}", file=sys.stderr)
        return 1

    record = make_story_record(generated, target_date)

    if args.force:
        stories = [s for s in stories if s.get("date") != target_date]

    stories.append(record)
    stories.sort(key=lambda s: s.get("date", ""), reverse=True)
    data["stories"] = stories
    save_stories(data)

    print(f"Published: {record['headline']}")
    print(f"Saved to {STORIES_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
