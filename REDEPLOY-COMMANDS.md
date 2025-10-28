# Quick Redeploy Commands

## 🚀 One-Command Deployment

After making changes, run this single command to deploy everything:

```bash
cd "C:\GitHub\CMG-DocuMind" && git add . && git commit -m "Update deployment" && git push origin main
```

This will:
- ✅ Add all changes to Git
- ✅ Commit with a message
- ✅ Push to GitHub
- ✅ **Automatically trigger Render backend redeploy** (2-3 min)
- ✅ **Automatically trigger Vercel frontend redeploy** (2-5 min)

---

## 📋 Current Deployment URLs

- **Live Site (Frontend)**: https://cmg-docu-mind.vercel.app/
- **API (Backend)**: https://cmg-documind.onrender.com/
- **GitHub Repo**: https://github.com/mhansen003/CMG-DocuMind

---

## 🔧 Manual Steps (Only if needed)

### If Git Remote is Missing:
```bash
cd "C:\GitHub\CMG-DocuMind"
git remote add origin https://github.com/mhansen003/CMG-DocuMind.git
```

### View Deployment Status:
- **Render**: https://dashboard.render.com/
- **Vercel**: https://vercel.com/dashboard

---

## ⚙️ Environment Variables (Already Configured)

### Render (Backend):
- `OPENAI_API_KEY` = [Your OpenAI key]

### Vercel (Frontend):
- `VITE_API_URL` = https://cmg-documind.onrender.com

---

## 🐛 Troubleshooting

### Backend slow on first request?
- **Normal!** Free tier sleeps after 15 min inactivity
- First request takes ~30 seconds to wake up

### CORS errors?
- Backend CORS is configured for: `https://cmg-docu-mind.vercel.app`
- If you change Vercel URL, update `backend/server.js` CORS settings

### Changes not showing?
- Wait 2-5 minutes for auto-deployment
- Check build logs on Render/Vercel dashboards
- Hard refresh browser (Ctrl+Shift+R)

---

**Last Updated**: 2025-10-27
**Deployed By**: Mark Hansen (with Claude Code)
