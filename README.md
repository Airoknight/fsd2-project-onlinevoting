# 🗳️ CampusVote — Full-Stack College Online Voting System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com/cloud/atlas)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A robust, modern, responsive full-stack college election web application built with **Node.js, Express, MongoDB Atlas, Vanilla HTML5/CSS3, JavaScript, and Chart.js**. Designed for high security, ballot integrity, and seamless deployment on **Vercel** or local environments.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture & How It Works](#️-system-architecture--how-it-works)
  - [1. User Authentication & Roles](#1-user-authentication--roles)
  - [2. Anti-Fraud & Double-Voting Prevention](#2-anti-fraud--double-voting-prevention)
  - [3. Ballot Lifecycle & Admin Controls](#3-ballot-lifecycle--admin-controls)
  - [4. Real-time Results & Analytics](#4-real-time-results--analytics)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 How to Run Locally](#-how-to-run-locally)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone Repository](#step-1-clone-repository)
  - [Step 2: Install Dependencies](#step-2-install-dependencies)
  - [Step 3: Setup Environment Variables](#step-3-setup-environment-variables)
  - [Step 4: Seed Database with Demo Data](#step-4-seed-database-with-demo-data)
  - [Step 5: Start the Application](#step-5-start-the-application)
- [🔑 Demo Credentials](#-demo-credentials)
- [🌐 How to Deploy on Vercel](#-how-to-deploy-on-vercel)
- [📡 API Endpoints Reference](#-api-endpoints-reference)

---

## ✨ Key Features

- **🎓 Student Portal:**
  - Secure authentication via student enrollment IDs and hashed credentials.
  - Interactive candidate gallery showing photo, department, and election manifesto.
  - Guaranteed one-student, one-vote rule with immediate visual voting receipt.
- **🛡️ Admin & Election Officer Dashboard:**
  - Real-time voter turnout and participation percentage monitor.
  - Candidate management (add new candidates or withdraw existing ones).
  - One-click voting status toggle (**Open/Close voting**).
- **📊 Public Results Page:**
  - Automated winner declaration banner once voting closes.
  - Live ranking table and visual vote distribution bar charts powered by **Chart.js**.
  - Poll lock mechanism preventing premature leaks before polls close.

---

## 🏗️ System Architecture & How It Works

```
  ┌─────────────────────────────────────────────────────────────┐
  │                         Client (Browser)                    │
  │     Login / Voting Portal / Admin Dashboard / Results       │
  └───────────────────────────────┬─────────────────────────────┘
                                  │  HTTPS / REST APIs (JWT Cookie)
                                  ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                   Express.js Server / Vercel                │
  │  ├── Auth Middleware (JWT Verification & Role Check)        │
  │  ├── Voting Integrity Handler (Atomic Transactions)         │
  │  └── Admin Operations & Statistics Engine                   │
  └───────────────────────────────┬─────────────────────────────┘
                                  │  Mongoose ODM
                                  ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                      MongoDB Atlas Database                 │
  │  ├── Users (studentId, role, hasVoted, passwordHash)        │
  │  ├── Candidates (name, department, manifesto, voteCount)    │
  │  ├── Votes (voter, candidate, timestamp [Unique Index])     │
  │  └── ElectionState (isVotingOpen, title)                    │
  └─────────────────────────────────────────────────────────────┘
```

### 1. User Authentication & Roles
- When users submit credentials, passwords are verified using `bcryptjs`.
- Upon successful login, the server issues a signed `jsonwebtoken` (JWT) containing `id`, `studentId`, and `role` (`student` or `admin`).
- The JWT is stored in an HTTP cookie or authorization header and validated by `authMiddleware` for every protected request.

### 2. Anti-Fraud & Double-Voting Prevention
- **Database-Level Guard:** The `votes` collection enforces a unique compound index on `voter`. Attempting to insert a duplicate vote fails atomically at the MongoDB engine level.
- **Application-Level Flag:** Each user record has a `hasVoted: Boolean` flag. Once a vote is cast:
  1. The candidate's `voteCount` is incremented.
  2. The voter's `hasVoted` is marked `true`.
  3. The vote receipt is recorded.
- If a student tries to vote a second time, the server rejects the request with HTTP `400 (Already voted)`.

### 3. Ballot Lifecycle & Admin Controls
- An election state document controls `isVotingOpen`.
- When an administrator toggles voting to **Closed**, students can no longer submit ballots, and the **Results** page unlocks automatically.

### 4. Real-time Results & Analytics
- The server aggregates turnout metrics:
  $$\text{Turnout Rate} = \left(\frac{\text{Students Voted}}{\text{Total Registered Students}}\right) \times 100\%$$
- When polls close, candidate vote tallies are rendered on an interactive Chart.js canvas.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Responsive glassmorphism interface, custom CSS animations |
| **Data Visualization** | Chart.js | Dynamic bar charts and election statistics |
| **Backend** | Node.js, Express.js | Modular RESTful API and authentication middleware |
| **Database** | MongoDB Atlas with Mongoose ODM | Cloud document database with transactional schemas |
| **Security** | bcryptjs, jsonwebtoken, cookie-parser | Salted password hashing & secure stateless JWT sessions |
| **Deployment** | Vercel | Serverless architecture via `vercel.json` rewrites |

---

## 📁 Project Structure

```plaintext
fsd2-project-onlinevoting/
├── api/
│   ├── db.js             # MongoDB Atlas connection handler with caching
│   └── index.js          # Main Express server and API routing logic
├── models/
│   ├── Candidate.js      # Candidate schema (name, department, manifesto, voteCount)
│   ├── ElectionState.js  # Election state schema (isVotingOpen toggle)
│   ├── User.js           # User schema (studentId, passwordHash, role, hasVoted)
│   └── Vote.js           # Vote audit log with unique voter index
├── public/
│   ├── index.html        # Main landing and login interface (default root)
│   ├── login.html        # Authentication portal
│   ├── vote.html         # Student voting gallery & ballot submission
│   ├── admin.html        # Admin control panel for candidates & poll toggles
│   ├── results.html      # Public results leaderboard & Chart.js graph
│   ├── style.css         # Modern design system & glassmorphism theme
│   └── script.js         # Frontend helper logic
├── scripts/
│   └── seed.js           # Database population script with demo accounts
├── .env.example          # Sample environment configuration template
├── .gitignore            # Git exclusions (node_modules, .env, secrets)
├── package.json          # Node dependencies and project scripts
├── vercel.json           # Vercel deployment routes and rewrites
└── README.md             # Project documentation
```

---

## 🚀 How to Run Locally

### Prerequisites
Make sure you have installed on your machine:
- [Node.js](https://nodejs.org/) (version 18 or newer)
- [Git](https://git-scm.com/)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas/database) account or local MongoDB instance

---

### Step 1: Clone Repository
```bash
git clone https://github.com/Airoknight/fsd2-project-onlinevoting.git
cd fsd2-project-onlinevoting
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Environment Variables
Create a `.env` file in the root directory (you can copy `.env.example`):
```bash
cp .env.example .env
```
Open `.env` and fill in your values:
```env
# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/campusvote?retryWrites=true&w=majority

# JWT Secret for signing session tokens
JWT_SECRET=super_secret_campusvote_key_2026

# Port for local development
PORT=3000
```

### Step 4: Seed Database with Demo Data
Run the built-in database seeding script to populate default students, admin, and candidates:
```bash
npm run seed
```

### Step 5: Start the Application
- **Standard start:**
  ```bash
  npm start
  ```
- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔑 Demo Credentials

Once you run `npm run seed`, you can log in with any of the following accounts:

### 👑 Administrator / Election Officer
| Role | Student ID | Password | Access Rights |
|---|---|---|---|
| **Admin** | `ADMIN` | `admin123` | Toggle Voting (Open/Close), Add/Delete Candidates, Turnout Analytics |

### 🎓 Sample Students
| Student Name | Student ID | Password | Department |
|---|---|---|---|
| Aarav Sharma | `23CS101` | `student123` | Computer Science |
| Ananya Iyer | `23CS102` | `student123` | Computer Science |
| Priya Nair | `23EC201` | `student123` | Electronics & Comm |
| Vikram Malhotra | `23EC202` | `student123` | Electronics & Comm |
| Kavya Verma | `23ME301` | `student123` | Mechanical Eng |
| Sneha Patel | `23EE401` | `student123` | Electrical Eng |
| Tanvi Joshi | `23CE501` | `student123` | Civil Eng |
| Devendra Mehra | `23IT601` | `student123` | Information Technology |

*(Password for all demo student accounts is `student123`)*

---

## 🌐 How to Deploy on Vercel

1. **Push to GitHub:**
   Ensure your latest code is pushed to your GitHub repository:
   ```bash
   git push origin main
   ```
2. **Import Project into Vercel:**
   - Log in to [Vercel](https://vercel.com).
   - Click **Add New...** > **Project**.
   - Select your repository `fsd2-project-onlinevoting`.
3. **Configure Environment Variables:**
   Under **Environment Variables** in the Vercel project setup, add:
   - `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/campusvote?retryWrites=true&w=majority`
   - `JWT_SECRET` = `your_jwt_secret_key`
4. **Deploy:**
   - Click **Deploy**. Vercel will build the serverless functions and serve the static files from `/public` as configured in `vercel.json`.

---

## 📡 API Endpoints Reference

### 🔐 Authentication
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate student or admin and return JWT | Public |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile & voting status | Authenticated |
| `POST` | `/api/auth/logout` | Clear session token | Authenticated |

### 🗳️ Voting & Candidates
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/candidates` | List all election candidates and current status | Public |
| `POST` | `/api/vote` | Cast a vote for a candidate (Strict 1-vote check) | Student |
| `GET` | `/api/election/results` | Get leaderboard and vote statistics | Authenticated / Public |

### ⚙️ Admin Actions
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/admin/toggle-voting` | Open or close the election ballot | Admin Only |
| `POST` | `/api/admin/candidates` | Add a new candidate | Admin Only |
| `DELETE` | `/api/admin/candidates/:id` | Remove a candidate from ballot | Admin Only |
| `GET` | `/api/admin/analytics` | View turnout rate and total votes | Admin Only |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
