// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult as a single model object.
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

// Brand palette from BuildWidgetRequest.
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
  return {
    bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,
    fg:'#ffffff'
  };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let modelData;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;

    if (isPreview) {
      modelData = SAMPLE_DATA[0];
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      modelData = structuredContent;
    }
  } else {
    modelData = SAMPLE_DATA[0];
  }

  block.textContent = '';
  renderModelDetail(block, modelData, bridge);

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

function renderModelDetail(block, model, bridge) {
  if (!model) return;

  const card = document.createElement('div');
  card.className = 'detail-card';

  // Image section (left)
  const imageSection = document.createElement('div');
  imageSection.className = 'image-section';

  if (model.image_url) {
    const img = document.createElement('img');
    img.src = model.image_url;
    img.alt = model.name || 'Vehicle';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

    const fallbackColor = '#646b52';
    img.onerror = () => {
      const colorDiv = document.createElement('div');
      colorDiv.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      img.parentNode.replaceChild(colorDiv, img);
    };

    imageSection.appendChild(img);
  } else {
    const colorDiv = document.createElement('div');
    colorDiv.style.cssText = 'width:100%;height:100%;background-color:#646b52;';
    imageSection.appendChild(colorDiv);
  }

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-btn';
  ctaBtn.textContent = 'Configure';
  ctaBtn.setAttribute('aria-label', `Configure ${model.name || 'this model'}`);

  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`I want to configure the ${model.name}`);
    });
  }

  imageSection.appendChild(ctaBtn);
  card.appendChild(imageSection);

  // Content section (right)
  const contentSection = document.createElement('div');
  contentSection.className = 'content-section';
  contentSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  // Name
  const nameEl = document.createElement('h2');
  nameEl.className = 'model-name';
  nameEl.textContent = model.name || '';
  contentSection.appendChild(nameEl);

  // Description
  const descEl = document.createElement('p');
  descEl.className = 'model-description';
  descEl.textContent = model.description || '';
  contentSection.appendChild(descEl);

  // Price and category row
  const metaRow = document.createElement('div');
  metaRow.className = 'meta-row';

  const priceEl = document.createElement('span');
  priceEl.className = 'model-price';
  priceEl.textContent = model.price || '';
  metaRow.appendChild(priceEl);

  if (model.category) {
    const categoryChip = document.createElement('span');
    categoryChip.className = 'category-chip';
    categoryChip.textContent = model.category;
    metaRow.appendChild(categoryChip);
  }

  contentSection.appendChild(metaRow);
  card.appendChild(contentSection);

  block.appendChild(card);
}
