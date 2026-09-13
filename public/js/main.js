/**
 * SamApi Frontend Core
 */
(function () {
  'use strict';

  // Theme
  const root = document.documentElement;
  const saved = localStorage.getItem('samapi-theme');
  if (saved) root.setAttribute('data-theme', saved);
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    root.setAttribute('data-theme', 'light');
  }

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('samapi-theme', next);
    });
  }

  // Mobile menu
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (mobileBtn && mobileNav) {
    mobileBtn.addEventListener('click', () => mobileNav.classList.toggle('open'));
  }

  // User dropdown
  const userBtn = document.getElementById('userMenuBtn');
  const userDrop = document.getElementById('userDropdown');
  if (userBtn && userDrop) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDrop.classList.toggle('open');
    });
    document.addEventListener('click', () => userDrop.classList.remove('open'));
  }

  // Toast
  window.showToast = function (message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = '0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  // Copy helper
  window.copyText = async function (text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = orig), 1500);
      }
      showToast('Copied to clipboard');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  // API Key visibility toggle
  document.querySelectorAll('[data-toggle-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.toggleKey);
      if (!target) return;
      const hidden = target.dataset.hidden === '1';
      if (hidden) {
        target.textContent = target.dataset.full;
        target.dataset.hidden = '0';
        btn.textContent = 'Hide';
      } else {
        target.textContent = target.dataset.full.replace(/.(?=.{4})/g, '•');
        target.dataset.hidden = '1';
        btn.textContent = 'Show';
      }
    });
  });

  // Sidebar mobile toggle
  const sideToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  if (sideToggle && sidebar) {
    sideToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
})();
