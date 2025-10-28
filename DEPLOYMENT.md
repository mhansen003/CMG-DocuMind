# CMG DocuMind - Deployment Guide

## Quick Overview
- **Frontend**: Deployed on Vercel (React/Vite app)
- **Backend**: Deployed on Render (Node.js/Express API)
- **Cost**: 100% FREE (using free tiers)

---

## Prerequisites
1. GitHub account
2. Vercel account (sign up at https://vercel.com with GitHub)
3. Render account (sign up at https://render.com with GitHub)

---

## Part 1: Deploy Backend to Render

### Step 1: Push Code to GitHub
```bash
cd C:\GitHub\CMG-DocuMind
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `CMG-DocuMind`
4. Configure the service:
   - **Name**: `cmg-documind-backend`
   - **Region**: Choose closest to you (e.g., Oregon (US West))
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**

5. Click **"Create Web Service"**

6. **Wait 5-10 minutes** for deployment to complete

7. **Copy your backend URL**: It will look like:
   ```
   https://cmg-documind-backend.onrender.com
   ```

### Important Notes for Render:
- Free tier services **sleep after 15 minutes** of inactivity
- First request after sleep takes ~30 seconds to wake up
- **This is normal and free!**

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend Configuration

Before deploying, update the backend URL in your frontend code:

1. The backend URL will be used for API calls
2. Note your Render backend URL from Part 1

### Step 2: Deploy on Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `CMG-DocuMind`
4. Configure the project:
   - **Project Name**: `cmg-documind`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Environment Variables** (Add these):
   ```
   VITE_API_URL=https://cmg-documind-backend.onrender.com
   ```

6. Click **"Deploy"**

7. **Wait 2-5 minutes** for deployment

8. **Your live URL** will be:
   ```
   https://cmg-documind.vercel.app
   ```
   (or a custom domain if you set one up)

---

## Part 3: Update Backend CORS Settings

After getting your Vercel URL, you need to allow it in the backend:

1. Go to your backend code: `backend/server.js`
2. Update the CORS origin to include your Vercel URL:

```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://cmg-documind.vercel.app'  // Add your Vercel URL here
  ]
}));
```

3. Commit and push changes:
```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push origin main
```

4. Render will **automatically redeploy** (takes 2-3 minutes)

---

## Redeployment Instructions

### Redeploy Backend (Render)
**Option 1: Automatic (recommended)**
```bash
git add .
git commit -m "Update backend"
git push origin main
```
- Render detects changes and auto-deploys

**Option 2: Manual**
1. Go to https://render.com/dashboard
2. Click on `cmg-documind-backend`
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Redeploy Frontend (Vercel)
**Option 1: Automatic (recommended)**
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
- Vercel detects changes and auto-deploys

**Option 2: Manual**
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **"Deployments"** tab
4. Click **"..."** on latest commit → **"Redeploy"**

---

## Troubleshooting

### Backend Issues

**Problem**: Backend is slow or timing out
- **Cause**: Free tier services sleep after 15 minutes
- **Solution**: Wait 30 seconds for first request after sleep

**Problem**: CORS errors in browser console
- **Solution**: Check that your Vercel URL is in the CORS whitelist (backend/server.js)

**Problem**: Video not loading
- **Solution**: Ensure video file is in `backend/public/` and is committed to Git

### Frontend Issues

**Problem**: White screen or errors
- **Solution**: Check browser console for errors. Verify `VITE_API_URL` environment variable in Vercel

**Problem**: API calls failing
- **Solution**: Verify backend URL is correct and backend is running

### General Issues

**Problem**: Changes not showing
- **Solution**: Hard refresh (Ctrl+Shift+R) or clear cache

**Problem**: Deployment failed
- **Solution**: Check build logs in Render/Vercel dashboard for specific errors

---

## Custom Domain (Optional)

### Add Custom Domain to Vercel
1. Go to your project settings in Vercel
2. Navigate to **"Domains"**
3. Add your custom domain (e.g., `documind.yourcompany.com`)
4. Follow DNS configuration instructions
5. SSL certificate is automatically provisioned

### Add Custom Domain to Render
1. Go to your service settings in Render
2. Navigate to **"Custom Domains"**
3. Add your custom domain
4. Update DNS records as instructed
5. SSL certificate is automatically provisioned

---

## Monitoring & Logs

### View Backend Logs (Render)
1. Go to https://render.com/dashboard
2. Click on `cmg-documind-backend`
3. Click **"Logs"** tab
4. Real-time logs display here

### View Frontend Logs (Vercel)
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click **"Deployments"** → Select a deployment
4. Click **"Building"** or **"Logs"** to view

---

## Cost & Limits

### Render Free Tier
- ✅ 750 hours/month per service (enough for 24/7)
- ✅ Services sleep after 15 min inactivity
- ✅ 500 MB RAM
- ✅ Automatic SSL
- ❌ No custom domain on free tier (use .onrender.com URL)

### Vercel Free Tier
- ✅ Unlimited projects
- ✅ 100 GB bandwidth/month
- ✅ Automatic SSL
- ✅ Custom domains supported
- ✅ Automatic deployments from Git

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **GitHub Issues**: https://github.com/anthropics/claude-code/issues

---

## Quick Links

After deployment, save these URLs:

- **Live App**: https://cmg-documind.vercel.app
- **Backend API**: https://cmg-documind-backend.onrender.com
- **GitHub Repo**: https://github.com/[your-username]/CMG-DocuMind
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://render.com/dashboard

---

**Last Updated**: {DATE}
**Deployed By**: Mark Hansen
