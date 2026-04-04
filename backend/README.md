# InstaSure Backend (MongoDB Edition)

Full Express + MongoDB backend replacing the original in-memory server.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and paste your MongoDB URI
   ```

3. **Seed the database** (run once to populate demo data)
   ```bash
   npm run seed
   ```

4. **Start the server**
   ```bash
   npm start        # production
   npm run dev      # development (nodemon)
   ```

## Deploy on Railway

1. Push this folder to a GitHub repo (or a subfolder of InstaSure)
2. Railway → New Project → GitHub Repository → select repo
3. Set Root Directory to `backend` (if inside InstaSure monorepo)
4. Add environment variable:
   - `MONGODB_URI` = your MongoDB Atlas connection string
5. Railway auto-detects Node.js and runs `npm start`

## Get a free MongoDB URI (MongoDB Atlas)

1. Go to https://mongodb.com/atlas → sign up free
2. Create a free M0 cluster
3. Database Access → Add user (e.g. `instasure` / your password)
4. Network Access → Allow access from anywhere (`0.0.0.0/0`)
5. Connect → Drivers → copy the URI, replace `<password>`

## Demo Credentials

- Worker login: phone `9100000001`, PIN `1234` (Rahul Sharma)
- Admin login: `admin@instasure.com` / `Admin@123`

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PORT` | Server port (default: 3001, Railway sets this automatically) |
