# Coachingplus / SYNCUP

A fullstack real-time coaching feed application built with Next.js, Node.js, Express, PostgreSQL, Redis, and Socket.IO.

## Architecture Overview

The system consists of three main components:
1. **Frontend (Next.js)**: A React application running on port 3000. It connects to the backend via REST for initial data fetching and Socket.IO for real-time updates.
2. **Backend (Node.js/Express)**: An API and WebSocket server running on port 5001. It handles feed creation, fetching, and real-time broadcasting.
3. **Database (PostgreSQL) & Cache (Redis)**: PostgreSQL stores the persistent feed data. Redis caches the feed data for faster retrieval.

### How Redis Caching Works
- When a user fetches feeds (`GET /feed`), the backend first checks Redis.
- If the data is in Redis (Cache HIT), it returns it immediately, adding an `X-Cache: HIT` header.
- If not (Cache MISS), it queries PostgreSQL, stores the result in Redis with a 5-minute TTL, and returns the data.
- When a new feed is posted (`POST /feed`) or a feed is liked, the cache is invalidated so the next request fetches fresh data.

### How WebSockets Work
- The frontend connects to the backend Socket.IO server.
- When a coach publishes a new post via the admin panel, the backend saves it to the DB and emits a `feed:new` event to all connected clients.
- The frontend listens for `feed:new` and instantly prepends the new post to the feed list without refreshing the page.
- Reconnection logic ensures that if the socket connection drops and reconnects, the frontend automatically re-fetches the feed to catch any missed updates.

## Setup Instructions

### Prerequisites
- Node.js v18+
- Docker & Docker Compose (optional, for easy database/cache setup)
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)

### Quick Start (Docker)
1. Clone the repository.
2. In the root directory, run:
   ```bash
   docker-compose up -d
   ```
   This will start PostgreSQL and Redis containers.
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Start both frontend and backend concurrently:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.

### API Documentation

#### `GET /feed`
Fetches all coaching feeds, ordered by newest first.
- **Response**: `{ success: true, source: 'cache' | 'database', data: [...] }`

#### `POST /feed`
Creates a new coaching feed.
- **Body**: `{ title: string, content: string, coach_name: string, category: string }`
- **Response**: `{ success: true, message: '...', data: { ... } }`

#### `POST /feed/:id/like`
Increments the like count for a specific feed.
- **Response**: `{ success: true, data: { ... } }`
