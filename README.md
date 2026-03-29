# HyperType

HyperType is a code-focused typing game built for the browser. Players type seeded code snippets,
track live performance in real time, and submit runs to a persistent public leaderboard.

It was designed as a portfolio-ready MVP: fast gameplay, clean UI, serverless backend, and a stack
that can ship directly to Vercel.

## What It Does

- Turns code snippets into replayable typing sessions
- Supports multiple languages and difficulty levels
- Tracks live `WPM`, `accuracy`, `errors`, `combo`, and timer pressure
- Stores leaderboard entries in MongoDB through SvelteKit API routes
- Keeps the experience responsive across desktop and mobile

## Core Product

### Game Loop

The typing flow is centered around speed and readability:

- seeded code prompts for reproducible sessions
- inline error highlighting
- live WPM and accuracy updates
- session results with retry and leaderboard submission

### Leaderboard

Runs are stored and ranked by:

- `WPM`
- `accuracy`
- `recency`

The board is public, paginated, and filterable by difficulty and language.

### Backend

The backend uses serverless SvelteKit routes with Mongoose. Scores are validated before insert, and
basic anti-cheat checks reject clearly invalid runs.

## Stack

- SvelteKit
- TypeScript
- Mongoose
- MongoDB Atlas
- Vercel
- Vitest
- Playwright

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

Set your MongoDB connection string:

```bash
MONGODB_URI="mongodb+srv://..."
```

Start development:

```bash
npm run dev
```

App URL:

```bash
http://localhost:5173
```

Health check:

```bash
http://localhost:5173/api/health
```

## Available Scripts

- `npm run dev` starts the local dev server
- `npm run check` runs Svelte and TypeScript checks
- `npm run lint` runs formatting checks and Svelte validation
- `npm run test:unit` runs Vitest
- `npm run test:e2e` runs the Playwright smoke test
- `npm run build` creates the production build

## API Surface

- `GET /api/health`
- `GET /api/corpus`
- `POST /api/submit`
- `GET /api/leaderboard`

## Environment Variables

- `MONGODB_URI` MongoDB Atlas connection string
- `PUBLIC_APP_ENV` optional environment label
- `PUBLIC_DEFAULT_DIFFICULTY` optional default difficulty
- `PUBLIC_DEFAULT_LANGUAGE` optional default language
- `MAX_WPM` max accepted WPM for score validation
- `RATE_LIMIT_PER_HOUR` max score submissions per IP per hour
- `LEADERBOARD_RATE_LIMIT_PER_HOUR` max leaderboard reads per IP per hour

## Deployment

HyperType is configured for Vercel deployment.

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add `MONGODB_URI` in project environment variables.
4. Deploy.

## Notes

- The app writes leaderboard data to the `hypertype` database.
- If MongoDB is missing, the app falls back to in-memory storage for local development.
- The code corpus is deterministic for a given seed, which makes sessions reproducible.
- In production, score submissions fail closed if persistent storage is unavailable.
