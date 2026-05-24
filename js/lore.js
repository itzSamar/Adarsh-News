document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(NewsSite.url('data/lore.json'));
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();

    const war = data.war;
    document.getElementById('war-name').textContent = war.name;
    document.getElementById('war-summary').textContent = war.summary;
    document.getElementById('war-status').textContent = war.current_status;

    document.getElementById('war-fronts').innerHTML = war.fronts
      .map(
        f => `<article class="lore-card"><h3>${NewsSite.escapeHtml(f.name)}</h3><p>${NewsSite.escapeHtml(f.description)}</p></article>`
      )
      .join('');

    document.getElementById('war-timeline').innerHTML = war.timeline
      .map(
        t => `<li class="timeline-item"><span class="timeline-date">${NewsSite.escapeHtml(t.date)}</span><span class="timeline-event">${NewsSite.escapeHtml(t.event)}</span></li>`
      )
      .join('');

    document.getElementById('characters').innerHTML = data.characters
      .map(c => {
        const rival = c.id === 'arjun' ? ' character-card--rival' : '';
        return `<article class="character-card${rival}">
          <p class="story-category">${NewsSite.escapeHtml(c.affiliation)}</p>
          <h3>${NewsSite.escapeHtml(c.name)}</h3>
          <p class="character-title">${NewsSite.escapeHtml(c.title)}</p>
          <p class="character-role">${NewsSite.escapeHtml(c.role)}</p>
          <p>${NewsSite.escapeHtml(c.bio)}</p>
          <p class="character-status"><em>${NewsSite.escapeHtml(c.status)}</em></p>
        </article>`;
      })
      .join('');
  } catch (err) {
    console.error(err);
    document.getElementById('war-name').textContent = 'Could not load lore.';
  }
});
