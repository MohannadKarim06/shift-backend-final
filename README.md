# Shift AI — Backend

FastAPI backend for the Shift AI platform. Built for Telfaz11.

## Stack
- **Framework**: FastAPI (Python 3.12)
- **Auth**: Firebase Auth + Custom Claims (role-based)
- **Database**: Firestore
- **AI**: Claude (Anthropic) — Sonnet 4 for agents, Haiku 4.5 for lightweight tasks
- **Deployment**: Fly.io (Dubai region)
- **CI/CD**: GitHub Actions → auto-deploy on push to main

## Roles (matching UI exactly)
| Role | Permissions |
|------|-------------|
| `Team Member` | Run workflows, submit outputs, contribute prompts, vote |
| `Admin` | All above + create workflows, approve/reject submissions, award points, manage users |
| `Super Admin` | Full access including admin management |

## Local Setup

```bash
# 1. Clone and enter the project
git clone git@github.com:YOUR_USERNAME/shift-ai-backend.git
cd shift-ai-backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment
cp .env.example .env
# Edit .env — add your Anthropic API key and Firebase credentials path

# 5. Download Firebase service account
# Firebase Console → Project Settings → Service Accounts → Generate new private key
# Save as firebase-credentials.json in project root (never commit this)

# 6. Run
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/verify | Any | Verify token, return role |
| POST | /auth/set-role | Super Admin | Assign role to user |
| GET | /users/me | Any | Current user profile |
| GET | /users/ | Admin | List all users |
| PUT | /users/{uid}/role | Admin | Update user role |
| GET | /users/leaderboard | Any | Global leaderboard |
| GET | /users/leaderboard/{dept} | Any | Dept leaderboard |
| GET | /workflows/ | Any | List all workflows |
| GET | /workflows/{id} | Any | Get workflow |
| POST | /workflows/ | Admin | Create workflow |
| PUT | /workflows/{id} | Admin | Update workflow |
| DELETE | /workflows/{id} | Admin | Delete workflow |
| POST | /agents/{id}/chat | Any | Run AI agent |
| GET | /prompts/ | Any | List prompts (by votes) |
| POST | /prompts/ | Any | Submit prompt |
| PUT | /prompts/{id} | Author/Admin | Edit prompt |
| DELETE | /prompts/{id} | Author/Admin | Delete prompt |
| POST | /prompts/{id}/vote | Any | Toggle upvote |
| POST | /prompts/optimize | Any | Optimize prompt via Claude |
| GET | /submissions/ | Admin | All submissions |
| GET | /submissions/mine | Any | My submissions |
| POST | /submissions/ | Any | Submit output |
| PUT | /submissions/{id}/approve | Admin | Approve + award points |
| PUT | /submissions/{id}/reject | Admin | Reject submission |
| POST | /submissions/analyze | Any | Analyze via Claude |
| GET | /admin/stats | Admin | Platform stats |

## Fly.io Deployment

```bash
# Install Fly CLI
brew install flyctl  # or https://fly.io/docs/hands-on/install-flyctl/

# Login
fly auth login

# First deploy
fly launch  # uses existing fly.toml

# Set secrets (do this before first deploy)
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly secrets set FIREBASE_CREDENTIALS_JSON='PASTE_FULL_JSON_HERE'
fly secrets set SUPER_ADMIN_EMAIL=asayeh@telfaz11.com
fly secrets set APP_ENV=production
fly secrets set DEBUG=false
fly secrets set ALLOWED_ORIGINS='["https://your-frontend-domain.com"]'

# Deploy
fly deploy

# Check logs
fly logs
```

## CI/CD
Push to `main` → GitHub Actions runs → deploys to Fly.io automatically.
Add `FLY_API_TOKEN` to GitHub repo secrets (Settings → Secrets → Actions).
Get your token: `fly auth token`

## Frontend Integration
See `frontend-service/api.ts` — drop this into the UI's `src/services/` folder
and replace all imports from `geminiService` with imports from `api`.

Add to the UI's `.env`:
```
VITE_API_URL=https://shift-ai-backend.fly.dev
```
