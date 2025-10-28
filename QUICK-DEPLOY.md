# 🚀 Quick Deployment Guide - Get Live in 15 Minutes!

Follow these steps **in order** to deploy CMG DocuMind:

---

## ⚡ Step 1: Push to GitHub (5 minutes)

### If you haven't already set up Git:

```bash
cd C:\GitHub\CMG-DocuMind

# Initialize git (if not done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - CMG DocuMind"

# Create repository on GitHub:
# 1. Go to https://github.com/new
# 2. Repository name: CMG-DocuMind
# 3. Make it Private
# 4. Click "Create repository"

# Link to GitHub (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/CMG-DocuMind.git
git branch -M main
git push -u origin main
```

### If you already have GitHub set up:

```bash
cd C:\GitHub\CMG-DocuMind
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## ⚡ Step 2: Deploy Backend on Render (5 minutes)

1. **Go to**: https://render.com
2. **Sign up** with GitHub (if new) or **Log in**
3. Click **"New +"** → **"Web Service"**
4. Click **"Connect" GitHub** → Authorize Render
5. **Select repository**: `CMG-DocuMind`

6. **Configure**:
   ```
   Name: cmg-documind-backend
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

7. Click **"Create Web Service"**

8. **⏱️ WAIT 5-10 minutes** - You'll see build logs

9. **✅ When done**, you'll see: "Your service is live 🎉"

10. **📋 COPY YOUR URL**:
    ```
    https://cmg-documind-backend.onrender.com
    ```
    **SAVE THIS URL - You'll need it for Step 3!**

---

## ⚡ Step 3: Deploy Frontend on Vercel (5 minutes)

1. **Go to**: https://vercel.com
2. **Sign up** with GitHub (if new) or **Log in**
3. Click **"Add New..."** → **"Project"**
4. Find **`CMG-DocuMind`** → Click **"Import"**

5. **Configure**:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

6. **Environment Variables** - Click "Add":
   ```
   Name: VITE_API_URL
   Value: [PASTE YOUR RENDER URL FROM STEP 2]

   Example: https://cmg-documind-backend.onrender.com
   ```

7. Click **"Deploy"**

8. **⏱️ WAIT 2-5 minutes** - You'll see build logs

9. **✅ When done**: "Congratulations! 🎉"

10. **📋 YOUR LIVE URL**:
    ```
    https://cmg-documind.vercel.app
    ```
    (or similar - Vercel will show you)

---

## ⚡ Step 4: Update CORS (2 minutes)

Now that you have your Vercel URL, add it to backend CORS:

1. **Open**: `C:\GitHub\CMG-DocuMind\backend\server.js`

2. **Find this line** (around line 18):
   ```javascript
   app.use(cors());
   ```

3. **Replace with**:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:5173',
       'https://cmg-documind.vercel.app'  // Your Vercel URL
     ]
   }));
   ```

4. **Save and push**:
   ```bash
   cd C:\GitHub\CMG-DocuMind
   git add backend/server.js
   git commit -m "Add production CORS"
   git push origin main
   ```

5. **Render will auto-redeploy** (takes 2-3 min)

---

## 🎉 Step 5: Test Your Live Site!

1. **Open your Vercel URL** in a browser
2. You should see the welcome splash video!
3. Click "Click to Play" → Video plays with sound
4. Click "Skip Introduction" or wait for it to finish
5. You'll see the dashboard!

---

## ✅ Success Checklist

- [ ] GitHub repository created and pushed
- [ ] Render backend deployed and URL copied
- [ ] Vercel frontend deployed with VITE_API_URL set
- [ ] CORS updated in backend with Vercel URL
- [ ] Site tested and working

---

## 📤 Share with Your Boss

**Your Live URL**:
```
https://cmg-documind.vercel.app
```

**Email Template**:
```
Subject: CMG DocuMind - Live Demo Ready

Hi [Boss Name],

I've deployed the CMG DocuMind prototype for your review:

🔗 Live Demo: https://cmg-documind.vercel.app

Features:
✅ AI-powered document extraction
✅ Real-time data validation scorecard
✅ Automated agent assignment for discrepancies
✅ Interactive document viewer
✅ Admin configuration panel

The demo includes sample loan data to showcase the functionality.

Please let me know your feedback!

Best regards,
Mark
```

---

## ⚠️ Important Notes

### Backend (Render Free Tier)
- **Sleeps after 15 minutes** of inactivity
- First load after sleep takes ~30 seconds
- This is **normal and free** - just wait!

### Video File
- The large intro video may take a moment to load
- Once loaded, it's cached by the browser

### First-Time Visitors
- Welcome video plays on first visit
- Skips on subsequent visits (until browser session ends)

---

## 🔧 Troubleshooting

### "Service Unavailable" Error
- **Cause**: Backend is waking up from sleep
- **Fix**: Wait 30 seconds and refresh

### CORS Error in Console
- **Cause**: Vercel URL not in CORS whitelist
- **Fix**: Complete Step 4 above

### Video Not Playing
- **Cause**: Large file still loading
- **Fix**: Click "Click to Play" and wait a few seconds

---

## 🔄 Redeployment

**To update the live site:**

```bash
cd C:\GitHub\CMG-DocuMind
git add .
git commit -m "Update features"
git push origin main
```

Both Render and Vercel will **auto-deploy** your changes!

---

## 📱 Mobile Access

Your site works on mobile too! Just share the URL:
```
https://cmg-documind.vercel.app
```

---

**Deployment Date**: {TODAY}
**Deployed By**: Mark Hansen
