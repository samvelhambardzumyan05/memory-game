# Memory Card Game — Deploy Guide (beginner friendly)

Follow these steps in order. When you're done, you'll have **one link** you can send to anyone in the world.

Example link: `https://memory-game-xxxx.onrender.com`

---

## What you are doing (simple explanation)

1. Put your code on **GitHub** (online storage for code)
2. Connect **Render** to GitHub (Render runs your game on the internet 24/7)
3. Share the Render link with friends

---

## STEP 1 — Create a GitHub account

1. Open: https://github.com/signup
2. Enter your email, password, and username
3. Verify your email when GitHub asks

You only do this once.

---

## STEP 2 — Create a new repository on GitHub

1. Log in to GitHub
2. Click the **+** button (top right) → **New repository**
3. Fill in:
   - **Repository name:** `memory-game` (or any name you like)
   - **Description:** optional
   - Choose **Public**
   - Do **NOT** check "Add a README" (your project already has files)
4. Click **Create repository**
5. Keep that page open — you'll see a URL like:
   `https://github.com/YOUR_USERNAME/memory-game.git`

Write down your username and repo name.

---

## STEP 3 — Upload your project from your PC to GitHub

Open **Terminal** in Cursor (Terminal → New Terminal) and run these commands **one at a time**.

Replace `YOUR_USERNAME` with your real GitHub username:

```powershell
cd "C:\Users\user\OneDrive\Desktop\MemeryGame"
git init
git add .
git commit -m "Memory game ready for online deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/memory-game.git
git push -u origin main
```

### First time pushing?

GitHub will ask you to log in.

- **Username:** your GitHub username
- **Password:** use a **Personal Access Token** (NOT your GitHub password)

To create a token:
1. GitHub → click your profile picture → **Settings**
2. Left side: **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)**
4. Note: `memory-game deploy`
5. Check **repo** (full control of private repositories)
6. Generate and **copy the token** (you won't see it again)
7. Paste it when Git asks for password

After success, refresh your GitHub repo page — you should see all your files.

---

## STEP 4 — Deploy on Render (put game online)

1. Open: https://render.com
2. Click **Get Started** → sign up with **GitHub** (easiest — connects automatically)
3. After login, click **New +** → **Web Service**
4. Connect your GitHub account if asked
5. Find and select your **memory-game** repository
6. Fill in the form:

| Field | Value |
|--------|--------|
| **Name** | `memory-game` (or anything) |
| **Region** | Pick closest to you |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

7. Click **Advanced** → **Add Environment Variable**:
   - **Key:** `NODE_ENV`
   - **Value:** `production`

8. Click **Create Web Service**

Render will build for 3–5 minutes. Wait until status says **Live**.

Your game URL will look like:
`https://memory-game-xxxx.onrender.com`

---

## STEP 5 — Test and share

1. Open your Render URL in the browser
2. **Player 1:** Create Room → copy Room ID
3. **Player 2:** Open the **same link** on another phone/PC (even mobile data) → Join Room
4. Play!

Send friends only this link:
`https://your-app-name.onrender.com`

They do **not** need your Wi‑Fi or your PC turned on.

---

## Important notes

### Free plan sleeps
Render free tier sleeps after ~15 minutes with no players. First visit after sleep may take **30–60 seconds** to wake up. This is normal.

### Updating your game later
After you change code on your PC:

```powershell
cd "C:\Users\user\OneDrive\Desktop\MemeryGame"
git add .
git commit -m "Describe your change"
git push
```

Render redeploys automatically in a few minutes.

### Local development (still works)
Two terminals on your PC:

```powershell
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Open http://localhost:5173

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Build failed on Render | Open Render → your service → **Logs** tab, read the red error |
| "Cannot connect to server" online | Wait for deploy to finish; check `NODE_ENV=production` is set |
| git push rejected | Make sure repo URL matches your GitHub username |
| Page blank online | Check Render logs; ensure build succeeded |

---

## Need help?

If a step fails, tell me:
1. Which step number
2. The exact error message
3. A screenshot if possible
