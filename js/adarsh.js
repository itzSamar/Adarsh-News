document.addEventListener('DOMContentLoaded', async () => {
  const featuredEl = document.getElementById('featured-episode');
  const listEl = document.getElementById('episode-list');

  function mediaSrc(ep, field) {
    const file = ep[field];
    return file ? NewsSite.url(file) : null;
  }

  function renderFeatured(ep) {
    const audio = mediaSrc(ep, 'audio_file');
    const video = mediaSrc(ep, 'video_file');

    featuredEl.innerHTML = `
      <article class="episode-feature">
        <div class="episode-meta">
          <span class="story-category">Episode ${ep.episode}</span>
          <span class="story-date">${NewsSite.escapeHtml(NewsSite.formatDate(ep.date))}</span>
        </div>
        <h3 class="featured-headline">${NewsSite.escapeHtml(ep.title)}</h3>
        <p class="featured-dek">${NewsSite.escapeHtml(ep.description)}</p>
        ${
          video
            ? `<div class="media-wrap"><video controls src="${NewsSite.escapeHtml(video)}"></video></div>`
            : audio
              ? `<div class="media-wrap audio-wrap"><audio controls src="${NewsSite.escapeHtml(audio)}"></audio></div>`
              : `<p class="episode-pending">Audio not generated yet. Run <code>python generate_adarsh_episode.py --episode ${ep.episode}</code></p>`
        }
        <blockquote class="episode-script">${NewsSite.escapeHtml(ep.script)}</blockquote>
      </article>`;
  }

  function renderList(episodes, activeId) {
    listEl.innerHTML = episodes
      .map(ep => {
        const ready = ep.status === 'ready';
        const active = ep.id === activeId ? ' episode-row--active' : '';
        return `
          <article class="episode-row${active}" data-id="${NewsSite.escapeHtml(ep.id)}" tabindex="0" role="button">
            <span class="ep-num">${ep.episode}</span>
            <div>
              <h4>${NewsSite.escapeHtml(ep.title)}</h4>
              <p>${NewsSite.escapeHtml(ep.description)}</p>
              <span class="ep-status">${ready ? 'Ready' : 'Pending'}</span>
            </div>
          </article>`;
      })
      .join('');

    listEl.querySelectorAll('.episode-row').forEach(row => {
      const open = () => {
        const ep = episodes.find(e => e.id === row.dataset.id);
        if (!ep) return;
        renderFeatured(ep);
        renderList(episodes, ep.id);
      };
      row.addEventListener('click', open);
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  try {
    const res = await fetch(NewsSite.url('data/adarsh_episodes.json'));
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const episodes = (data.episodes || []).sort((a, b) => b.date.localeCompare(a.date));

    document.getElementById('show-tagline').textContent = data.tagline || 'Adarsh';

    const current = episodes.find(e => e.status === 'ready') || episodes[0];
    renderFeatured(current);
    renderList(episodes, current.id);
  } catch (err) {
    console.error(err);
    featuredEl.innerHTML = '<p class="loading">Could not load episodes.</p>';
  }
});
