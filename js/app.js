/**
 * The Adarsh News Outlet — front-end app
 * Loads stories from data/stories.json (static, GitHub Pages compatible)
 */

const STORIES_URL = 'data/stories.json';

const CATEGORY_LABELS = {
  campus: 'Campus',
  kingdom: 'Kingdom of San Ramon',
  sports: 'Sports',
  tech: 'Tech & Science',
  opinion: 'Opinion',
  lifestyle: 'Lifestyle',
  breaking: 'Breaking',
};

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function excerpt(body, maxLen = 140) {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLen) return flat;
  return flat.slice(0, maxLen).trim() + '…';
}

function renderFeatured(story) {
  const el = document.getElementById('featured-article');
  const cat = CATEGORY_LABELS[story.category] || story.category;

  el.innerHTML = `
    <div class="story-meta">
      <span class="story-category">${escapeHtml(cat)}</span>
      <span class="story-date">${escapeHtml(formatDate(story.date))}</span>
      <span class="story-byline">By ${escapeHtml(story.byline || 'Staff Reporter')}</span>
    </div>
    <h2 class="featured-headline">${escapeHtml(story.headline)}</h2>
    ${story.dek ? `<p class="featured-dek">${escapeHtml(story.dek)}</p>` : ''}
    <div class="story-body">
      ${story.body.map(p => `<p>${escapeHtml(p)}</p>`).join('')}
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
        <article class="story-card${active}" data-id="${escapeHtml(story.id)}" tabindex="0" role="button" aria-label="Read: ${escapeHtml(story.headline)}">
          <div class="story-meta">
            <span class="story-category">${escapeHtml(cat)}</span>
            <span class="story-date">${escapeHtml(formatDate(story.date))}</span>
          </div>
          <h3 class="story-card-headline">${escapeHtml(story.headline)}</h3>
          <p class="story-card-excerpt">${escapeHtml(excerpt(story.body.join(' ')))}</p>
        </article>
      `;
    })
    .join('');

  el.querySelectorAll('.story-card').forEach(card => {
    const open = () => selectStory(card.dataset.id, stories);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}

function renderArchive(stories, activeId) {
  const el = document.getElementById('archive-grid');
  el.innerHTML = stories
    .map(story => {
      const cat = CATEGORY_LABELS[story.category] || story.category;
      const active = story.id === activeId ? ' style="border-left:4px solid var(--accent)"' : '';
      return `
        <article class="archive-card" data-id="${escapeHtml(story.id)}"${active} tabindex="0" role="button">
          <div class="story-meta">
            <span class="story-category">${escapeHtml(cat)}</span>
            <span class="story-date">${escapeHtml(formatDate(story.date))}</span>
          </div>
          <h4>${escapeHtml(story.headline)}</h4>
          <p class="story-card-excerpt">${escapeHtml(excerpt(story.body.join(' '), 100))}</p>
        </article>
      `;
    })
    .join('');

  el.querySelectorAll('.archive-card').forEach(card => {
    const open = () => {
      selectStory(card.dataset.id, stories);
      document.getElementById('featured').scrollIntoView({ behavior: 'smooth' });
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
  el.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => {
      const label = CATEGORY_LABELS[cat] || cat;
      return `<li><span>${escapeHtml(label)}</span><span class="category-count">${count}</span></li>`;
    })
    .join('');
}

function selectStory(id, stories) {
  const story = stories.find(s => s.id === id);
  if (!story) return;
  renderFeatured(story);
  renderStoryList(stories, id);
  renderArchive(stories, id);
}

function pickFeaturedStory(stories) {
  const today = new Date().toISOString().slice(0, 10);
  const todayStory = stories.find(s => s.date === today);
  if (todayStory) return todayStory;
  return stories[0];
}

async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('today-date').textContent = formatDate(
    new Date().toISOString().slice(0, 10)
  );

  try {
    const res = await fetch(STORIES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const stories = (data.stories || []).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    if (stories.length === 0) {
      document.getElementById('featured-article').innerHTML =
        '<p class="loading">No stories yet. Run <code>python generate_story.py</code> to publish today\'s edition.</p>';
      return;
    }

    document.getElementById('story-count').textContent = stories.length;

    const featured = pickFeaturedStory(stories);
    renderFeatured(featured);
    renderStoryList(stories, featured.id);
    renderArchive(stories, featured.id);
    renderCategories(stories);
  } catch (err) {
    console.error(err);
    document.getElementById('featured-article').innerHTML =
      '<p class="loading">Could not load stories. Make sure <code>data/stories.json</code> exists.</p>';
  }
}

document.addEventListener('DOMContentLoaded', init);
