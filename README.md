# The Adarsh News Outlet

A satirical news website covering **Adarsh Upadhyaya** — 9th grader at Quarry Lane High School and undisputed **King of San Ramon**. Built as a static site for [GitHub Pages](https://pages.github.com/), with daily stories generated locally via [Ollama](https://ollama.com/).

## Live site

After publishing to GitHub Pages, your site will be at:

`https://itzSamar.github.io/Adarsh-News/`

Repository: [github.com/itzSamar/Adarsh-News](https://github.com/itzSamar/Adarsh-News)

## Project structure

```
Adarsh-News/
├── index.html          # Main news site
├── css/style.css       # Newspaper styling
├── js/app.js           # Loads & displays stories
├── data/stories.json   # Story archive (committed to repo)
├── generate_story.py   # Ollama story generator
└── requirements.txt
```

## Daily story generation (Ollama)

1. **Install Ollama** — [ollama.com/download](https://ollama.com/download)

2. **Pull a model** (default is `llama3.2`):

   ```bash
   ollama pull llama3.2
   ```

3. **Install Python deps**:

   ```bash
   pip install -r requirements.txt
   ```

4. **Generate today's story**:

   ```bash
   python generate_story.py
   ```

   Options:
   - `--force` — replace today's story
   - `--date YYYY-MM-DD` — generate for a specific date
   - `--model mistral` — use a different Ollama model

5. **Commit and push** the updated `data/stories.json` so GitHub Pages shows the new edition.

### Automating daily posts

Run `generate_story.py` each morning (cron, launchd, etc.), then commit & push. GitHub Pages serves static files only — Ollama must run on your machine (or a server you control), not on GitHub's servers.

Example cron (8 AM daily):

```cron
0 8 * * * cd /path/to/Adarsh-News && python generate_story.py && git add data/stories.json && git commit -m "Daily edition" && git push
```

## Deploy to GitHub Pages

1. Create a repo on GitHub (e.g. `Adarsh-News`).

2. Push this project:

   ```bash
   git init
   git add .
   git commit -m "Launch The Adarsh News Outlet"
   git branch -M main
   git remote add origin git@github.com:itzSamar/Adarsh-News.git
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** / **/ (root)**

4. Wait a minute, then visit your Pages URL.

## Local preview

```bash
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080)

## Disclaimer

All stories are fictional satire — affectionate fan journalism, not real news.
