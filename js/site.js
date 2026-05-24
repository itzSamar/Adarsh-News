/** Shared helpers for GitHub Pages */
window.NewsSite = {
  asset(path) {
    return new URL(path, document.baseURI).pathname;
  },

  url(path) {
    return this.asset(path);
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

  initNav() {
    const page = document.body.dataset.page || 'home';
    const hash = window.location.hash;

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    if (page === 'lore') {
      document.querySelector('.nav-link[data-nav="lore"]')?.classList.add('active');
      return;
    }

    if (hash === '#podcast') {
      document.querySelector('.nav-link[data-nav="podcast"]')?.classList.add('active');
    } else {
      document.querySelector('.nav-link[data-nav="home"]')?.classList.add('active');
    }
  },

  initHeader() {
    const today = new Date().toISOString().slice(0, 10);
    const dateEl = document.getElementById('today-date');
    const yearEl = document.getElementById('year');
    if (dateEl) dateEl.textContent = this.formatDate(today);
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    this.initNav();
    window.addEventListener('hashchange', () => this.initNav());
  },
};

document.addEventListener('DOMContentLoaded', () => NewsSite.initHeader());
