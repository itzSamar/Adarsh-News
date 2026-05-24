/** Shared helpers — works on GitHub Pages without extra config */
window.NewsSite = {
  url(path) {
    return new URL(path, document.baseURI).href;
  },

  formatDate(isoDate) {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = String(text ?? '');
    return el.innerHTML;
  },

  initPage() {
    const today = new Date().toISOString().slice(0, 10);
    const dateEl = document.getElementById('today-date');
    const yearEl = document.getElementById('year');
    if (dateEl) dateEl.textContent = this.formatDate(today);
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const page = document.body.dataset.page;
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
  },
};

document.addEventListener('DOMContentLoaded', () => NewsSite.initPage());
