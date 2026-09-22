// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  name: 'Dacia Bigster',
  description: 'The new SUV with hybrid engine options and robust design for adventure.',
  image_url: 'https://cdn.group.renault.com/ren/ro/transversal-assets/dealer-locator/Dacia-new-logo.png',
  price: 'de la €20,490',
  category: 'SUV',
  engine_options: ['Hybrid', 'Petrol'],
  key_features: ['7 seats', 'All-wheel drive', 'Advanced safety systems'],
};

// Brand palette from BuildWidgetRequest - used to derive card background.
const PALETTE = ['#646b52', '#555555', '#6699cc'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;

  let hex = palette[0].replace('#', '');
  if (hex.length === 3) {
    hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  if (hex.length !== 6) return null;

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) return null;

  const lum = (channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const relLum = (rChannel, gChannel, bChannel) => (
    (0.2126 * lum(rChannel)) + (0.7152 * lum(gChannel)) + (0.0722 * lum(bChannel))
  );
  if (relLum(red, green, blue) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const m = (lo + hi) / 2;
    const mLum = relLum(
      Math.round(red * m),
      Math.round(green * m),
      Math.round(blue * m),
    );
    if (mLum > 0.12) hi = m;
    else lo = m;
  }

  const dr = Math.round(red * lo);
  const dg = Math.round(green * lo);
  const db = Math.round(blue * lo);
  const bg = `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
  return { bg, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

function renderDetail(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'detail-card';

  // Left side - image with CTA
  const imageSection = document.createElement('div');
  imageSection.className = 'image-section';

  const CARD_COLORS = [
    '#378ef0',
    '#9256d9',
    '#0fb5ae',
    '#e68619',
    '#d83790',
    '#2dca72',
    '#4046ca',
    '#72b340',
  ];
  const fallbackColor = CARD_COLORS[0];

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };

  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || 'Product image';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageContainer.appendChild(img);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  imageSection.appendChild(imageContainer);

  // CTA button on image - always visible, click handler only when bridge exists
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-btn';
  ctaBtn.textContent = 'More Details';
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Tell me more about ${item.name}`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right side - content with darkened palette background
  const contentSection = document.createElement('div');
  contentSection.className = 'content-section';
  contentSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  // Name
  const name = document.createElement('h2');
  name.className = 'model-name';
  name.textContent = item.name || '';
  contentSection.appendChild(name);

  // Category badge
  if (item.category) {
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = item.category;
    contentSection.appendChild(badge);
  }

  // Description
  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'description';
    desc.textContent = item.description;
    contentSection.appendChild(desc);
  }

  // Price
  if (item.price) {
    const priceEl = document.createElement('div');
    priceEl.className = 'price';
    priceEl.textContent = item.price;
    contentSection.appendChild(priceEl);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA;
    } else {
      const result = await bridge.toolResult;
      item = (result?.structuredContent || result) || {};
    }
  } else {
    item = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDetail(block, item, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(
        () => bridge.reportSize(block.offsetWidth, block.offsetHeight),
        150,
      );
    });
    ro.observe(block);
  }
}
