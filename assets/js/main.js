document.addEventListener('DOMContentLoaded', async () => {
  await loadSiteIncludes();
  initResolvedAssets(document);
  initCurrentYear(document);
  initSiteNavigation();
  initMobileSliders();
  initLightboxGallery();
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

function initLightboxGallery() {
  const gallery = document.querySelector('.gallery-grid');
  if (!gallery) return;

  const items = Array.from(gallery.querySelectorAll('img, video')).map((item, index) => {
    const videoSrc = item.getAttribute('data-video');
    if (videoSrc) {
      item.parentElement.style.cursor = 'pointer';
      item.parentElement.style.position = 'relative';
      item.parentElement.innerHTML += '<div class="gallery-play-overlay"><svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M8 5v14l11-7z"/></svg></div>';
      return { element: item, videoSrc, index, isVideo: true };
    }
    if (item.tagName !== 'VIDEO') {
      item.parentElement.style.cursor = 'pointer';
      return { element: item, index, isVideo: false };
    }
    return null;
  }).filter(Boolean);

  if (!items.length) return;

  items.forEach((itemInfo) => {
    itemInfo.element.parentElement.addEventListener('click', (e) => {
      e.preventDefault();
      showLightbox(items, itemInfo.index);
    });
  });

  function showLightbox(mediaItems, startIndex) {
    const currentIndex = { value: startIndex };

    const lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox';
    lightbox.innerHTML = `
      <div class="gallery-lightbox__overlay" data-close></div>
      <div class="gallery-lightbox__content">
        <button class="gallery-lightbox__nav gallery-lightbox__nav--prev" data-prev aria-label="Anterior">
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <div class="gallery-lightbox__media" data-media-container></div>
        <button class="gallery-lightbox__nav gallery-lightbox__nav--next" data-next aria-label="Următor">
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
        <button class="gallery-lightbox__close" data-close aria-label="Închide">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
        </button>
        <div class="gallery-lightbox__counter" data-counter></div>
      </div>
    `;

    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    const mediaContainer = lightbox.querySelector('[data-media-container]');
    const counter = lightbox.querySelector('[data-counter]');
    const prevBtn = lightbox.querySelector('[data-prev]');
    const nextBtn = lightbox.querySelector('[data-next]');
    const closeEls = lightbox.querySelectorAll('[data-close]');

    function updateMedia(index) {
      const itemInfo = mediaItems[index];
      const clone = itemInfo.isVideo
        ? createVideoElement(itemInfo.videoSrc)
        : createImageElement(itemInfo.element.src, itemInfo.element.alt);

      mediaContainer.innerHTML = '';
      mediaContainer.appendChild(clone);

      clone.style.opacity = '0';
      clone.style.transition = 'opacity 0.3s ease';
      setTimeout(() => clone.style.opacity = '1', 50);

      counter.textContent = `${index + 1} / ${mediaItems.length}`;
    }

    function createVideoElement(src) {
      const video = document.createElement('video');
      video.src = src;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.controls = true;
      video.style.maxWidth = '90vw';
      video.style.maxHeight = '85vh';
      video.style.borderRadius = '12px';
      video.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.3)';
      return video;
    }

    function createImageElement(src, alt) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      img.style.maxWidth = '90vw';
      img.style.maxHeight = '85vh';
      img.style.borderRadius = '12px';
      img.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.3)';
      return img;
    }

    function closeLightbox() {
      document.body.style.overflow = '';
      lightbox.remove();
    }

    function goToPrev() {
      if (currentIndex.value > 0) {
        currentIndex.value--;
        updateMedia(currentIndex.value);
      }
    }

    function goToNext() {
      if (currentIndex.value < mediaItems.length - 1) {
        currentIndex.value++;
        updateMedia(currentIndex.value);
      }
    }

    prevBtn.addEventListener('click', goToPrev);
    nextBtn.addEventListener('click', goToNext);
    closeEls.forEach(el => el.addEventListener('click', closeLightbox));

    // Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    });

    updateMedia(startIndex);
  }
}

const style = document.createElement('style');
style.textContent = '.gallery-play-overlay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;background:rgba(0,0,0,0.5);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;pointer-events:none}.gallery-item:hover .gallery-play-overlay{background:rgba(0,0,0,0.7)}';
document.head.appendChild(style);