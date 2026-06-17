// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
// synthetic fixture — no sample data available from Action Planner
const SAMPLE_DATA = [
  {
    name: 'Dacia Bucharest Center',
    address: 'Bulevardul Unirii 45, București 030824, Romania',
    phone: '+40 21 123 4567',
    services: ['Sales', 'Service', 'Parts', 'Test Drive']
  },
  {
    name: 'Dacia Cluj-Napoca',
    address: 'Strada Observatorului 108, Cluj-Napoca 400363, Romania',
    phone: '+40 264 555 789',
    services: ['Sales', 'Service', 'Parts']
  },
  {
    name: 'Dacia Timișoara West',
    address: 'Calea Aradului 2, Timișoara 300645, Romania',
    phone: '+40 256 789 012',
    services: ['Sales', 'Service']
  }
];

// Brand palette from BuildWidgetRequest — used to derive card background.
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
    const mid=(lo+hi)/2;
    if (relLum(Math.round(r*mid),Math.round(g*mid),Math.round(b*mid)) > 0.12) hi=mid; else lo=mid;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let dealers;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      dealers = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.dealers — bare array outputSchema; key derived from actionName "find_dealer"
      dealers = structuredContent?.dealers || [];
    }
  } else {
    dealers = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDealers(block, dealers, bridge);

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

function renderDealers(block, dealers, bridge) {
  const container = document.createElement('div');
  container.className = 'dealers-container';

  dealers.slice(0, 2).forEach(dealer => {
    const card = document.createElement('div');
    card.className = 'dealer-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinIcon = document.createElement('div');
    pinIcon.className = 'pin-icon';
    pinIcon.innerHTML = `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    card.appendChild(pinIcon);

    const name = document.createElement('h3');
    name.className = 'dealer-name';
    name.textContent = dealer.name;
    card.appendChild(name);

    const address = document.createElement('p');
    address.className = 'dealer-address';
    address.textContent = dealer.address;
    card.appendChild(address);

    const phone = document.createElement('a');
    phone.className = 'dealer-phone';
    phone.href = `tel:${dealer.phone}`;
    phone.textContent = dealer.phone;
    card.appendChild(phone);

    if (dealer.services && dealer.services.length > 0) {
      const servicesLabel = document.createElement('p');
      servicesLabel.className = 'dealer-services-label';
      servicesLabel.textContent = 'Services:';
      card.appendChild(servicesLabel);

      const services = document.createElement('p');
      services.className = 'dealer-services';
      services.textContent = dealer.services.join(', ');
      card.appendChild(services);
    }

    container.appendChild(card);
  });

  block.appendChild(container);
}