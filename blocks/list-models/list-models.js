// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "Bigster",
    "description": "Spacious hybrid SUV with GPL engine, 4x4 and automatic transmission.",
    "image_url": "https://cdn.group.renault.com/dac/ro/gpl/Bigster%20GPL.jpg.ximg.large.webp/e6921f98ca.webp",
    "price": "from 22,890 EUR",
    "category": "SUV"
  },
  {
    "name": "Duster",
    "description": "Versatile SUV available in hybrid and GPL versions with optional 4x4.",
    "image_url": "https://cdn.group.renault.com/dac/ro/gpl/Duster%20GPL.jpg.ximg.large.webp/589927f26b.webp",
    "price": "from 19,100 EUR",
    "category": "SUV"
  },
  {
    "name": "Logan",
    "description": "Affordable sedan with economical GPL engine and modern connectivity.",
    "image_url": "https://cdn.group.renault.com/dac/ro/gpl/Logan%20GPL.jpg.ximg.large.webp/7d9c1a07d2.webp",
    "price": "from 14,650 EUR",
    "category": "Sedan"
  },
  {
    "name": "Sandero Stepway",
    "description": "Compact crossover with raised ride height and robust styling.",
    "image_url": "https://cdn.group.renault.com/dac/ro/gpl/Stepway%20GPL.jpg.ximg.large.webp/7b6547eeb1.webp",
    "price": "from 15,650 EUR",
    "category": "Crossover"
  },
  {
    "name": "Jogger",
    "description": "7-seat family vehicle available in full hybrid and GPL versions.",
    "image_url": "https://cdn.group.renault.com/dac/ro/gpl/Jogger-GPL.jpg.ximg.large.webp/7292573e4a.webp",
    "price": "from 18,650 EUR",
    "category": "Family"
  },
  {
    "name": "Sandero",
    "description": "Economical city car with GPL engine and modern multimedia.",
    "image_url": "https://cdn.group.renault.com/dac/ro/gpl/Sandero-GPL.jpg.ximg.large.webp/c46a2d5762.webp",
    "price": "from 15,450 EUR",
    "category": "City car"
  }
];

// Brand palette from BuildWidgetRequest — darkens palette[0] to luminance ≤ 0.12 for card backgrounds.
const PALETTE = ['#646b52', '#555555', '#6699cc'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

// Card colors for image fallback
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.models — bare array outputSchema; key derived from actionName "list_models"
      items = structuredContent?.models || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderCarousel(block, items, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderCarousel(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'carousel';

  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => {
        if (img.parentNode) {
          img.parentNode.replaceChild(colorDiv(), img);
        }
      };
      imageContainer.appendChild(img);

      const ctaBtn = document.createElement('button');
      ctaBtn.className = 'cta-btn';
      ctaBtn.textContent = 'View Details';
      ctaBtn.setAttribute('aria-label', `View details for ${item.name}`);
      if (bridge) {
        ctaBtn.addEventListener('click', () => {
          bridge.sendMessage(`Tell me more about the ${item.name}`);
        });
      }
      imageContainer.appendChild(ctaBtn);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    card.appendChild(imageContainer);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('h3');
    name.className = 'card-name';
    name.textContent = item.name || '';
    name.style.color = theme?.fg ?? '#fff';
    content.appendChild(name);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'card-description';
      desc.textContent = item.description;
      desc.style.color = theme?.fg ?? '#fff';
      content.appendChild(desc);
    }

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const price = document.createElement('span');
    price.className = 'card-price';
    price.textContent = item.price || '';
    price.style.color = theme?.fg ?? '#fff';
    footer.appendChild(price);

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.textContent = item.category;
      footer.appendChild(badge);
    }

    content.appendChild(footer);
    card.appendChild(content);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  // Fade gradient on right edge
  const fade = document.createElement('div');
  fade.className = 'carousel-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  // Navigation arrows
  const leftArrow = document.createElement('button');
  leftArrow.className = 'nav-arrow left';
  leftArrow.innerHTML = '&#9664;';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'nav-arrow right';
  rightArrow.innerHTML = '&#9654;';
  rightArrow.setAttribute('aria-label', 'Scroll right');

  const updateArrows = () => {
    const scrollLeft = carousel.scrollLeft;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    leftArrow.style.display = scrollLeft > 0 ? 'flex' : 'none';
    rightArrow.style.display = scrollLeft < maxScroll - 1 ? 'flex' : 'none';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16; // card width + gap
    carousel.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftArrow.addEventListener('click', () => scrollByCard(-1));
  rightArrow.addEventListener('click', () => scrollByCard(1));

  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(-1);
    }
  });

  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(1);
    }
  });

  carousel.addEventListener('scroll', updateArrows);
  updateArrows();

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  block.appendChild(wrapper);
}
