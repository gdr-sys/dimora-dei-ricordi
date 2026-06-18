// ============================================================
// SCRIPT PRINCIPALE — La Dimora dei Ricordi
// Carica contenuti dinamici dall'API + gestisce interattività
// ============================================================

// NAV SCROLL
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// MOBILE MENU
function toggleMenu() { document.getElementById('navLinks').classList.toggle('open'); }
function closeMenu()  { document.getElementById('navLinks').classList.remove('open'); }

// ACTIVE NAV LINK
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const y = window.scrollY + 100;
  sections.forEach(s => {
    if (y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) {
      document.querySelectorAll('.nav-links a').forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === '#' + s.id) a.style.color = 'var(--rose)';
      });
    }
  });
}, { passive: true });

// SCROLL REVEAL
function initReveal() {
  const els = document.querySelectorAll(
    '.about-photo-wrap, .about-text, .servizio-card, ' +
    '.section-header, .port-tabs, .pi, .pack-card, ' +
    '.contact-info, .contact-form, .extras-wrap'
  );
  els.forEach(el => el.classList.add('reveal'));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => obs.observe(el));
}

// PORTFOLIO FILTER
let fotoCorrenti = { foto: [], video: [] };

function filterPort(cat, btn) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderPortfolioItems(fotoCorrenti[cat] || [], cat);
}

function renderPortfolioItems(items, cat) {
  const grid = document.getElementById('portGrid');
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--gray);padding:3rem 0">
      Nessuna ${cat === 'foto' ? 'foto' : 'video'} ancora caricata.
    </p>`;
    return;
  }

  items.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'pi' + (i === 0 ? ' wide' : '');
    div.dataset.cat = cat;

    if (cat === 'video') {
      div.innerHTML = `
        <div class="pimg vthumb" style="background:#0d0a08">
          <div class="play">▶</div>
          <span class="vlabel">${item.didascalia || 'Video'}</span>
        </div>
        <div class="pcap"><span>${item.didascalia || ''}</span><span>${item.anno || ''}</span></div>`;
    } else {
      div.innerHTML = `
        <img class="pimg" src="${item.url}" alt="${item.didascalia || 'Foto evento'}" loading="lazy" />
        <div class="pcap"><span>${item.didascalia || ''}</span><span>${item.anno || ''}</span></div>`;
    }
    grid.appendChild(div);
  });
}

// CARICA CONTENUTI DAL SERVER
async function caricaContenuti() {
  try {
    const res = await fetch('/api/contenuti');
    if (!res.ok) return; // usa i contenuti statici già nell'HTML
    const dati = await res.json();
    applicaContenuti(dati);
  } catch (e) {
    // Silenzioso — l'HTML statico è già visibile
  }
}

async function caricaFoto() {
  try {
    const res = await fetch('/api/foto');
    if (!res.ok) return;
    const lista = await res.json();
    fotoCorrenti.foto  = lista.filter(f => f.categoria === 'foto');
    fotoCorrenti.video = lista.filter(f => f.categoria === 'video');

    // Mostra categoria attiva
    const tabAttivo = document.querySelector('.ptab.active');
    const cat = tabAttivo ? (tabAttivo.textContent.toLowerCase().includes('video') ? 'video' : 'foto') : 'foto';
    if (fotoCorrenti[cat].length > 0) renderPortfolioItems(fotoCorrenti[cat], cat);
  } catch (e) {}
}

function applicaContenuti(d) {
  // Hero
  if (d.hero) {
    const t = document.querySelector('.hero-title');
    if (t && d.hero.titolo) t.innerHTML = d.hero.titolo.replace(/(merita.*$)/s, '<em>$1</em>');
    const s = document.querySelector('.hero-sub');
    if (s && d.hero.sottotitolo) s.textContent = d.hero.sottotitolo;
    const z = document.querySelector('.hero-eyebrow');
    if (z && d.hero.zona) z.textContent = '📷 ' + d.hero.zona;
  }

  // Pacchetti
  if (d.pacchetti) {
    const grid = document.querySelector('.pack-grid');
    if (grid) {
      grid.innerHTML = d.pacchetti.map(p => `
        <div class="pack-card ${p.evidenziato ? 'featured' : ''}">
          ${p.evidenziato ? '<p class="pack-badge">Più scelto</p>' : ''}
          <div class="pack-icon">${p.icona}</div>
          <p class="pack-name">${p.nome}</p>
          <p class="pack-price"><strong>${p.prezzo}</strong></p>
          <ul class="pack-features">
            ${p.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
          <a href="#contatti" class="${p.evidenziato ? 'btn-primary-dark' : 'btn-outline-dark'}">Richiedi info</a>
        </div>`).join('');
    }
  }

  // Extras
  if (d.extras) {
    const grid = document.querySelector('.extras-grid');
    if (grid) {
      grid.innerHTML = d.extras.map(e => `
        <div class="extra-item ${e.prezzo.includes('Gratis') ? 'highlight' : ''}">
          <span class="extra-name">${e.nome}</span>
          <span class="extra-desc">${e.desc}</span>
          <span class="extra-price">${e.prezzo}</span>
        </div>`).join('');
    }
  }

  // Contatti
  if (d.contatti) {
    const c = d.contatti;
    const wa = document.querySelector('.whatsapp-big');
    if (wa) wa.href = `https://wa.me/${c.whatsapp}?text=Ciao!%20Ho%20visto%20il%20vostro%20sito%20e%20vorrei%20avere%20informazioni.`;
    const waHero = document.querySelector('.btn-whatsapp');
    if (waHero) waHero.href = `https://wa.me/${c.whatsapp}?text=Ciao!%20Ho%20visto%20il%20vostro%20sito%20e%20vorrei%20avere%20informazioni.`;
  }
}

// FORM CONTATTI
async function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-submit');
  const success = document.getElementById('fsuccess');
  btn.textContent = 'Invio in corso…';
  btn.disabled = true;
  // Collega Formspree qui (vedi README)
  setTimeout(() => {
    success.classList.remove('hidden');
    e.target.reset();
    btn.textContent = 'Invia il messaggio';
    btn.disabled = false;
    setTimeout(() => success.classList.add('hidden'), 6000);
  }, 1000);
}

// AVVIO
document.addEventListener('DOMContentLoaded', () => {
  caricaContenuti();
  caricaFoto();
  initReveal();
});
