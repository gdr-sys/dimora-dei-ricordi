// ============================================================
// CURSORE PERSONALIZZATO
// ============================================================
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursor-follower');
let fx = 0, fy = 0, cx = 0, cy = 0;

if (cursor && window.matchMedia('(pointer: fine)').matches) {
  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
  });
  function animFollower() {
    fx += (cx - fx) * 0.12;
    fy += (cy - fy) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(animFollower);
  }
  animFollower();

  document.querySelectorAll('a, button, .ptab, .pack-card, .pi, .servizio-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ============================================================
// NAV SCROLL
// ============================================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ============================================================
// MOBILE MENU
// ============================================================
function toggleMenu() { document.getElementById('navLinks').classList.toggle('open'); }
function closeMenu()  { document.getElementById('navLinks').classList.remove('open'); }

// ============================================================
// ACTIVE NAV LINK
// ============================================================
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

// ============================================================
// PARALLAX HERO
// ============================================================
const heroBg = document.querySelector('.hero-photo');
if (heroBg && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroBg.style.transform = `translateY(${y * 0.3}px)`;
  }, { passive: true });
}

// ============================================================
// NUMERI ANIMATI
// ============================================================
function animateCount(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1800;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target) + (target >= 100 ? '+' : '');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const numeriObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.numero-val').forEach(animateCount);
      numeriObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

const numeriSection = document.getElementById('numeri');
if (numeriSection) numeriObs.observe(numeriSection);

// ============================================================
// SCROLL REVEAL
// ============================================================
const revealEls = document.querySelectorAll(
  '.about-photo-wrap, .about-text, .servizio-card, ' +
  '.section-header, .port-tabs, .pi, .pack-card, ' +
  '.extras-wrap, .contact-info, .contact-form, .numero-item'
);
revealEls.forEach(el => el.classList.add('reveal'));

const revObs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 60);
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
revealEls.forEach(el => revObs.observe(el));

// ============================================================
// PORTFOLIO FILTER
// ============================================================
function filterPort(cat, btn) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.pi').forEach((item, i) => {
    if (item.dataset.cat === cat) {
      item.classList.remove('hidden');
      item.style.opacity = '0';
      item.style.transform = 'translateY(12px)';
      setTimeout(() => {
        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, i * 60);
    } else {
      item.classList.add('hidden');
    }
  });
}

// ============================================================
// SHINE EFFECT SUI PACCHETTI
// ============================================================
document.querySelectorAll('.pack-img').forEach(img => {
  const shine = document.createElement('div');
  shine.className = 'shine';
  img.appendChild(shine);
});

// ============================================================
// FORM CONTATTI
// ============================================================
async function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-submit');
  const success = document.getElementById('fsuccess');
  btn.textContent = 'Invio in corso…';
  btn.disabled = true;
  // Collega Formspree: sostituisci l'URL con il tuo endpoint
  // const res = await fetch('https://formspree.io/f/TUOID', { method:'POST', headers:{'Accept':'application/json'}, body: new FormData(e.target) });
  setTimeout(() => {
    success.classList.remove('hidden');
    e.target.reset();
    btn.textContent = 'Invia il messaggio';
    btn.disabled = false;
    setTimeout(() => success.classList.add('hidden'), 6000);
  }, 1000);
}

// ============================================================
// CAROSELLO RECENSIONI
// ============================================================
(function() {
  const track   = document.getElementById('recTrack');
  const dotsEl  = document.getElementById('recDots');
  if (!track) return;

  const cards = track.querySelectorAll('.rec-card');
  let current = 0;
  let timer;
  let perView = getPerView();

  function getPerView() {
    if (window.innerWidth <= 900)  return 1;
    if (window.innerWidth <= 1100) return 2;
    return 3;
  }

  const total = Math.ceil(cards.length / perView);

  // Crea puntini
  for (let i = 0; i < total; i++) {
    const btn = document.createElement('button');
    btn.className = 'rec-dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('aria-label', 'Vai alla recensione ' + (i + 1));
    btn.addEventListener('click', () => { goTo(i); resetTimer(); });
    dotsEl.appendChild(btn);
  }

  function goTo(idx) {
    current = (idx + total) % total;
    const cardWidth = cards[0].offsetWidth + 24; // gap 1.5rem = 24px
    track.style.transform = `translateX(-${current * perView * cardWidth}px)`;
    dotsEl.querySelectorAll('.rec-dot').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }

  function startTimer() { timer = setInterval(next, 4500); }
  function resetTimer() { clearInterval(timer); startTimer(); }

  // Pausa su hover
  track.addEventListener('mouseenter', () => clearInterval(timer));
  track.addEventListener('mouseleave', () => startTimer());

  // Touch swipe
  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? goTo(current + 1) : goTo(current - 1); resetTimer(); }
  }, { passive: true });

  // Resize
  window.addEventListener('resize', () => {
    perView = getPerView();
    goTo(current);
  });

  startTimer();
})();

// Frecce manuali
function moveCarousel(dir) {
  const track = document.getElementById('recTrack');
  const dots   = document.querySelectorAll('.rec-dot');
  const total  = dots.length;
  let current  = [...dots].findIndex(d => d.classList.contains('active'));
  current = (current + dir + total) % total;
  const perView = window.innerWidth <= 900 ? 1 : window.innerWidth <= 1100 ? 2 : 3;
  const cardWidth = track.querySelector('.rec-card').offsetWidth + 24;
  track.style.transform = `translateX(-${current * perView * cardWidth}px)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === current));
}

// ============================================================
// TORNA SU
// ============================================================
const backTop = document.getElementById('backTop');
window.addEventListener('scroll', () => {
  backTop.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });
