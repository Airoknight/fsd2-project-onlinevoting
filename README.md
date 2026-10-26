# 🗳️ CampusVote — Online Voting System for College Elections

A clean, responsive, full-stack college election web application built with **Node.js, Express, MongoDB Atlas, HTML, CSS, JavaScript, and Chart.js**, ready for 1-click **Vercel** deployment.

---

## 🚀 Features

- **👤 Student Portal:**
  - Secure login with pre-configured College Student IDs.
  - Candidate gallery with manifestos and departmental tags.
  - Strict 1-student 1-vote policy enforced with unique DB indexes.
  - Instant confirmation receipt preventing duplicate ballot submissions.
- **🔐 Admin & Election Officer Portal:**
  - Real-time voter turnout percentage & participation metrics.
  - Add or eliminate candidates dynamically.
  - **Open / Close Polls Toggle:** When voting is closed, public results and interactive Chart.js bar charts are unlocked for students!
- **📊 Results Page:**
  - Live ranking leaderboard with percentage breakdown.
  - Dynamic Chart.js bar chart for visual presentation.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML5, Modern CSS (Glassmorphism & Plus Jakarta Sans), Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Charts** | Chart.js |
| **Hosting** | Vercel (Serverless Functions) |

---

## ⚙️ Quick Setup Guide

### 1. Configure MongoDB Atlas Connection String
Open [`.env`](file:///.env) and paste your MongoDB Atlas Connection URI:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/campusvote?retryWrites=true&w=majority
JWT_SECRET=campusvote_secret_key_change_in_production_2026
PORT=3000
```

### 2. Seed Demo Accounts & Candidates
Once you insert your MongoDB URI, run the seed script:
```bash
npm run seed
```
This automatically seeds:
- **Election Officer (Admin):**
  - Username: `ADMIN` | Password: `admin123`
- **12 Demo Students:**
  - IDs: `23CS101`, `23CS102`, `23EC201`, `23ME301`, ...
  - Password: `student123`
- **4 Candidates** with departments and manifestos.

### 3. Run Locally
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub or run `vercel` in your terminal.
2. In the Vercel project dashboard, navigate to **Settings > Environment Variables**.
3. Add:
   - `MONGODB_URI`: (Your MongoDB Atlas connection URI)
   - `JWT_SECRET`: (Any secure secret string)
4. Hit **Deploy** — Vercel routes `/api/*` to the serverless Express backend and serves static pages from `/public` automatically using [`vercel.json`](file:///vercel.json).
