# The Adarsh News Outlet

Live: [itzSamar.github.io/Adarsh-News](https://itzSamar.github.io/Adarsh-News/)

## Pages

| Page | File | What it is |
|------|------|------------|
| News Outlet | `index.html` | Satirical Adarsh stories based on real San Ramon/Patch headlines |
| **Podcast** | `index.html#podcast` | Adarsh podcast audio on the same page |
| Lore | `lore.html` | King of Dublin war, characters, timeline |

## Fix for "Could not load stories"

Stories load via `new URL('data/stories.json', document.baseURI)` — no fragile base-path logic. **Push all files** including `js/site.js`.

## Real News + Adarsh Stories

Stories in `data/stories.json` include `patch_headline` when they are based on real Patch San Ramon items. The site shows those as Adarsh stories, not as a separate raw news feed.

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
git add . && git commit -m "Combine real news with Adarsh stories" && git push
```
