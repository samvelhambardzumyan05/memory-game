# Upload your code to GitHub (repo is empty — fix in 3 minutes)

Your game is **ready on your PC**. GitHub is empty because upload needs **your login**.

---

## EASIEST WAY — GitHub Desktop (recommended)

### 1. Download GitHub Desktop
https://desktop.github.com

Install it and open it.

### 2. Sign in
- Click **Sign in to GitHub.com**
- Log in as: **samvelhambardzumyan05**

### 3. Add your project
- Menu: **File → Add local repository**
- Click **Choose...**
- Select this folder:
  ```
  C:\Users\user\OneDrive\Desktop\MemeryGame
  ```
- Click **Add repository**

### 4. Publish to GitHub
- If you see **Publish repository** button → click it
- Name: `memory-game`
- Uncheck "Keep this code private" if you want it free on Render
- Click **Publish repository**

**OR** if you see **Push origin** button → click **Push origin**

### 5. Check it worked
Open: https://github.com/samvelhambardzumyan05/memory-game

You should see folders: `src`, `server`, `package.json`, etc.

---

## ALTERNATIVE — Cursor (inside the editor)

1. Click the **Source Control** icon on the left (branch icon)
2. Click **Publish Branch** or **Sync Changes**
3. Sign in to GitHub when Cursor asks
4. Choose repo: `samvelhambardzumyan05/memory-game`

---

## After GitHub has your files

Go to https://render.com → sign up with GitHub → New Web Service → select **memory-game**

| Setting | Value |
|---------|--------|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Env variable | `NODE_ENV` = `production` |

Wait until **Live** → share your link!

---

## Still stuck?

Tell me which method you tried (Desktop or Cursor) and what button/message you see.
