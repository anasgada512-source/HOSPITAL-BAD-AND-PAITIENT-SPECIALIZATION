# CareBed - Hospital Bed and Patient Specialization Management (MERN)

Hospital ke liye live **bed availability board**: har specialization (Cardiology, Neurology, Orthopedics, ...) me kitne bed khali hain, kaun patient wait kar raha hai, kaun doctor duty par hai. Patient ko ek click me sahi bed aur sahi specialist mil jata hai.

**Founder:** MOHD ANAS | **Phone:** +91 95205 00284 | **Email:** anasgada512@gmail.com

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express, JWT, bcrypt, helmet, rate limiting |
| Database | MongoDB + Mongoose |
| DevOps | Dockerfile (multi-stage), docker-compose, GitHub Actions, Render blueprint |

> **Zaroori note:** Demo me jo patients, doctors aur numbers hain wo **kalpanik (fictional) sample data** hain. Ye learning/portfolio project hai, certified clinical system nahi. Asli patient data ke liye legal compliance, audit logs aur security review chahiye.

## Features

- **Public bed board**: 8 specializations, live free/occupied/cleaning/maintenance count, doctors on duty (30 sec me auto refresh).
- **Staff login**: register/login, har user ko unique ID `HMS-00001`, password bcrypt hash, JWT 7 din.
- **Patient queue**: register karo (condition, priority, specialization). Queue critical > urgent > routine order me.
- **Smart admit**: priority ke hisab se bed type (critical: ICU pehle; routine: General, ICU free rehta hai) aur sabse kam busy on-duty doctor apne aap assign.
- **Safe concurrency**: do log ek saath ek hi bed admit karein to sirf ek ko milta hai (atomic update + lock).
- **Discharge**: bed `cleaning` me jata hai, staff "Mark ready" kare tab available.
- **Roles**: `staff` (daily kaam) aur `admin` (specialization, doctor, bed add/delete, contact messages).
- **Contact form** (database me save), **API fetch** (poora frontend `/api/...` se data leta hai), light/dark theme, mobile responsive.
- **Seed data**: 8 specializations, 64 beds, 16 doctors, 12 sample patients - pehli baar server start par apne aap.

## 1. Local me chalana

Requirements: Node.js 18+ aur MongoDB (local ya Atlas).

```bash
npm run install:all
cp server/.env.example server/.env      # Windows: copy server\.env.example server\.env
# server/.env me MONGO_URI aur JWT_SECRET set karo

npm run dev:server     # API  -> http://localhost:5000
npm run dev:client     # Site -> http://localhost:5173
```

**Admin banne ke liye:** `server/.env` ke `ADMIN_EMAIL` wale email se **Register** karo.
Data reset: `npm run seed -- --force` (sab hospital data mita kar sample data dobara bharta hai).

## 2. Docker (website + API + MongoDB ek command me)

```bash
docker compose up -d --build
# open http://localhost:5000
```

`docker-compose.yml` me `JWT_SECRET` zaroor badlo.

## 3. Deploy (internet par live)

Ek hi service me Express API + React build, database MongoDB Atlas.

**A. Atlas:** Free M0 cluster > Database Access me user > Network Access me `0.0.0.0/0` > Connect > Drivers se string:
`mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/hospital_beds?retryWrites=true&w=majority`
(Password me special character ho to URL-encode karo.)

**B. GitHub:**
```bash
git init && git add . && git commit -m "CareBed MERN app"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

**C. Render:** New > **Blueprint** > repo select. Ye 4 env vars chahiye (blueprint khud bhar deta hai, sirf `MONGO_URI` paste karo):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | lamba random string (Blueprint khud banata hai) |
| `ADMIN_EMAIL` | anasgada512@gmail.com |

Manual service ho to Build `npm run build`, Start `npm start`, Health check `/api/health`.
Deploy ke baad site kholo aur admin email se register karo.

> Production me `JWT_SECRET` na ho to server jaan-boojh kar start nahi hota ("JWT_SECRET is required in production"). Free plan par app idle hone par sleep hota hai, pehla request slow.

**Frontend alag (Vercel):** Root `client`, Build `npm run build`, Output `dist`, env `VITE_API_URL=https://your-api.onrender.com`; backend me `CLIENT_URL=https://your-site.vercel.app`.

## 4. API

Public: `GET /api/health`, `/api/stats`, `/api/departments`, `/api/departments/:slug`, `/api/doctors?department=slug`, `POST /api/contact`, `POST /api/auth/register|login`.

Login (Bearer token): `GET /api/auth/me`, `/api/stats/overview`, `/api/beds`, `/api/patients`, `POST /api/patients`, `GET /api/patients/:id/suggest`, `POST /api/patients/:id/admit`, `POST /api/patients/:id/discharge`, `PATCH /api/patients/:id`, `PATCH /api/beds/:id`, `PATCH /api/doctors/:id/duty`.

Admin: `POST/DELETE /api/departments`, `POST/PUT/DELETE /api/doctors`, `POST/DELETE /api/beds`, `DELETE /api/patients/:id`, `GET /api/contact`.

## 5. Customize

- Site naam, phone, email: `client/src/config.js`
- Sample data: `server/src/seed/seed.js`
- Bed-type rules: `BED_ORDER` in `server/src/routes/patients.js`

## Troubleshooting

| Problem | Fix |
|---|---|
| `JWT_SECRET is required in production` | Render > Environment me `JWT_SECRET` add karo |
| Server start hote hi MongoDB error | `MONGO_URI` galat ya Atlas Network Access me IP allow nahi |
| Admin menu nahi dikh raha | `ADMIN_EMAIL` wale email se register karo (pehle se bana account admin nahi banta) |
| "No suitable bed is free" | Us specialization me us priority ke layak bed khali nahi; bed "Mark ready" karo ya admin se bed add karwao |
