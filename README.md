# La Dimora dei Ricordi — CMS

Sito con pannello admin integrato. Cloudflare Pages + Workers + R2 + KV.

---

## ⚙️ Setup Cloudflare (una volta sola, ~15 minuti)

### 1. Crea il bucket R2 (per le foto)
1. Dashboard Cloudflare → **R2** → "Create bucket"
2. Nome: `dimora-foto`
3. Clicca "Create bucket"

### 2. Crea il namespace KV (per testi e prezzi)
1. Dashboard → **Workers & Pages** → **KV** → "Create a namespace"
2. Nome: `dimora-contenuti`
3. Copia l'**ID** che appare (ti serve dopo)

### 3. Carica il sito su Cloudflare Pages
1. Dashboard → **Pages** → "Create a project" → "Direct Upload"
2. Nome progetto: `dimora-dei-ricordi`
3. Carica la cartella del sito (tutto tranne wrangler.toml)
4. Dopo il primo deploy, vai su **Settings → Functions**

### 4. Collega R2 e KV al progetto Pages
In **Settings → Functions → KV namespace bindings**:
- Variable name: `CONTENUTI`
- KV namespace: seleziona `dimora-contenuti`

In **Settings → Functions → R2 bucket bindings**:
- Variable name: `FOTO_BUCKET`
- R2 bucket: seleziona `dimora-foto`

### 5. Imposta la password admin
In **Settings → Environment variables**:
- `ADMIN_PASSWORD` = la password che scegli tu (es. `Dimora2025!`)

### 6. Rideploya
Dopo aver impostato le variabili, fai un nuovo deploy (carica di nuovo i file).

---

## 🔐 Accesso al pannello admin
Vai su: `tuosito.pages.dev/admin`
Inserisci la password che hai scelto al punto 5.

---

## 📁 Struttura progetto

```
dimora-cms/
├── public/
│   ├── index.html        ← sito pubblico
│   ├── style.css
│   ├── script.js
│   └── admin/
│       └── index.html    ← pannello admin (protetto da password)
├── functions/
│   ├── api/
│   │   └── [[route]].js  ← backend API
│   └── foto-cdn/
│       └── [nome].js     ← serve foto da R2
├── wrangler.toml         ← config (non caricare su Cloudflare Pages)
├── _headers
└── _redirects
```

> **Nota:** il file `wrangler.toml` è solo per riferimento locale, non serve caricarlo.

---

## 💰 Costi (tutti gratuiti)

| Servizio | Piano gratuito |
|---|---|
| Cloudflare Pages | 500 deploy/mese, banda illimitata |
| Cloudflare Workers | 100.000 richieste/giorno |
| Cloudflare R2 | 10 GB storage, 10M richieste/mese |
| Cloudflare KV | 100.000 letture/giorno |
