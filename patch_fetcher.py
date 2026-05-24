"""Fetch headlines from Patch San Ramon for story generation."""

from __future__ import annotations

import json
import re
import subprocess
import urllib.request
from dataclasses import dataclass

PATCH_URL = "https://patch.com/california/sanramon"
USER_AGENT = "Mozilla/5.0 (compatible; AdarshNewsBot/1.0)"


@dataclass
class PatchHeadline:
    title: str
    source_url: str = PATCH_URL


def _fetch_html(url: str) -> str:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception:
        result = subprocess.run(
            ["curl", "-sL", url, "-H", f"User-Agent: {USER_AGENT}"],
            capture_output=True,
            text=True,
            check=True,
            timeout=30,
        )
        return result.stdout


def _extract_from_next_data(html: str) -> list[str]:
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not match:
        return []

    data = json.loads(match.group(1))
    found: list[str] = []

    def walk(node, depth: int = 0) -> None:
        if depth > 24:
            return
        if isinstance(node, dict):
            for key in ("headline", "title"):
                val = node.get(key)
                if isinstance(val, str) and len(val) >= 15:
                    found.append(val)
            for val in node.values():
                walk(val, depth + 1)
        elif isinstance(node, list):
            for item in node:
                walk(item, depth + 1)

    walk(data)
    return found


def _extract_from_json_ld(html: str) -> list[str]:
    return re.findall(r'"headline":"((?:\\.|[^"\\])*)"', html)


def fetch_patch_headlines(limit: int = 12) -> list[PatchHeadline]:
    html = _fetch_html(PATCH_URL)
    raw_titles = _extract_from_next_data(html)
    if not raw_titles:
        raw_titles = [_decode_title(t) for t in _extract_from_json_ld(html)]

    seen: set[str] = set()
    headlines: list[PatchHeadline] = []

    skip_fragments = (
        "patch local partner",
        "community members love",
        "jazzercise",
        "thrift store",
        "tedx",
        "shine dance",
        "politics & government",
        "alameda county industries",
    )

    for title in raw_titles:
        title = title.strip()
        key = title.lower()
        if not title or key in seen:
            continue
        if any(s in key for s in skip_fragments):
            continue
        if len(title) < 15:
            continue
        seen.add(key)
        headlines.append(PatchHeadline(title=title))
        if len(headlines) >= limit:
            break

    return headlines


def _decode_title(raw: str) -> str:
    try:
        return json.loads(f'"{raw}"')
    except json.JSONDecodeError:
        return raw.replace("\\u0026", "&").replace("\\u2019", "'")


def pick_headline(headlines: list[PatchHeadline] | None = None) -> PatchHeadline | None:
    import random

    items = headlines or fetch_patch_headlines()
    return random.choice(items) if items else None


if __name__ == "__main__":
    for h in fetch_patch_headlines():
        print(h.title)
