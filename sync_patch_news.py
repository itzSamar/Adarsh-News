#!/usr/bin/env python3
"""Refresh data/patch_news.json from Patch San Ramon headlines."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from patch_fetcher import fetch_patch_headlines

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data" / "patch_news.json"

SUMMARIES = {
    "art & wind festival": "San Ramon's annual Art & Wind Festival returns with kite demonstrations, food, music, and family activities.",
    "memorial day": "Memorial Day ceremony at Memorial Park with patriotic music, tributes, and a flag-placing ceremony.",
    "national merit": "San Ramon students received National Merit Scholarship awards.",
    "third thursday": "Third Thursday Arts & Eats brings food trucks, local art, and live music to San Ramon each summer month.",
    "weekly update": "City weekly update covering summer camps, recreation swims, festivals, and community events.",
    "budget": "San Ramon City Council reviewing the preliminary FY26-27 budget.",
    "michelin": "California restaurants added to the Michelin Guide — including spots relevant to the Bay Area dining scene.",
    "new laws": "New California laws taking effect — local impact for San Ramon residents.",
}


def guess_summary(title: str) -> str:
    lower = title.lower()
    for key, summary in SUMMARIES.items():
        if key in lower:
            return summary
    return f"Local San Ramon news: {title}"


def guess_category(title: str) -> str:
    lower = title.lower()
    if "festival" in lower or "arts" in lower:
        return "Events"
    if "memorial" in lower:
        return "Community"
    if "student" in lower or "school" in lower or "srvusd" in lower:
        return "Education"
    if "budget" in lower or "council" in lower:
        return "Politics"
    return "San Ramon"


def main() -> None:
    headlines = fetch_patch_headlines(10)
    items = [
        {
            "title": h.title,
            "summary": guess_summary(h.title),
            "category": guess_category(h.title),
            "url": h.source_url,
        }
        for h in headlines
        if "san ramon" in h.title.lower() or "memorial day" in h.title.lower() or "third thursday" in h.title.lower()
    ]
    if not items:
        items = [
            {
                "title": h.title,
                "summary": guess_summary(h.title),
                "category": guess_category(h.title),
                "url": h.source_url,
            }
            for h in headlines[:7]
        ]

    data = {
        "source": "https://patch.com/california/sanramon",
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "items": items,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Wrote {len(items)} items to {OUT}")


if __name__ == "__main__":
    main()
