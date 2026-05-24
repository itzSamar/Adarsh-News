# The Adarsh News Outlet

Live: [itzSamar.github.io/Adarsh-News](https://itzSamar.github.io/Adarsh-News/)

## Pages

| Page | File | What it is |
|------|------|------------|
| News Outlet | `index.html` | Real San Ramon headlines (Patch) + satirical Adarsh stories |
| **Adarsh** | `adarsh.html` | Separate podcast/broadcast page about Adarsh |
| Lore | `lore.html` | King of Dublin war, characters, timeline |

## Fix for "Could not load stories"

Stories load via `new URL('data/stories.json', document.baseURI)` — no fragile base-path logic. **Push all files** including `js/site.js` and `data/patch_news.json`.

## Real San Ramon news

```bash
python sync_patch_news.py   # refresh from Patch San Ramon
git add data/patch_news.json && git push
```

## Satirical stories (Ollama)

```bash
python generate_story.py --patch
```

## Adarsh podcast (TTS + optional CogVideo)

```bash
pip install edge-tts
python generate_adarsh_episode.py --episode 1
```

Optional video: clone [CogVideo](https://github.com/zai-org/CogVideo), set `COGVIDEO_DIR`, add MP4 to `adarsh/video/`.

## Deploy

GitHub Pages → **main** branch → **/ (root)**

```bash
git add . && git commit -m "Fix stories, add Adarsh page, Patch wire" && git push
```
