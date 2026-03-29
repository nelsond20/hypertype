# HyperType

HyperType is a responsive web typing game built with SvelteKit, serverless API routes, and MongoDB.
It ships with a seeded code corpus, live WPM/accuracy tracking, a public leaderboard, and a
Vercel-ready deployment setup.

## Features

- Single-player typing loop with difficulty-based code prompts
- Live WPM, accuracy, error, combo, and timer tracking
- Persistent leaderboard with pagination and difficulty/language filters
- Serverless API routes for score submission and leaderboard reads
- MongoDB persistence with a dev fallback in memory when `MONGODB_URI` is missing
- Unit tests, e2e smoke test, lint, and production build scripts

## Stack

- SvelteKit
- TypeScript
- MongoDB Node driver
- Vercel adapter
- Vitest
- Playwright

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Add your MongoDB connection string in `.env`:

```bash
MONGODB_URI="mongodb+srv://..."
```

4. Start the app:

```bash
npm run dev
```

## Scripts

- `npm run dev` - start local development
- `npm run check` - run Svelte checks
- `npm run lint` - run Prettier check and Svelte checks
- `npm run test:unit` - run Vitest unit tests
- `npm run test:e2e` - run Playwright smoke tests
- `npm run build` - build for production

## API Routes

- `GET /api/health`
- `GET /api/corpus?difficulty=medium&language=typescript&textLength=medium&seed=123`
- `POST /api/submit`
- `GET /api/leaderboard?page=1&pageSize=10&difficulty=all&language=all`

## Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string
- `PUBLIC_APP_ENV` - optional environment label for the client
- `PUBLIC_DEFAULT_DIFFICULTY` - optional default difficulty
- `PUBLIC_DEFAULT_LANGUAGE` - optional default language
- `MAX_WPM` - anti-cheat cap for submissions
- `RATE_LIMIT_PER_HOUR` - optional soft rate limit baseline

## Deploy

1. Push the repository to GitHub.
2. Connect the repo to Vercel.
3. Set `MONGODB_URI` and the optional env vars in Vercel.
4. Deploy the project.

## Notes

- Score submissions are validated server-side before they are stored.
- The leaderboard sorts by WPM, then accuracy, then recency.
- The code corpus is deterministic for a given seed so a session can be reproduced.
