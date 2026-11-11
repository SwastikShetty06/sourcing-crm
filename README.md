# Sourcing CRM

## Prerequisites

Node.js 20 or higher.

## Setup

1. Install root dependencies:
   ```bash
   npm install
   ```

2. Install server and client dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   cd ..
   ```

3. Create the server environment file:
   Copy `server/.env.example` to `server/.env` and update the values.

4. Start development servers:
   ```bash
   npm run dev
   ```

5. First-run admin setup:
   Open http://localhost:5173 in your browser. The setup screen will prompt you to create the initial admin account.

## Deployment (Vercel)

1. Set the following environment variables in your Vercel Project Settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `MONGODB_DB`: `cp_ledger`
   - `JWT_SECRET`: Random 32+ character string
   - `NODE_ENV`: `production`

2. Deploy directly via the Vercel Dashboard by importing your GitHub repository.
