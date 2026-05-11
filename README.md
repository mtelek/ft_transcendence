*This project has been created as part of the 42 curriculum by mtelek, tmeniga, mvolgger, kbrauer.*

# ft_transcendence — All In

A real-time multiplayer Texas Hold'em poker platform built as a web application. Players can create and join named game lobbies, compete in 2- or 3-player matches, customize the table appearance, track their stats, and connect with friends — all in the browser.

---

## Description

**All In** is a fully browser-based poker game supporting real-time multiplayer gameplay via WebSockets. The project is built with Next.js as the full-stack framework, Socket.IO for live game synchronization, and PostgreSQL for persistent data storage.

### Key Features

- **Real-time poker** — Texas Hold'em with full betting rounds (preflop → flop → turn → river → showdown)
- **2- and 3-player matches** — named lobbies with optional password protection
- **Remote players** — play from separate machines with graceful disconnect handling
- **User accounts** — register with email/password or sign in with Google
- **Profiles & friends** — avatar upload, friend requests, online status
- **Game statistics** — win/loss tracking, match history, global leaderboard, 36 achievements
- **Game customization** — 3 preset themes (Classic Vegas, Wood Lodge, Garden) plus full custom mode; selectable card backs, felt colors, and backgrounds
- **Special Chip power-up** — reveal an opponent's hole cards for 5 seconds (once per game)
- **Multi-browser support** — tested and working in Chrome, Brave, and Edge

---

## Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+
- A `.env` file at the project root (see below)

### Environment Setup

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and configure:

```env
# Database
POSTGRES_DB=transcendence
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/ft_transcendence"

# Google OAuth (required for "Sign in with Google")
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth secret — generate with: openssl rand -base64 32
AUTH_SECRET="your-generated-secret"

# For production (HTTPS): your machine's public IP via nip.io
AUTH_URL="https://your.ip.address.nip.io"
IP=your.ip.address.nip.io

# For development (HTTP): use localhost instead
# AUTH_URL="http://localhost:3000"
# IP=localhost
```

To generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### Running the Project

**Production** (HTTPS on ports 80 and 443):

```bash
make up
```

Then open `https://your.ip.address.nip.io` in your browser. The certificate is self-signed — accept the browser warning.

**Development** (HTTP on port 3000, live reload):

```bash
make dev
```

Then open `http://localhost:3000`.

### Other Commands

```bash
make down          # Stop production containers
make dev-down      # Stop development containers
make clean         # Remove all production containers, images, and volumes
make dev-clean     # Remove all development containers, images, and volumes
make reset         # Clean and restart production
make dev-reset     # Clean and restart development
make lint          # Run ESLint inside Docker
```

> Docker handles everything: database creation, Prisma migrations, and the Next.js server. No local Node.js or PostgreSQL installation is needed.

---

## Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js (Auth.js) Documentation](https://authjs.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [poker-ts Library](https://www.npmjs.com/package/poker-ts) — Texas Hold'em hand evaluation
- [Docker Documentation](https://docs.docker.com/)
- [Framer Motion](https://www.framer.com/motion/) — UI animations

### AI Usage

AI tools (Claude, Copilot) were used throughout the project for:

- **Architecture and design advice** — evaluating module choices, planning the tech stack, and designing the real-time game state model
- **Troubleshooting and debugging** — diagnosing runtime errors, Socket.IO event flow issues, and Prisma migration problems
- **Documentation** — writing and structuring this README

All code was written, reviewed, and understood by team members. AI served as an assistant and sounding board, not a replacement for understanding.

---

## Team Information

| Login    | Full Name        | Role                                  |
|----------|------------------|---------------------------------------|
| tmeniga  | Tom Meniga       | Tech Lead / Developer — Database & Ops |
| mtelek   | Marton Telek     | PM / Developer — Auth & Users         |
| mvolgger | Matthias Volgger | PO / Developer — Game & Backend       |
| kbrauer  | Kevin Braeuer    | Developer — Frontend                  |

### Tom Meniga — Tech Lead / Developer (Database & Ops)

As Tech Lead, Tom owned the technical direction, module choices, and overall architecture quality. Led technical decision-making for the project, including the choice of tech stack (Next.js, PostgreSQL, Prisma, Socket.IO, Docker) and overall architecture. Designed the PostgreSQL database schema and Prisma data models. Wrote all migrations and maintained schema integrity across development cycles. Fully containerized the project with Docker and Docker Compose, including the multi-stage Dockerfile, HTTPS certificate generation, and health checks. Collaborated with Marton on game statistics persistence and the leaderboard API.

### Marton Telek — PM / Developer (Auth & Users)

As PM, Marton coordinated task distribution, meeting cadence, and the shared progress tracking document. Implemented the full user management system: registration, profile pages, avatar upload, friend requests, and online presence tracking. Set up Google OAuth via Auth.js and handled account linking for existing users. Built multi-browser compatibility and tested across Chrome, Brave, and Edge. Collaborated with Matthias on remote player reconnection logic and with Tom on game statistics and match history.

### Matthias Volgger — PO / Developer (Game & Backend)

As PO, Matthias owned product scope, feature priorities, and overall game experience direction. Designed and implemented the poker game engine, integrating the `poker-ts` library with a custom server-side state machine. Built all Socket.IO event handlers for game actions (fold, check, call, bet, raise), community card progression, hand result broadcasting, and real-time chat. Collaborated with Marton on remote player support and disconnection handling.

### Kevin Braeuer — Developer (Frontend)

Responsible for the frontend architecture, visual design, and user experience. Built the game customization system including theme presets, card back selection, felt colors, and background variants. Also contributed to the landing page and in-game UI.

---

## Project Management

### Work Organization

Work was divided by domain from the start of the project. Each team member owned their area end-to-end (design → implementation → testing). Features that spanned domains (e.g., remote players, game stats) were built collaboratively by the relevant members.

Progress was tracked informally using a shared document (`info/project.txt`) listing all modules, their requirements, and completion status.

### Tools

- **GitHub** — version control, pull requests, and code review
- **WhatsApp** — primary team communication channel
- **Google Meet** — remote meetings and screen sharing

### Meetings

The team met in-person regularly to discuss architecture decisions, review progress, unblock each other, and align on module requirements. Remote sessions were held via Google Meet. Day-to-day coordination happened over WhatsApp between meetings.

---

## Technical Stack

### Frontend

| Technology      | Version  | Purpose                                      |
|-----------------|----------|----------------------------------------------|
| Next.js         | 16.1.6   | Full-stack React framework (App Router)      |
| React           | 19.2.3   | UI component library                         |
| TypeScript      | 5        | Type-safe JavaScript                         |
| Tailwind CSS    | 4        | Utility-first CSS styling                    |
| Framer Motion   | 12.38.0  | Animations and transitions                   |

### Backend

| Technology  | Version        | Purpose                                         |
|-------------|----------------|-------------------------------------------------|
| Next.js     | 16.1.6         | API routes and server-side rendering            |
| Socket.IO   | 4.8.3          | Real-time bidirectional game communication      |
| Node.js     | 20 (Alpine)    | Server runtime                                  |
| Auth.js     | 5.0.0-beta.31  | Authentication (Credentials + Google OAuth)     |
| bcryptjs    | 3.0.3          | Password hashing                                |
| poker-ts    | 1.5.0          | Texas Hold'em hand evaluation and table logic   |

### Database

| Technology  | Version | Purpose                                     |
|-------------|---------|---------------------------------------------|
| PostgreSQL  | 16      | Relational database for all persistent data |
| Prisma      | 6.12.0  | ORM — type-safe database access             |

PostgreSQL was chosen for its reliability under concurrent connections (required by the subject), its strong support in the Next.js ecosystem, and native compatibility with Prisma. It handles everything from user records to match history and achievements.

### Infrastructure

| Technology      | Purpose                                              |
|-----------------|------------------------------------------------------|
| Docker          | Containerization of the entire application           |
| Docker Compose  | Orchestration of frontend + database services        |
| OpenSSL         | Self-signed TLS certificate for production HTTPS     |

### Technical Justifications

Technology choices were led by Tom Meniga (Tech Lead).

- **Next.js** was chosen because it serves as both the frontend and backend framework providing built-in routing, server components, and API routes, removing the need for a separate Express server for non-socket logic.
- **Socket.IO** was chosen over raw WebSockets for its automatic reconnection handling, room-based broadcasting, and broad browser compatibility — all critical for a real-time poker game.
- **Prisma** provides type-safe database queries auto-generated from the schema, eliminating SQL injection risks and reducing boilerplate. It also includes a visual browser (Prisma Studio) useful during development.
- **Auth.js (NextAuth)** handles the complexity of session management, JWT signing, OAuth provider integration, and CSRF protection out of the box.

---

## Database Schema

### Tables

#### `User`
Stores registered users.

| Field        | Type      | Description                              |
|--------------|-----------|------------------------------------------|
| id           | String    | UUID primary key                         |
| email        | String    | Unique email address                     |
| username     | String    | Unique display name                      |
| password     | String?   | Bcrypt-hashed password (null for OAuth)  |
| image        | String?   | Path to avatar image                     |
| wins         | Int       | Total game wins                          |
| losses       | Int       | Total game losses                        |
| handsPlayed  | Int       | Total hands played                       |
| lastSeenAt   | DateTime? | Used to determine online status          |
| createdAt    | DateTime  | Account creation timestamp               |

#### `Account`
Links OAuth provider accounts to a User.

| Field             | Type   | Description                          |
|-------------------|--------|--------------------------------------|
| userId            | String | FK → User.id                         |
| provider          | String | e.g., "google"                       |
| providerAccountId | String | OAuth provider's user ID             |

#### `Session`
Active session tokens.

| Field       | Type     | Description            |
|-------------|----------|------------------------|
| sessionToken| String   | Unique token           |
| userId      | String   | FK → User.id           |
| expires     | DateTime | Expiry timestamp       |

#### `Friendship`
Bidirectional friend relationships.

| Field    | Type     | Description                              |
|----------|----------|------------------------------------------|
| userId   | String   | FK → User.id (requester)                 |
| friendId | String   | FK → User.id (recipient)                 |
| accepted | Boolean  | false = pending, true = friends          |
| createdAt| DateTime | When the request was sent                |

Composite primary key on `(userId, friendId)`.

#### `Match`
Completed game records.

| Field               | Type     | Description                                 |
|---------------------|----------|---------------------------------------------|
| id                  | String   | UUID                                        |
| mode                | String   | "1v1" or "3max"                             |
| winnerId            | String?  | FK → User.id of the winner                  |
| player1Id–player6Id | String?  | Up to 6 player IDs                          |
| scores              | Json     | Final chip counts per player                |
| playedAt            | DateTime | Match timestamp                             |

#### `Achievement`
Unlocked achievements per user.

| Field      | Type     | Description                        |
|------------|----------|------------------------------------|
| id         | String   | UUID                               |
| userId     | String   | FK → User.id                       |
| type       | String   | Achievement identifier key         |
| unlockedAt | DateTime | When it was earned                 |

### Relationships

```
User ──< Account         (one user, many OAuth accounts)
User ──< Session         (one user, many sessions)
User ──< Friendship      (as requester or recipient)
User ──< Achievement     (one user, many achievements)
User ──< Match           (as player1–player6)
```

---

## Features List

| Feature                    | Description | Who |
|----------------------------|-------------|-----|
| Texas Hold'em poker engine | Full hand lifecycle: preflop → flop → turn → river → showdown. Fold, check, call, bet, raise with proper legal action validation. | Matthias |
| 2-player matches           | Named lobby, password protection, 1v1 game | Matthias |
| 3-player matches           | Named lobby, 3-seat table with elimination logic | Matthias |
| Remote players             | Two or more players on separate machines playing in real time | Matthias, Marton |
| Disconnection handling     | Disconnected players auto-fold or auto-check; game continues | Matthias, Marton |
| Lobby system               | Create/join named game rooms; wait for players to fill seats | Matthias |
| Real-time game state       | Socket.IO broadcasts per-player game snapshots (hidden opponent cards, legal actions, pot, community cards)  | Matthias |
| Real-time chat             | In-game chat with system messages for all game events | Matthias |
| Special Chip power-up      | Reveal an opponent's hole cards for 5 seconds; usable once per game | Marton |
| Poker table UI             | Full game table page: player seats, community cards, chip stacks, action bar (fold/check/call/bet/raise), bet slider, phase badge, pot display, hand result overlay, and dealer button | Kevin |
| Game customization         | 3 preset themes + custom mode; felt colors, card backs, backgrounds, animation speed | Kevin |
| Settings persistence       | Game settings stored in localStorage and applied per session | Kevin |
| User registration          | Email + username + password signup with validation | Marton |
| Google OAuth login         | Sign in with Google; auto-links to existing email accounts | Marton |
| User profiles              | Profile page with avatar, stats (wins/losses/hands played), and achievements | Marton |
| Avatar upload              | Upload a custom avatar (jpg, png, webp, gif, max 5 MB) or pick from presets | Marton |
| Friend system              | Send/accept/reject friend requests; view friend list with online status | Marton |
| Online presence            | `lastSeenAt` heartbeat; users shown as online within 10 seconds of last activity | Marton |
| Game statistics            | Win/loss counts, hands played, tracked and updated after every match | Marton, Tom |
| Match history              | Last 20 matches with opponent, result, score, and timestamp; real-time updates via Socket.IO | Marton, Tom |
| Achievements               | 36 achievements across game milestones, poker hands, and social actions | Marton, Tom |
| Leaderboard                | Friends leaderboard sorted by wins; global leaderboard of all-time top winners | Marton, Tom |
| Database schema            | Prisma schema with User, Match, Friendship, Achievement, Account, Session models | Tom |
| Dockerization              | Docker Compose setup for frontend + PostgreSQL; auto-runs migrations on startup | Tom |
| HTTPS / TLS                | Self-signed certificate generated at build time; production runs on port 443 | Tom |
| Multi-browser support      | Full compatibility with Chrome, Brave, and Edge | Marton |
| Animated UI                | Card dealing animations, card flips, framer-motion transitions | Kevin |
| Landing page               | Landing page with hero section and legal links | Kevin |
| Legal pages                | Privacy Policy and Terms of Service pages | Marton |

---

## Modules

All modules satisfy the minimum 14-point requirement, totaling **17 points**.

### Major Modules (2 pts each)

#### Web Framework — Next.js (Full-Stack)
**Points:** 2 | **Who:** All team members

Next.js is used as both the frontend (React pages, App Router) and the backend (API routes, server actions). This satisfies the subject's full-stack framework requirement in a single tool. The entire application — UI, auth, database access, and server logic — lives in one Next.js project.

#### Real-Time Features — Socket.IO
**Points:** 2 | **Who:** Matthias Volgger

Socket.IO powers all real-time game communication: player actions, game state broadcasting, chat messages, and match result notifications. Each game runs in a named Socket.IO room. The server handles connection, disconnection, and reconnection events gracefully. Disconnected players are auto-acted on their turn so games never stall.

#### Standard User Management
**Points:** 2 | **Who:** Marton Telek

Users can register, log in, update their profile (username, email, avatar), add and remove friends, and view other players' profile pages. Avatars can be uploaded or chosen from a preset set. Friend status (online/offline) is tracked via a presence heartbeat.

#### Web-Based Game — Texas Hold'em Poker
**Points:** 2 | **Who:** Matthias Volgger, Kevin Bräuer

A complete Texas Hold'em implementation playable in the browser. Supports all standard betting rounds, hand rankings (High Card → Royal Flush), all-in scenarios, and pot management. The game has clear win/loss conditions: the last player with chips wins. The UI displays community cards, player chip stacks, the dealer button, and the current betting phase.

#### Multiplayer — More Than Two Players
**Points:** 2 | **Who:** Matthias Volgger, Marton Telek

Games support up to 3 simultaneous players. When a player runs out of chips, they are eliminated and the table reshuffles with the remaining players. The game continues until one player holds all the chips. Synchronization is maintained across all clients throughout eliminations and hand transitions.

#### Remote Players
**Points:** 2 | **Who:** Matthias Volgger, Marton Telek

Two or more players on entirely separate machines can join the same game and play in real time. Network latency is absorbed by the server-authoritative Socket.IO state model. When a player disconnects mid-game, they are marked inactive and auto-acted on their turn (fold or check). The game continues without waiting. Reconnection logic restores an active player to their session if they rejoin before the game ends.

---

### Minor Modules (1 pt each)

#### ORM — Prisma
**Points:** 1 | **Who:** Tom Meniga

Prisma is used as the ORM between Next.js and PostgreSQL. All database queries are written in type-safe TypeScript rather than raw SQL. Prisma's migration system manages schema changes, and Prisma Studio was used during development for visual database inspection.

#### Remote Authentication — Google OAuth
**Points:** 1 | **Who:** Marton Telek

Users can sign in with their Google account via OAuth 2.0 through Auth.js. If the Google email matches an existing credentials account, the accounts are linked automatically. Google profile images are downloaded and stored locally on first login.

#### Game Customization
**Points:** 1 | **Who:** Kevin Bräuer

Players can customize the game table before starting a match. Three built-in themes (Classic Vegas, Wood Lodge, Garden) apply coordinated felt colors, card backs, and backgrounds in one click. A Custom mode lets players mix and match: 6 felt colors, 8 card back designs, 4 background styles. Animation speed can also be adjusted (slow / normal / fast). A Special Chip power-up can be toggled on or off. Default options are always available and pre-selected.

#### Game Statistics and Match History
**Points:** 1 | **Who:** Marton Telek, Tom Meniga

After every match, results are persisted to the database: winner, all player IDs, final chip counts, and game mode. Each user's win/loss/hands-played totals update automatically. The match history view shows the last 20 games with opponent name, avatar, result, score, and timestamp. History updates in real time via a Socket.IO subscription. A leaderboard ranks users by wins (friends view and global view). 36 achievements unlock based on milestones, poker hand outcomes, and social actions.

#### Multi-Browser Support
**Points:** 1 | **Who:** Marton Telek

All features were tested and verified in **Chrome**, **Brave**, and **Edge**.

**Known limitation:** Edge may display a placeholder for lazy-loaded images briefly before rendering them. All game functionality remains unaffected.

---

## Individual Contributions

### Marton Telek

**Areas:** Authentication, user management, friend system, multi-browser support, remote players (with Matthias), game statistics (with Tom)

- Set up Auth.js with both Credentials (email/password) and Google OAuth providers
- Implemented Google account linking to existing credentials accounts and remote avatar caching
- Built the full user profile system: profile page, avatar upload with validation (file type, size, path traversal protection), avatar preset picker
- Built the friend system: send/accept/reject requests, bidirectional friendship edges, friend list with online/offline status
- Implemented the presence heartbeat (`lastSeenAt` timestamp updated by the client on an interval)
- Tested and fixed all features across Chrome, Brave, and Edge; documented the Edge lazy-image limitation
- Collaborated with Matthias on remote player reconnection logic and disconnection handling
- Built the match history API, history UI component, and real-time Socket.IO subscription for live updates
- Built the leaderboard (friends and global views) and achievement unlock logic (36 achievements)

**Challenges:** Handling Google OAuth account linking while avoiding duplicate accounts required careful logic: check if an email already exists before creating a new user, then attach the OAuth provider record to the existing account. Getting online status right (avoiding false "online" readings from stale timestamps) required tuning the heartbeat interval and the 10-second presence window.

---

### Tom Meniga

**Areas:** Tech lead, database design, Prisma, Docker, game statistics (with Marton)

- Led all major technical decisions: choice of Next.js as the full-stack framework, PostgreSQL + Prisma for data persistence, Socket.IO for real-time communication, and Docker for deployment
- Designed the complete PostgreSQL schema: User, Account, Session, Friendship, Match, Achievement, and VerificationToken models
- Wrote and maintained all Prisma migrations across development iterations
- Containerized the entire application with Docker: wrote the multi-stage Dockerfile for the Next.js app, the PostgreSQL container configuration, and Docker Compose files for both production and development
- Implemented HTTPS for production: OpenSSL certificate generation baked into the Docker build step; Nginx-style port forwarding from 80 → 443
- Configured database health checks so the frontend container waits for PostgreSQL to be ready before starting
- Built the Makefile with targets for `up`, `down`, `clean`, `dev`, `dev-clean`, `lint`, and `reset`
- Collaborated with Marton on the match persistence logic (`persistMatch()`), the statistics API endpoints, and the leaderboard SQL queries

**Challenges:** Getting Docker to reliably generate TLS certificates at build time and inject the correct IP into the Next.js config (for `AUTH_URL`) required a combination of Docker build args and entrypoint scripting. Making the dev and production Docker Compose files share the same `.env` without duplication also needed careful factoring.

---

### Matthias Volgger

**Areas:** Poker game engine, real-time backend, Socket.IO infrastructure

- Integrated the `poker-ts` library and built the server-side game state machine on top of it (`server/poker/`)
- Implemented all Socket.IO event handlers: lobby creation, game joining, player actions (fold/check/call/bet/raise), special chip, chat, and disconnection
- Built the game snapshot system that serializes state per player (hiding opponent cards, computing legal actions and bet ranges)
- Implemented the 5-second reveal timer, and state broadcasting
- Handled the full hand lifecycle: community card progression across streets, showdown evaluation, pot distribution, and hand result display
- Implemented player elimination for 3-player games: table reshuffling, seat remapping, and game continuation with remaining players
- Built the disconnection handling: auto-fold or auto-check for inactive players, reconnection detection on rejoin
- Set up the Socket.IO server with HTTPS and CORS configuration

**Challenges:** Managing game state across disconnects and reconnects was the hardest part. Players needed to be able to reload the page mid-game and land back in the correct state without corrupting the table. The solution involved tracking players by username rather than socket ID and re-associating on reconnect.

---

### Kevin Bräuer

**Areas:** Frontend, UI/UX design, game customization

- Built the frontend component architecture for the Next.js frontend (App Router structure, component hierarchy)
- Designed and implemented the full game customization system: theme presets, felt color picker, card back selector, background variant selector, animation speed setting
- Implemented the settings drawer UI 
- Built and styled the landing page
- Contributed to the game table UI (layout, action bar design, chip display, phase badge)
- Implemented the reveal visualization on the game table
- Integrated Framer Motion for card dealing animations, card flip transitions, and UI entrance effects

**Challenges:** Designing a customization system flexible enough for full custom mode while keeping preset themes simple required a layered context + CSS filter architecture. Getting animations to feel natural at different speeds while respecting `prefers-reduced-motion` also needed careful handling.

---

## Known Limitations

- Reconnection after a player is fully eliminated is not supported (the eliminated player is disconnected and cannot rejoin)
- The TLS certificate in production is self-signed; browsers will show a security warning on first visit
- Edge (Microsoft) may briefly show a placeholder for lazy-loaded images before rendering them — all functionality is unaffected
- Game sessions are stored in server memory; restarting the Docker container will end any in-progress games

---

## License

This project was created for educational purposes as part of the 42 school curriculum. No commercial use intended.
