# Planer Finansowy

A Polish personal finance planning app. Track expenses, set savings goals, calculate net salary, and check if you can afford a purchase — all in one dark-mode dashboard.

## Live Demo

**[kalkulator-frontend.vercel.app](https://kalkulator-frontend.vercel.app/)**

## Tech Stack

**Frontend**
- React 19 + TypeScript (Create React App)
- Inline styles (dark mode, HSL color system)

**Backend**
- Node.js + Express 5 + TypeScript
- PostgreSQL (via `pg`)
- JWT authentication (`jsonwebtoken`, `bcryptjs`)

**Hosting**
- Frontend: Vercel
- Backend + Database: Railway

## Features

- Net salary calculator (UoP / Zlecenie / B2B, hourly/monthly/annual)
- Expense tracking with custom categories and monthly filters
- Savings goals with progress tracking
- "Can I afford it?" calculator (cash & loan modes)
- Onboarding flow, JWT auth, user profile

## Running Locally

### Backend

```bash
cd backend
npm install
# create .env with: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET
npm run dev
