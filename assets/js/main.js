document.addEventListener('DOMContentLoaded', async () => {
  await loadSiteIncludes();
  initResolvedAssets(document);
  initCurrentYear(document);
  initSiteNavigation();
  initMobileSliders();
  initIncludeProtocolNotice();
});

function getMainScriptElement() {
  const current = document.currentScript;
  if (current && current.src) return current;

  return Array.from(document.querySelectorAll('script[src]')).find((script) => {
    return /assets\/js\/main\.js(?:\?.*)?$/i.test(script.getAttribute('src') || '');
  });
}

function getSiteRootUrl() {
  const script = getMainScriptElement();

  if (script && script.src) {
    return new URL('../../', script.src);
  }

  return new URL('./', window.location.href);
}

function siteUrl(relativePath) {
  const root = getSiteRootUrl();
  const cleanPath = String(relativePath || '').replace(/^\/+/, '');
  return new URL(cleanPath, root).href;
}

async function loadSiteIncludes() {
  const headerHost = document.getElementById('site-header');
  const footerHost = document.getElementById('site-footer');

  const tasks = [];

  if (headerHost) {
    tasks.push(loadInclude(headerHost, 'includes/header.html'));
  }

  if (footerHost) {
    tasks.push(loadInclude(footerHost, 'includes/footer.html'));
  }

  await Promise.all(tasks);
}

async function loadInclude(target, relativePath) {
  try {
    const response = await fetch(siteUrl(relativePath), {
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    target.innerHTML = html;

    initResolvedAssets(target);
    initCurrentYear(target);
  } catch (error) {
    console.warn(`[HopeDent] Include-ul nu a putut fi încărcat: ${relativePath}`, error);
  }
}

function initResolvedAssets(scope) {
  scope.querySelectorAll('[data-site-link]').forEach((element) => {
    const value = element.getAttribute('data-site-link');
    if (value) {
      element.setAttribute('href', siteUrl(value));
    }
  });

  scope.querySelectorAll('[data-site-src]').forEach((element) => {
    const value = element.getAttribute('data-site-src');
    if (value) {
      element.setAttribute('src', siteUrl(value));
    }
  });
}

function initCurrentYear(scope) {
  scope.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}

function initSiteNavigation() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  markActiveMenuLink(nav);
  initMobileMenu(nav);
  initStickyNav(nav);
}

function markActiveMenuLink(nav) {
  const currentKey = getRouteKey(getCurrentRelativePath());

  nav.querySelectorAll('a[href]').forEach((link) => {
    const href = (link.getAttribute('href') || '').trim();

    if (!href) return;
    if (href.startsWith('#')) return;
    if (/^(tel:|mailto:|javascript:)/i.test(href)) return;

    const linkPath = getRelativePathFromAbsolute(href);
    const linkKey = getRouteKey(linkPath);

    if (linkKey === currentKey) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

function getCurrentRelativePath() {
  return getRelativePathFromAbsolute(window.location.href);
}

function getRelativePathFromAbsolute(absoluteUrl) {
  const url = new URL(absoluteUrl, window.location.href);
  const root = getSiteRootUrl();

  let path = decodeURIComponent(url.pathname);
  const rootPath = decodeURIComponent(root.pathname).replace(/\/$/, '');

  if (url.protocol === 'file:' && root.protocol === 'file:') {
    if (path.startsWith(rootPath)) {
      path = path.slice(rootPath.length);
    }
  }

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return normalizePath(path);
}

function normalizePath(path) {
  let value = String(path || '/')
    .split('?')[0]
    .split('#')[0];

  value = value.replace(/\/index\.html$/i, '/');
  value = value.replace(/index\.html$/i, '/');

  if (value.length > 1) {
    value = value.replace(/\/+$/, '');
  }

  return value || '/';
}

function getRouteKey(path) {
  const normalized = normalizePath(path);

  if (normalized === '/' || normalized === '/index.html') {
    return 'home';
  }

  if (
    normalized === '/specialitati' ||
    normalized === '/tratamente.html' ||
    normalized.startsWith('/specialitati/')
  ) {
    return 'tratamente';
  }

  if (
    normalized === '/blog' ||
    normalized === '/blog.html' ||
    normalized.startsWith('/blog/')
  ) {
    return 'blog';
  }

  return normalized;
}

function initMobileMenu(nav) {
  const mobileBtn = nav.querySelector('#mobileMenuBtn');
  const navLinks = nav.querySelector('.nav-links');
  const dropdowns = nav.querySelectorAll('.nav-dropdown');

  if (!mobileBtn || !navLinks) return;

  if (!navLinks.id) {
    navLinks.id = 'site-nav-links';
  }

  mobileBtn.setAttribute('aria-controls', navLinks.id);
  mobileBtn.setAttribute('aria-expanded', 'false');

  const backdrop = getOrCreateMenuBackdrop();

  const closeDropdowns = () => {
    dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector('.nav-dropdown-toggle');

      dropdown.classList.remove('is-open');

      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  };

  const setOpenState = (isOpen) => {
    nav.classList.toggle('is-open', isOpen);
    navLinks.classList.toggle('active', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    if (!isOpen) {
      closeDropdowns();
    }
  };

  mobileBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    setOpenState(!nav.classList.contains('is-open'));
  });

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');

    if (!toggle) return;

    toggle.addEventListener('click', (event) => {
      if (window.innerWidth > 768) return;

      event.preventDefault();
      event.stopPropagation();

      const isCurrentlyOpen = dropdown.classList.contains('is-open');

      // If this dropdown is already open, just close it
      if (isCurrentlyOpen) {
        dropdown.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        return;
      }

      // Otherwise, close all dropdowns and open this one
      closeDropdowns();
      dropdown.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    });
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setOpenState(false);
    });
  });

  backdrop.addEventListener('click', () => {
    setOpenState(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpenState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      setOpenState(false);
    }
  });
}

function getOrCreateMenuBackdrop() {
  let backdrop = document.querySelector('.site-menu-backdrop');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'site-menu-backdrop';
    document.body.appendChild(backdrop);
  }

  return backdrop;
}

function initStickyNav(nav) {
  const isInnerPage =
    document.body.classList.contains('inner-page') ||
    !!document.querySelector('.page-hero--inner');

  if (isInnerPage) {
    nav.classList.add('solid');
    nav.classList.add('nav-always-solid');
    return;
  }

  const onScroll = () => {
    nav.classList.toggle('solid', window.scrollY > 50);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initMobileSliders() {
  const sliders = document.querySelectorAll('[data-mobile-slider]');
  const mobileQuery = window.matchMedia('(max-width: 768px)');

  const setupSlider = (slider) => {
    if (slider.dataset.sliderReady === 'true') return;

    const items = Array.from(slider.children).filter((child) => {
      return !child.classList.contains('slider-dots');
    });

    if (items.length <= 1) return;

    slider.dataset.sliderReady = 'true';

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'slider-dots';
    dotsContainer.setAttribute('aria-hidden', 'true');

    const dots = items.map((item, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = index === 0 ? 'dot active' : 'dot';
      dot.setAttribute('aria-label', `Slide ${index + 1}`);

      dot.addEventListener('click', () => {
        slider.scrollTo({
          left: item.offsetLeft - slider.offsetLeft,
          behavior: 'smooth'
        });
      });

      dotsContainer.appendChild(dot);
      return dot;
    });

    slider.insertAdjacentElement('afterend', dotsContainer);

    const updateActiveDot = () => {
      let activeIndex = 0;
      let closestDistance = Infinity;

      items.forEach((item, index) => {
        const distance = Math.abs(slider.scrollLeft - (item.offsetLeft - slider.offsetLeft));

        if (distance < closestDistance) {
          closestDistance = distance;
          activeIndex = index;
        }
      });

      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
      });
    };

    slider.addEventListener('scroll', updateActiveDot, { passive: true });
    window.addEventListener('resize', updateActiveDot);

    updateActiveDot();
  };

  const refreshSliders = () => {
    sliders.forEach((slider) => {
      const existingDots = slider.nextElementSibling;

      if (!mobileQuery.matches) {
        if (existingDots && existingDots.classList.contains('slider-dots')) {
          existingDots.remove();
        }

        slider.dataset.sliderReady = 'false';
        return;
      }

      setupSlider(slider);
    });
  };

  refreshSliders();

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', refreshSliders);
  } else {
    mobileQuery.addListener(refreshSliders);
  }
}

function initIncludeProtocolNotice() {
  if (window.location.protocol !== 'file:') return;

  console.warn(
    '[HopeDent] Rulează proiectul prin Live Server sau localhost. Include-urile separate pentru header și footer nu sunt fiabile din file://.'
  );
}