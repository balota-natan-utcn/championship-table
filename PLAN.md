# Championship Table — Plan de implementare

## Ce vrem să construim

O aplicație web pentru urmărirea unui campionat săptămânal de fotbal 4v4 între prieteni.

### Funcționalități principale

- Clasament live al campionatului curent
- Statistici individuale: goluri, asisturi per jucător
- Statistici per echipă: victorii, goluri marcate, seri câștigate
- Panou admin (protejat cu parolă) pentru introducerea datelor
- Istoric campionate trecute
- Poze jucători

### Regulile campionatului

- Durata: 1 săptămână
- Format meci: 4v4, 8 minute
- Fără egalitate: dacă scorul e egal la final de timp → penalty decisiv (1 penalty, nu 5)
- Golul din penalty decisiv nu se numără la statisticile individuale
- Echipele rămân aceleași pe toată durata campionatului
- Toate echipele joacă în fiecare seară, mai multe meciuri per seară

### Criteriile de câștigare a campionatului

1. **Puncte** (victorie = 3 pts, înfrângere = 0 pts)
2. **Seri câștigate** (echipa cu cele mai multe victorii într-o seară câștigă seara)
3. **Goluri marcate** de echipă (total)

---

## Arhitectura tehnică

### Stack

| Layer | Tehnologie | Hosting | Cost |
|---|---|---|---|
| Frontend | React + TypeScript + Tailwind CSS | GitHub Pages | Gratuit |
| Backend | Node.js + Express | Render.com | Gratuit |
| Database | MongoDB Atlas | MongoDB Cloud | Gratuit (512MB) |
| Poze jucători | Cloudinary | Cloudinary | Gratuit (25GB) |

### Limitări cunoscute

- **Render.com free tier:** serverul adoarme după 15 min inactivitate → primul request durează ~30 sec
- **MongoDB Atlas free:** 512MB stocare (mai mult decât suficient)
- **GitHub Pages:** doar fișiere statice, fără server-side rendering

---

## Model de date (MongoDB)

### Collections

```
Player {
  _id
  name: string
  photo_url: string          // Cloudinary URL
  createdAt: Date
}

Championship {
  _id
  name: string               // ex: "Săptămâna 1 - Iunie 2026"
  startDate: Date
  endDate: Date
  status: 'active' | 'finished'
  winner_team_id: ObjectId   // populat la final
  createdAt: Date
}

Team {
  _id
  championship_id: ObjectId
  name: string
  color: string              // hex color pentru UI
  player_ids: [ObjectId]     // referință la Player
}

Match {
  _id
  championship_id: ObjectId
  evening_date: Date         // data serii (fără oră)
  team1_id: ObjectId
  team2_id: ObjectId
  score1: number             // goluri echipa 1 în timpul regulamentar
  score2: number             // goluri echipa 2 în timpul regulamentar
  penalty_winner_id: ObjectId | null  // echipa câștigătoare la penalty (dacă scor egal)
  winner_id: ObjectId        // echipa câștigătoare finală
  status: 'scheduled' | 'finished'
}

Goal {
  _id
  match_id: ObjectId
  team_id: ObjectId
  scorer_id: ObjectId        // Player
  assist_id: ObjectId | null // Player (opțional)
  is_penalty_decider: boolean // true = golul decisiv din penalty (nu contează la statistici)
}
```

---

## API Endpoints (Backend)

### Public

```
GET  /api/championships/active          → campionatul activ + clasament
GET  /api/championships/:id/standings   → clasament campionat specific
GET  /api/championships/:id/matches     → toate meciurile
GET  /api/championships/:id/scorers     → topul marcatorilor
GET  /api/championships               → lista toate campionatele (pentru istoric)
GET  /api/players                       → lista jucători
```

### Admin (JWT required)

```
POST /api/auth/login                    → autentificare admin

POST /api/players                       → adaugă jucător
PUT  /api/players/:id                   → editează jucător (inclusiv poză)

POST /api/championships                 → creează campionat nou
PUT  /api/championships/:id/finish      → marchează campionat ca terminat

POST /api/teams                         → creează echipă în campionat
PUT  /api/teams/:id                     → editează echipă

POST /api/matches                       → adaugă meci
PUT  /api/matches/:id                   → editează meci (rezultat, goluri)
```

---

## Pagini Frontend

### Publice

| Rută | Conținut |
|---|---|
| `/` | Clasament curent, meciuri recente, banner campioana anterioară |
| `/championship/:id` | Detalii campionat: clasament, toate meciurile grupate pe seri, top marcatori |
| `/history` | Lista tuturor campionatelor trecute |
| `/players` | Lista jucători cu statistici generale (goluri totale de-a lungul timpului) |

### Admin

| Rută | Conținut |
|---|---|
| `/admin` | Login |
| `/admin/dashboard` | Overview campionat activ |
| `/admin/championship/new` | Creează campionat nou + echipe |
| `/admin/matches/add` | Adaugă rezultat meci + goluri/asisturi |
| `/admin/players` | Gestionează jucători + poze |

---

## Logica clasamentului

### Calcul standings

```
Pentru fiecare echipă din campionat:
  - matches_played = total meciuri jucate
  - wins = meciuri câștigate (inclusiv la penalty)
  - losses = meciuri pierdute
  - points = wins * 3
  - goals_for = goluri marcate (fără penalty decisiv)
  - goals_against = goluri primite (fără penalty decisiv)

Sortare:
  1. points DESC
  2. evenings_won DESC
  3. goals_for DESC
```

### Calcul seri câștigate

```
Pentru fiecare seară (evening_date):
  Pentru fiecare echipă:
    wins_tonight = meciuri câștigate în seara respectivă
  Echipa cu wins_tonight maxim → câștigă seara
  (la egalitate de seri, nu câștigă nimeni seara respectivă)
```

---

## Structura proiectului

```
championship-table/
├── PLAN.md                    ← acest fișier
├── backend/
│   ├── src/
│   │   ├── models/            ← Mongoose schemas
│   │   ├── routes/            ← Express routes
│   │   ├── middleware/        ← auth, error handling
│   │   └── index.ts
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── api/               ← API client functions
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

---

## Progres implementare

### Backend ✅
- [x] Inițializare proiect Node.js + TypeScript
- [x] Modele Mongoose (Player, Championship, Team, Match cu Goals embedded)
- [x] Auth middleware (JWT)
- [x] Route: `/api/auth/login`
- [x] Route: `/api/players` (CRUD + upload Cloudinary)
- [x] Route: `/api/championships` (CRUD + standings + scorers + evenings)
- [x] Route: `/api/teams` (CRUD)
- [x] Route: `/api/matches` (CRUD + calcul winner automat)
- [x] Logica standings (puncte + seri câștigate + goluri)
- [x] `render.yaml` pentru deploy pe Render.com

### Frontend ✅
- [x] Inițializare proiect React + TypeScript + Vite
- [x] Configurare Tailwind CSS
- [x] API client (axios + JWT interceptor)
- [x] Types TypeScript complete
- [x] Pagina principală: clasament + ultima seară + banner campion anterior
- [x] Pagina: detalii campionat (clasament + meciuri pe seri + top marcatori)
- [x] Pagina: istoric campionate
- [x] Pagina: jucători
- [x] Admin: login (JWT)
- [x] Admin: dashboard (clasament + ultima seară + buton termină)
- [x] Admin: adăugare meci + goluri + asisturi + penalty decisiv
- [x] Admin: management jucători + poze
- [x] Admin: creare campionat nou + echipe + selectare jucători
- [x] GitHub Actions workflow pentru deploy automat pe GitHub Pages

### Infrastructură — DE FĂCUT
- [ ] Creează cont MongoDB Atlas + cluster gratuit + connection string
- [ ] Creează cont Cloudinary + obține API keys
- [ ] Creează repo GitHub + push cod
- [ ] Activează GitHub Pages (Settings → Pages → GitHub Actions)
- [ ] Adaugă secret `VITE_API_URL` în GitHub (Settings → Secrets → Actions)
- [ ] Deploy backend pe Render.com + configurează env vars

---

## Ghid deploy pas cu pas

### 1. MongoDB Atlas
1. Mergi la [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign Up gratuit
2. Crează cluster gratuit (M0)
3. Database Access → Add User (username + parolă)
4. Network Access → Add IP Address → Allow from anywhere (`0.0.0.0/0`)
5. Connect → Drivers → copiază connection string
6. Înlocuiește `<password>` cu parola userului

### 2. Cloudinary
1. Mergi la [cloudinary.com](https://cloudinary.com) → Sign Up gratuit
2. Dashboard → copiază Cloud Name, API Key, API Secret

### 3. GitHub repo
```bash
cd /home/natan/date/proiecte/championship-table
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/championship-table.git
git push -u origin main
```

### 4. GitHub Pages
- Settings → Pages → Source: GitHub Actions
- Settings → Secrets and variables → Actions → New secret:
  - `VITE_API_URL` = `https://championship-table-api.onrender.com/api`

### 5. Render.com
1. Mergi la [render.com](https://render.com) → Sign Up gratuit
2. New → Web Service → conectează repo GitHub
3. Root Directory: `backend`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Adaugă Environment Variables (din `.env.example`):
   - `MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `FRONTEND_URL` = `https://USERNAME.github.io`
   - `PORT` = `10000`
