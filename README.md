# Championship Table

[English version below](#english)

---

## Romana

Aplicatie web pentru urmarirea unui campionat saptamanal de fotbal 4v4 intre prieteni.

### Functionalitati

**Pagini publice**

- Clasament live al campionatului activ cu puncte, seri castigate si goluri marcate
- Detalii campionat: meciuri grupate pe seri, top marcatori, clasament complet
- Pagina jucatori cu statistici pe 3 tab-uri: all-time, campionat curent, ultima seara (goluri, asisturi, victorii, meciuri jucate)
- Istoric campionate trecute cu castigatorul fiecaruia

**Panou admin**

- Timer live pentru meci: full-screen, optimizat mobil, durata configurabila (1-20 min), pauza/reluare, extra time automat
- Introducere gol din timer: echipa, marcator, assist, minutul capturat automat — cu posibilitate de undo
- Wake Lock API (ecranul nu se inchide in timpul meciului) si feedback haptic la confirmare gol
- Adaugare retroactiva de meciuri cu scoruri si goluri
- Management jucatori: adaugare, editare, poza (upload Cloudinary), stergere
- Management echipe mid-campionat: adauga/scoate jucatori din echipe oricand
- Creare campionat nou cu echipe si selectare jucatori
- Marcare campionat ca terminat

**Regulile campionatului implementate**

- Victorie = 3 puncte, infrangere = 0 puncte, fara egal
- La scor egal dupa timp regulamentar: penalty decisiv (1 penalty) — golul nu conteaza la statisticile individuale
- Clasament: puncte → seri castigate → goluri marcate
- Seara castigata: echipa cu cele mai multe victorii in seara respectiva (la egalitate, nimeni nu castiga seara)

### Stack tehnic

| Layer | Tehnologie | Hosting |
|---|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 + Vite | GitHub Pages |
| Backend | Node.js + Express 5 + TypeScript | Render.com |
| Baza de date | MongoDB Atlas + Mongoose | MongoDB Cloud |
| Poze jucatori | Cloudinary | Cloudinary |

### Structura proiect

```
championship-table/
├── backend/
│   ├── src/
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── middleware/    # auth JWT, error handling
│   │   └── index.ts
│   ├── .env.example
│   └── render.yaml
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── api/           # API client (axios + JWT interceptor)
    └── .github/workflows/deploy.yml
```

### Rulare locala

**Backend**

```bash
cd backend
npm install
cp .env.example .env
# completeaza .env cu valorile tale
npm run dev
```

**Frontend**

```bash
cd frontend
npm install
# creeaza frontend/.env.local cu:
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

### Variabile de mediu

**Backend** (`backend/.env`):

```
MONGODB_URI=        # connection string MongoDB Atlas
JWT_SECRET=         # string secret pentru JWT
ADMIN_PASSWORD=     # parola pentru login admin
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FRONTEND_URL=       # ex: https://username.github.io
PORT=5000
```

**Frontend** (GitHub Actions Secret):

```
VITE_API_URL=       # ex: https://championship-table-api.onrender.com/api
```

### Deploy

**Backend (Render.com)**

1. New Web Service → conecteaza repo GitHub
2. Root Directory: `backend`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Adauga variabilele de mediu din sectiunea de mai sus

**Frontend (GitHub Pages)**

1. Settings → Pages → Source: GitHub Actions
2. Settings → Secrets → Actions → adauga `VITE_API_URL`
3. Orice push pe `main` in directorul `frontend/` declanseaza deploy automat
4. Deploy manual: Actions → Deploy Frontend to GitHub Pages → Run workflow

**Nota:** Render.com free tier adoarme dupa 15 minute de inactivitate. Primul request dupa inactivitate dureaza ~30 secunde.

### API Endpoints

**Public**

```
GET  /api/championships/active              # campionatul activ + clasament
GET  /api/championships                     # toate campionatele
GET  /api/championships/:id/standings       # clasament campionat specific
GET  /api/championships/:id/matches         # toate meciurile
GET  /api/championships/:id/scorers         # top marcatori
GET  /api/championships/:id/evenings        # meciuri grupate pe seri
GET  /api/players                           # lista jucatori
GET  /api/players/stats?scope=alltime|current|evening  # statistici jucatori
```

**Admin (JWT required)**

```
POST /api/auth/login

POST   /api/players
PUT    /api/players/:id
DELETE /api/players/:id

POST   /api/championships
PUT    /api/championships/:id/finish
DELETE /api/championships/:id

POST   /api/teams
PUT    /api/teams/:id
DELETE /api/teams/:id

POST   /api/matches
PUT    /api/matches/:id
DELETE /api/matches/:id
```

---

## English

Web application for tracking a weekly 4v4 football championship between friends.

### Features

**Public pages**

- Live standings for the active championship with points, evenings won, and goals scored
- Championship details: matches grouped by evening, top scorers, full standings
- Players page with stats across 3 tabs: all-time, current championship, last evening (goals, assists, wins, matches played)
- History of past championships with their winners

**Admin panel**

- Live match timer: full-screen, mobile-optimized, configurable duration (1-20 min), pause/resume, automatic extra time
- Goal entry from timer: team, scorer, assist, minute captured automatically — with undo support
- Wake Lock API (screen stays on during the match) and haptic feedback on goal confirmation
- Retroactive match entry with scores and goals
- Player management: add, edit, photo (Cloudinary upload), delete
- Mid-championship team management: add/remove players from teams at any time
- Create new championship with teams and player selection
- Mark championship as finished

**Championship rules implemented**

- Win = 3 points, loss = 0 points, no draws
- If scores are level after regular time: decisive penalty (1 penalty) — the goal does not count towards individual stats
- Standings tiebreakers: points → evenings won → goals scored
- Evening winner: team with the most wins that evening (if tied, no one wins the evening)

### Tech stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 + Vite | GitHub Pages |
| Backend | Node.js + Express 5 + TypeScript | Render.com |
| Database | MongoDB Atlas + Mongoose | MongoDB Cloud |
| Player photos | Cloudinary | Cloudinary |

### Project structure

```
championship-table/
├── backend/
│   ├── src/
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── middleware/    # JWT auth, error handling
│   │   └── index.ts
│   ├── .env.example
│   └── render.yaml
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── api/           # API client (axios + JWT interceptor)
    └── .github/workflows/deploy.yml
```

### Local development

**Backend**

```bash
cd backend
npm install
cp .env.example .env
# fill in .env with your values
npm run dev
```

**Frontend**

```bash
cd frontend
npm install
# create frontend/.env.local with:
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

### Environment variables

**Backend** (`backend/.env`):

```
MONGODB_URI=        # MongoDB Atlas connection string
JWT_SECRET=         # secret string for JWT signing
ADMIN_PASSWORD=     # password for admin login
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FRONTEND_URL=       # e.g. https://username.github.io
PORT=5000
```

**Frontend** (GitHub Actions Secret):

```
VITE_API_URL=       # e.g. https://championship-table-api.onrender.com/api
```

### Deployment

**Backend (Render.com)**

1. New Web Service → connect GitHub repo
2. Root Directory: `backend`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Add environment variables from the section above

**Frontend (GitHub Pages)**

1. Settings → Pages → Source: GitHub Actions
2. Settings → Secrets → Actions → add `VITE_API_URL`
3. Any push to `main` within the `frontend/` directory triggers an automatic deploy
4. Manual deploy: Actions → Deploy Frontend to GitHub Pages → Run workflow

**Note:** Render.com free tier spins down after 15 minutes of inactivity. The first request after a period of inactivity takes approximately 30 seconds.

### API Endpoints

**Public**

```
GET  /api/championships/active              # active championship + standings
GET  /api/championships                     # all championships
GET  /api/championships/:id/standings       # standings for a specific championship
GET  /api/championships/:id/matches         # all matches
GET  /api/championships/:id/scorers         # top scorers
GET  /api/championships/:id/evenings        # matches grouped by evening
GET  /api/players                           # player list
GET  /api/players/stats?scope=alltime|current|evening  # player statistics
```

**Admin (JWT required)**

```
POST /api/auth/login

POST   /api/players
PUT    /api/players/:id
DELETE /api/players/:id

POST   /api/championships
PUT    /api/championships/:id/finish
DELETE /api/championships/:id

POST   /api/teams
PUT    /api/teams/:id
DELETE /api/teams/:id

POST   /api/matches
PUT    /api/matches/:id
DELETE /api/matches/:id
```
