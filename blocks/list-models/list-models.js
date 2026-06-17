// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "Dacia Bigster",
    "description": "The new SUV with hybrid engine options and robust design for adventure.",
    "image_url": "https://cdn.group.renault.com/ren/ro/transversal-assets/dealer-locator/Dacia-new-logo.png",
    "price": "de la €20,490",
    "category": "SUV"
  },
  {
    "name": "Dacia Duster",
    "description": "Versatile SUV with rugged capability and modern technology.",
    "image_url": "https://cdn.group.renault.com/content/dam/Dacia/master/brand-v5/vehicles/duster-3/product-page/duster-3-main-desktop.jpg",
    "price": "de la €17,100",
    "category": "SUV"
  },
  {
    "name": "Dacia Logan",
    "description": "Spacious sedan offering exceptional value and comfort for daily commuting.",
    "image_url": "https://cdn.group.renault.com/content/dam/Dacia/master/brand-v5/vehicles/logan-3/product-page/logan-3-main-desktop.jpg",
    "price": "de la €12,741",
    "category": "Sedan"
  },
  {
    "name": "Dacia Sandero Stepway",
    "description": "Urban crossover combining style with practical versatility.",
    "image_url": "https://cdn.group.renault.com/content/dam/Dacia/master/brand-v5/vehicles/sandero-stepway-3/product-page/sandero-stepway-3-main-desktop.jpg",
    "price": "de la €13,741",
    "category": "Crossover"
  },
  {
    "name": "Dacia Jogger",
    "description": "Family-oriented vehicle with up to 7 seats and hybrid powertrain options.",
    "image_url": "https://cdn.group.renault.com/content/dam/Dacia/master/brand-v5/vehicles/jogger/product-page/jogger-main-desktop.jpg",
    "price": "de la €16,741",
    "category": "Family"
  },
  {
    "name": "Dacia Spring",
    "description": "Compact electric city car with zero emissions and affordable pricing.",
    "image_url": "https://cdn.group.renault.com/content/dam/Dacia/master/brand-v5/vehicles/spring-2/product-page/spring-2-main-desktop.jpg",
    "price": "",
    "category": "Electric"
  }
];

// Brand palette from BuildWidgetRequest
const PALETTE = ['#646b52', '#555555', '#6699cc'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let models;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      models = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.models — bare array outputSchema; key derived from actionName "list_models"
      models = structuredContent?.models || [];
    }
  } else {
    models = SAMPLE_DATA;
  }

  block.textContent = '';
  renderModels(block, models, bridge);

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

function renderModels(block, models, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'models-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'models-carousel';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

  models.forEach((model, i) => {
    const card = document.createElement('div');
    card.className = 'model-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'model-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (model.image_url) {
      const img = document.createElement('img');
      img.src = model.image_url;
      img.alt = model.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-button';
    ctaBtn.textContent = 'View Details';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about the ${model.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'model-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('h3');
    name.className = 'model-name';
    name.textContent = model.name;
    info.appendChild(name);

    const desc = document.createElement('p');
    desc.className = 'model-description';
    desc.textContent = model.description || '';
    info.appendChild(desc);

    const footer = document.createElement('div');
    footer.className = 'model-footer';

    if (model.price) {
      const price = document.createElement('span');
      price.className = 'model-price';
      price.textContent = model.price;
      footer.appendChild(price);
    }

    if (model.category) {
      const badge = document.createElement('span');
      badge.className = 'model-badge';
      badge.textContent = model.category;
      footer.appendChild(badge);
    }

    info.appendChild(footer);
    card.appendChild(info);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  // Right fade gradient
  const fade = document.createElement('div');
  fade.className = 'fade-gradient';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  // Navigation arrows
  const leftArrow = document.createElement('button');
  leftArrow.className = 'nav-arrow nav-arrow-left';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.textContent = '◀';
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'nav-arrow nav-arrow-right';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.textContent = '▶';

  const updateArrows = () => {
    const atStart = carousel.scrollLeft <= 0;
    const atEnd = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 1;
    leftArrow.style.display = atStart ? 'none' : 'flex';
    rightArrow.style.display = atEnd ? 'none' : 'flex';
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
