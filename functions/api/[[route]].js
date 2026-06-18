// functions/api/[[route]].js
// Cloudflare Pages Function — gestisce tutte le chiamate /api/*

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  const method = request.method;

  // CORS headers
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  // Helper response
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  // ── AUTH ──────────────────────────────────────────────────
  // POST /api/auth/login
  if (path === 'auth/login' && method === 'POST') {
    const { password } = await request.json();
    if (password === env.ADMIN_PASSWORD) {
      // Token semplice: hash della password + timestamp (valido 24h)
      const token = btoa(`${env.ADMIN_PASSWORD}:${Math.floor(Date.now() / 86400000)}`);
      return json({ ok: true, token });
    }
    return json({ ok: false, error: 'Password errata' }, 401);
  }

  // Verifica token per tutte le altre route
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const expectedToken = btoa(`${env.ADMIN_PASSWORD}:${Math.floor(Date.now() / 86400000)}`);
  if (token !== expectedToken) {
    return json({ ok: false, error: 'Non autorizzato' }, 401);
  }

  // ── CONTENUTI (testi, prezzi, info) ───────────────────────
  // GET /api/contenuti
  if (path === 'contenuti' && method === 'GET') {
    const raw = await env.CONTENUTI.get('sito');
    const data = raw ? JSON.parse(raw) : getDefaultContenuti();
    return json(data);
  }

  // PUT /api/contenuti
  if (path === 'contenuti' && method === 'PUT') {
    const data = await request.json();
    await env.CONTENUTI.put('sito', JSON.stringify(data));
    return json({ ok: true });
  }

  // ── FOTO ──────────────────────────────────────────────────
  // GET /api/foto — lista tutte le foto
  if (path === 'foto' && method === 'GET') {
    const raw = await env.CONTENUTI.get('foto');
    const lista = raw ? JSON.parse(raw) : [];
    return json(lista);
  }

  // POST /api/foto/upload — carica nuova foto
  if (path === 'foto/upload' && method === 'POST') {
    const formData = await request.formData();
    const file = formData.get('file');
    const categoria = formData.get('categoria') || 'foto';
    const didascalia = formData.get('didascalia') || '';
    const anno = formData.get('anno') || new Date().getFullYear().toString();

    if (!file) return json({ ok: false, error: 'Nessun file' }, 400);

    // Genera nome univoco
    const ext = file.name.split('.').pop().toLowerCase();
    const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Carica su R2
    await env.FOTO_BUCKET.put(nome, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    // Aggiorna lista foto in KV
    const raw = await env.CONTENUTI.get('foto');
    const lista = raw ? JSON.parse(raw) : [];
    const nuovaFoto = { id: nome, nome, categoria, didascalia, anno, url: `/foto-cdn/${nome}` };
    lista.unshift(nuovaFoto);
    await env.CONTENUTI.put('foto', JSON.stringify(lista));

    return json({ ok: true, foto: nuovaFoto });
  }

  // DELETE /api/foto/:id
  if (path.startsWith('foto/') && method === 'DELETE') {
    const id = path.replace('foto/', '');
    await env.FOTO_BUCKET.delete(id);

    const raw = await env.CONTENUTI.get('foto');
    const lista = raw ? JSON.parse(raw) : [];
    const nuova = lista.filter(f => f.id !== id);
    await env.CONTENUTI.put('foto', JSON.stringify(nuova));

    return json({ ok: true });
  }

  // PUT /api/foto/:id — aggiorna didascalia/categoria
  if (path.startsWith('foto/') && method === 'PUT') {
    const id = path.replace('foto/', '');
    const updates = await request.json();

    const raw = await env.CONTENUTI.get('foto');
    const lista = raw ? JSON.parse(raw) : [];
    const idx = lista.findIndex(f => f.id === id);
    if (idx === -1) return json({ ok: false, error: 'Foto non trovata' }, 404);
    lista[idx] = { ...lista[idx], ...updates };
    await env.CONTENUTI.put('foto', JSON.stringify(lista));

    return json({ ok: true, foto: lista[idx] });
  }

  // ── FOTO CDN (serve foto da R2) ───────────────────────────
  return json({ ok: false, error: 'Endpoint non trovato' }, 404);
}

// Contenuti di default (primo avvio)
function getDefaultContenuti() {
  return {
    hero: {
      titolo: 'Ogni emozione merita di vivere per sempre',
      sottotitolo: 'Foto e video per matrimoni ed eventi indimenticabili',
      zona: 'Pesaro-Urbino · Romagna · Italia',
    },
    about: {
      titolo: 'Noemi e Francesco, custodi dei vostri ricordi più belli',
      testo1: 'Siamo una coppia che condivide la stessa passione: raccontare le storie più belle attraverso immagini autentiche, emozionanti e senza tempo.',
      testo2: 'Lavoriamo discretamente, quasi invisibili, per catturare ciò che succede davvero — uno sguardo rubato, una risata, la luce di un pomeriggio d\'estate.',
      zona: 'Pesaro-Urbino · Romagna · disponibili in tutta Italia',
    },
    pacchetti: [
      {
        id: 'foto',
        icona: '📷',
        nome: 'Solo Foto',
        prezzo: '800€',
        features: [
          'Copertura dell\'intero evento',
          '2 fotografi',
          'Sessione sposi in location esterna',
          'Foto originali in HD senza loghi',
          '+ Fotolibro grande disponibile (+400€)',
        ],
        evidenziato: false,
      },
      {
        id: 'video',
        icona: '🎬',
        nome: 'Solo Video',
        prezzo: '850€',
        features: [
          'Copertura dell\'intero evento',
          '2 videografi + drone incluso',
          'Trailer (1–2 min) + video (6–12 min)',
          'Sessione sposi in location esterna',
          'Consegna in Full HD',
        ],
        evidenziato: false,
      },
      {
        id: 'combo',
        icona: '✨',
        nome: 'Foto + Video',
        prezzo: '1.450€',
        features: [
          '1 fotografo + 1 videografo',
          'Drone incluso',
          'Foto originali in HD senza loghi',
          'Trailer (2–3 min) + video (8–12 min)',
          'Sessione sposi in location esterna',
          '+ Fotolibro grande (+400€)',
          '+ 3° collaboratore (+200€)',
        ],
        evidenziato: true,
      },
    ],
    extras: [
      { nome: 'Album Foto 40×30', desc: '40 pagine, scatola in cuoio bianco', prezzo: '400€' },
      { nome: 'Album Genitori 28×19', desc: '2 album da 40 pag., rilegatura layflat', prezzo: '250€' },
      { nome: 'Scatola in Legno + USB', desc: 'Consegna digitale personalizzata', prezzo: '70€' },
      { nome: 'Foto Istantanee Instax', desc: '100 foto 150€ · 150 foto 200€ · 200 foto 250€', prezzo: 'da 150€' },
      { nome: 'Stampa 10×15 in loco', desc: '50 foto 180€ · 100 foto 280€', prezzo: 'da 180€' },
      { nome: 'Cornice Personalizzabile', desc: 'In prestito gratuito per il vostro evento', prezzo: 'Gratis 🎁' },
    ],
    contatti: {
      email: 'ladimoradeiricordi@libero.it',
      tel1: '+39 327 186 7329',
      tel1Label: 'Francesco',
      tel2: '+39 348 438 2964',
      tel2Label: 'Noemi',
      whatsapp: '393271867329',
      instagram: 'https://www.instagram.com/dimora_dei_ricordi',
      youtube: 'https://www.youtube.com/@ladimoradeiricordi',
      matrimonioCom: 'https://www.matrimonio.com/fotografo-matrimonio/la-dimora-dei-ricordi--e366624',
      testo: 'Rispondiamo entro 24 ore. Per date ravvicinate, scriveteci direttamente su WhatsApp.',
    },
  };
}
