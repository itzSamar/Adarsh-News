/**
 * Main page: Patch-inspired Adarsh stories + podcast
 */

const CATEGORY_LABELS = {
  campus: 'Campus',
  kingdom: 'Kingdom of San Ramon',
  war: 'War Desk',
  sports: 'Sports',
  tech: 'Tech & Science',
  opinion: 'Opinion',
  lifestyle: 'Lifestyle',
  breaking: 'Breaking',
  local: 'San Ramon Local',
};

function excerpt(body, maxLen = 140) {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLen) return flat;
  return flat.slice(0, maxLen).trim() + '…';
}

function renderFeatured(story) {
  const el = document.getElementById('featured-article');
  const cat = CATEGORY_LABELS[story.category] || story.category;
  const patchBadge = story.patch_headline
    ? `<p class="patch-badge">Based on a real Patch San Ramon headline: <em>${NewsSite.escapeHtml(story.patch_headline)}</em></p>`
    : '';

  el.innerHTML = `
    <div class="story-meta">
      <span class="story-category">${NewsSite.escapeHtml(cat)}</span>
      <span class="story-date">${NewsSite.escapeHtml(NewsSite.formatDate(story.date))}</span>
      <span class="story-byline">By ${NewsSite.escapeHtml(story.byline || 'Staff Reporter')}</span>
    </div>
    ${patchBadge}
    <h2 class="featured-headline">${NewsSite.escapeHtml(story.headline)}</h2>
    ${story.dek ? `<p class="featured-dek">${NewsSite.escapeHtml(story.dek)}</p>` : ''}
    <div class="story-body">
      ${story.body.map(p => `<p>${NewsSite.escapeHtml(p)}</p>`).join('')}
    </div>
  `;
}

function renderStoryList(stories, activeId) {
  const el = document.getElementById('story-list');
  el.innerHTML = stories
    .slice(0, 8)
    .map(story => {
      const cat = CATEGORY_LABELS[story.category] || story.category;
      const active = story.id === activeId ? ' active' : '';
      return `
        <article class="story-card${active}" data-id="${NewsSite.escapeHtml(story.id)}" tabindex="0" role="button">
          <div class="story-meta">
            <span class="story-category">${NewsSite.escapeHtml(cat)}</span>
            <span class="story-date">${NewsSite.escapeHtml(NewsSite.formatDate(story.date))}</span>
          </div>
          <h3 class="story-card-headline">${NewsSite.escapeHtml(story.headline)}</h3>
          <p class="story-card-excerpt">${NewsSite.escapeHtml(excerpt(story.body.join(' ')))}</p>
        </article>`;
    })
    .join('');
  bindCards(el, stories);
}

function renderArchive(stories, activeId) {
  const el = document.getElementById('archive-grid');
  el.innerHTML = stories
    .map(story => {
      const cat = CATEGORY_LABELS[story.category] || story.category;
      const active = story.id === activeId ? ' style="border-left:4px solid var(--accent)"' : '';
      return `
        <article class="archive-card" data-id="${NewsSite.escapeHtml(story.id)}"${active} tabindex="0" role="button">
          <div class="story-meta">
            <span class="story-category">${NewsSite.escapeHtml(cat)}</span>
            <span class="story-date">${NewsSite.escapeHtml(NewsSite.formatDate(story.date))}</span>
          </div>
          <h4>${NewsSite.escapeHtml(story.headline)}</h4>
          <p class="story-card-excerpt">${NewsSite.escapeHtml(excerpt(story.body.join(' '), 100))}</p>
        </article>`;
    })
    .join('');
  bindCards(el, stories, true);
}

function bindCards(el, stories, scrollUp) {
  el.querySelectorAll('[data-id]').forEach(card => {
    const open = () => {
      const story = stories.find(s => s.id === card.dataset.id);
      if (!story) return;
      renderFeatured(story);
      renderStoryList(stories, story.id);
      renderArchive(stories, story.id);
      if (scrollUp) document.getElementById('featured').scrollIntoView({ behavior: 'smooth' });
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}

function renderCategories(stories) {
  const counts = {};
  stories.forEach(s => {
    counts[s.category] = (counts[s.category] || 0) + 1;
  });
  const el = document.getElementById('category-list');
  if (!el) return;
  el.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => {
      const label = CATEGORY_LABELS[cat] || cat;
      return `<li><span>${NewsSite.escapeHtml(label)}</span><span class="category-count">${count}</span></li>`;
    })
    .join('');
}

function normalizeStories(raw) {
  return raw.map((s, i) => ({
    ...s,
    id: s.id || `${s.date}-story-${i}`,
  }));
}

function pickFeatured(stories) {
  const today = new Date().toISOString().slice(0, 10);
  return stories.find(s => s.date === today) || stories[0];
}

let podcastEpisodes = [];

function renderPodcastFeatured(ep) {
  const el = document.getElementById('podcast-featured');
  if (!el || !ep) return;

  const audioSrc = ep.audio_file ? NewsSite.asset(ep.audio_file) : null;

  el.innerHTML = `
    <article class="podcast-feature">
      <div class="story-meta">
        <span class="story-category">Episode ${ep.episode}</span>
        <span class="story-date">${NewsSite.escapeHtml(NewsSite.formatDate(ep.date))}</span>
      </div>
      <h3 class="podcast-ep-title">${NewsSite.escapeHtml(ep.title)}</h3>
      <p class="featured-dek">${NewsSite.escapeHtml(ep.description)}</p>
      ${
        audioSrc
          ? `<audio class="podcast-player" controls preload="metadata" src="${audioSrc}">Your browser does not support audio.</audio>`
          : `<p class="episode-pending">Audio coming soon for this episode.</p>`
      }
    </article>`;
}

function renderPodcastList(episodes, activeId) {
  const el = document.getElementById('podcast-list');
  if (!el) return;

  el.innerHTML = episodes
    .map(ep => {
      const ready = ep.status === 'ready' && ep.audio_file;
      const active = ep.id === activeId ? ' podcast-item--active' : '';
      return `
        <button type="button" class="podcast-item${active}" data-ep-id="${NewsSite.escapeHtml(ep.id)}">
          <span class="ep-num">${ep.episode}</span>
          <span class="ep-info">
            <strong>${NewsSite.escapeHtml(ep.title)}</strong>
            <small>${ready ? 'Ready to play' : 'Coming soon'}</small>
          </span>
        </button>`;
    })
    .join('');

  el.querySelectorAll('.podcast-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const ep = episodes.find(e => e.id === btn.dataset.epId);
      if (!ep) return;
      renderPodcastFeatured(ep);
      renderPodcastList(episodes, ep.id);
    });
  });
}

async function loadPodcast() {
  const featuredEl = document.getElementById('podcast-featured');
  if (!featuredEl) return;

  try {
    const res = await fetch(NewsSite.asset('data/adarsh_episodes.json'));
    if (!res.ok) throw new Error('episodes ' + res.status);
    const data = await res.json();
    podcastEpisodes = (data.episodes || []).sort((a, b) => b.date.localeCompare(a.date));

    const tagline = document.getElementById('podcast-tagline');
    if (tagline) tagline.textContent = data.tagline || "The King's broadcast";

    const current = podcastEpisodes.find(e => e.status === 'ready' && e.audio_file) || podcastEpisodes[0];
    renderPodcastFeatured(current);
    renderPodcastList(podcastEpisodes, current?.id);
  } catch (err) {
    console.error('Podcast load error:', err);
    featuredEl.innerHTML = '<p class="loading">Could not load podcast episodes.</p>';
  }
}

async function init() {
  try {
    const storiesRes = await fetch(NewsSite.asset('data/stories.json'));
    if (!storiesRes.ok) throw new Error('stories.json ' + storiesRes.status);

    const data = await storiesRes.json();
    const stories = normalizeStories(data.stories || []).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    if (!stories.length) {
      document.getElementById('featured-article').innerHTML =
        '<p class="loading">No stories yet.</p>';
    } else {
      document.getElementById('story-count').textContent = stories.length;
      const featured = pickFeatured(stories);
      renderFeatured(featured);
      renderStoryList(stories, featured.id);
      renderArchive(stories, featured.id);
      renderCategories(stories);
    }

    await loadPodcast();
  } catch (err) {
    console.error(err);
    document.getElementById('featured-article').innerHTML =
      '<p class="loading">Could not load stories.</p>';
  }
}

document.addEventListener('DOMContentLoaded', init);
