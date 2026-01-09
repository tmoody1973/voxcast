# Voxcast - Station Console

AI-powered intelligence platform for public radio stations. Your Chief of Staff for cross-department insights.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Convex** - Real-time database and backend functions
- **Clerk** - Authentication and user management
- **Tailwind CSS** - Utility-first styling

## Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account (free tier available)
- Clerk account (free tier available)

## Setup

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Configure Convex

```bash
# Initialize Convex and connect to cloud
npx convex dev --once --configure=new
```

This will:
- Create a new Convex project
- Generate the `convex/_generated` types
- Set `NEXT_PUBLIC_CONVEX_URL` in `.env.local`

### 3. Configure Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Copy your keys to `.env.local`:

```bash
cp .env.local.example .env.local
```

Then add your Clerk keys:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 4. Run Development Server

```bash
# Start Convex dev server (in one terminal)
npx convex dev

# Start Next.js dev server (in another terminal)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
app/
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema (signals, entities, relationships)
│   ├── signals.ts         # Signal emission API
│   ├── entities.ts        # Knowledge graph API
│   └── _generated/        # Auto-generated types
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── layout.tsx     # Root layout with providers
│   │   ├── page.tsx       # Landing page
│   │   ├── sign-in/       # Clerk sign-in page
│   │   └── sign-up/       # Clerk sign-up page
│   └── middleware.ts      # Clerk auth middleware
└── .env.local             # Environment variables (not committed)
```

## Architecture

This project implements the **Station Pulse** architecture:

- **Signal-Driven**: Cross-agent intelligence through standardized signals
- **Knowledge Graph**: Institutional memory for entities and relationships
- **Multi-Agent**: Specialized agents for different station operations

See `/docs/prd.md` and `/docs/architecture.md` for full documentation.

## Development

### Convex Commands

```bash
# Run dev server with hot reload
npx convex dev

# Deploy to production
npx convex deploy

# View dashboard
npx convex dashboard
```

### Linear Integration

Stories are tracked in Linear under the MOO project:
- **MOO-10**: Station Pulse Core (Epic)
- **MOO-11**: Prep Briefs (Epic)
- **MOO-12**: Consequence Preview (Epic)

## License

Proprietary - All rights reserved
