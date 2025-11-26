# Step-by-Step Deployment Guide for Render

## 📚 Prerequisites

Before you begin, make sure you have:

- ✅ A GitHub account
- ✅ Your code pushed to a GitHub repository
- ✅ A Render account (free at render.com)
- ✅ Google Gemini API key (get from ai.google.dev)
- ✅ All code changes applied (see below)

---

## 🔧 Step 1: Apply Code Fixes

### Option A: Use the Fixed File (Recommended)

Replace your current `main_app.py` with `main_app_fixed.py`:

```bash
cd server
mv main_app.py main_app_backup.py
mv main_app_fixed.py main_app.py
```

### Option B: Manually Apply Changes

If you prefer to update manually, make these changes to `server/main_app.py`:

**1. Add imports at the top:**
```python
import os
from pathlib import Path
```

**2. Add BASE_DIR after imports:**
```python
# Get base directory for resolving paths
BASE_DIR = Path(__file__).resolve().parent
```

**3. Update line 103 (indian_places.csv path):**
```python
# OLD:
csv_file_path = '.\\data\\indian_places.csv'

# NEW:
csv_file_path = BASE_DIR / 'data' / 'indian_places.csv'
```

**4. Update line 130 (NER model path):**
```python
# OLD:
nlp1 = spacy.load(r"./models/ner_model_occasion/output/model-best")

# NEW:
model_occasion_path = BASE_DIR / 'models' / 'ner_model_occasion' / 'output' / 'model-best'
nlp1 = spacy.load(str(model_occasion_path))
```

**5. Update lines 531-535 (port binding):**
```python
# OLD:
if __name__ == '__main__':
    app.run(debug=True)

# NEW:
if __name__ == '__main__':
    # Get port from environment variable (Render sets this)
    port = int(os.environ.get('PORT', 5000))
    
    # Use 0.0.0.0 to allow external connections
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
```

**6. Add environment variable validation (after imports):**
```python
# Access environment variables with error handling
token = os.environ.get("GEMINI_KEY")
if not token:
    raise ValueError("GEMINI_KEY environment variable is required!")
```

---

## 📤 Step 2: Push Changes to GitHub

```bash
# Add all changes
git add .

# Commit changes
git commit -m "Fix: Update app for Render deployment"

# Push to GitHub
git push origin main
```

---

## 🚀 Step 3: Deploy on Render

### 3.1 Create New Web Service

1. Log in to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect to GitHub"** (authorize if needed)
4. Select your repository: `conversational-fashion-outfit-generator`
5. Click **"Connect"**

### 3.2 Configure Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `fashion-outfit-backend` (or your choice) |
| **Region** | `Oregon (US West)` (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Python 3` |
| **Build Command** | See below ⬇️ |
| **Start Command** | `cd server && python main_app.py` |

#### Build Command:
```bash
cd server && pip install --upgrade pip && pip install -r requirements.txt && python -m spacy download en_core_web_md && python -m spacy download en_core_web_sm
```

### 3.3 Select Plan

- **Free Tier** is fine for testing (sleeps after 15 min of inactivity)
- **Starter** ($7/month) if you need always-on

### 3.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `GEMINI_KEY` | `your_actual_api_key` | Get from ai.google.dev |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Update after deploying frontend |
| `PYTHON_VERSION` | `3.9.16` | Specify Python version |
| `FLASK_DEBUG` | `False` | Production mode |

**⚠️ IMPORTANT:** Keep your `GEMINI_KEY` secret! Never commit it to Git.

### 3.5 Create Service

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes for first deploy)
3. Watch the logs for any errors

---

## ✅ Step 4: Verify Deployment

### 4.1 Check Deployment Logs

In Render dashboard:
1. Click on your service
2. Go to **"Logs"** tab
3. Look for: `Starting Flask app on port 10000`
4. Verify no errors

### 4.2 Get Your API URL

Your API will be available at:
```
https://fashion-outfit-backend.onrender.com
```

(Replace `fashion-outfit-backend` with your actual service name)

### 4.3 Test the API

Using cURL:
```bash
curl -X POST https://your-service.onrender.com/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Suggest an outfit for a party"}'
```

Using Postman:
- Method: POST
- URL: `https://your-service.onrender.com/api/recommendations`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "userMessage": "Suggest an outfit for a wedding"
  }
  ```

---

## 🎨 Step 5: Deploy Frontend

### Option A: Vercel (Recommended for React)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Update API endpoint in client**:
   
   Edit `client/src/components/Chatbox-new.js`:
   ```javascript
   // Line 31-36
   const API_URL = process.env.REACT_APP_API_URL || "https://your-service.onrender.com";
   
   const response = await axios.post(
     `${API_URL}/api/recommendations`,
     { userMessage: sample ? textbtn : input }
   );
   ```

3. **Create `.env.production` in client folder**:
   ```env
   REACT_APP_API_URL=https://fashion-outfit-backend.onrender.com
   ```

4. **Deploy**:
   ```bash
   cd client
   vercel --prod
   ```

5. **Get your frontend URL** (e.g., `https://your-app.vercel.app`)

### Option B: Netlify

1. **Build the app**:
   ```bash
   cd client
   npm run build
   ```

2. **Deploy**:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `build` folder
   - Or use CLI: `netlify deploy --prod`

### Option C: Render Static Site

1. In Render dashboard: **New +** → **Static Site**
2. Connect GitHub repo
3. Build command: `cd client && npm install && npm run build`
4. Publish directory: `client/build`

---

## 🔄 Step 6: Update CORS Settings

After deploying frontend, update backend CORS:

1. Go to Render dashboard → Your service
2. Navigate to **Environment** tab
3. Update `ALLOWED_ORIGINS`:
   ```
   https://your-app.vercel.app,https://www.yourdomain.com
   ```
4. Click **"Save Changes"**
5. Service will auto-redeploy

---

## 🧪 Step 7: Final Testing

### Test Full Flow:

1. Open your frontend URL
2. Try the sample prompts
3. Test voice input (if supported by browser)
4. Verify images load correctly
5. Test conversation flow

### Common Issues:

**Frontend can't connect to backend:**
- Check CORS settings
- Verify API URL is correct
- Check browser console for errors

**Images not loading:**
- Flipkart may block requests
- Check server logs for scraping errors

**Slow response:**
- First request after sleep takes ~30s (free tier)
- Consider upgrading to Starter plan

---

## 📊 Step 8: Monitoring

### View Logs

```bash
# In Render dashboard
Logs → Real-time logs
```

### Check Metrics

- CPU usage
- Memory usage
- Request count
- Error rate

### Set Up Alerts

1. Go to **Notifications** in Render
2. Add email for deployment failures
3. Set up Slack webhook (optional)

---

## 🔄 Continuous Deployment

Render auto-deploys on every push to `main` branch.

To disable:
1. Service settings → **Auto-Deploy**
2. Toggle off

To manually deploy:
1. Click **"Manual Deploy"**
2. Select branch
3. Click **"Deploy"**

---

## 🔧 Troubleshooting

### Deployment Failed

**Check logs for specific error:**
```
cd server && tail -f logs/error.log
```

**Common fixes:**
- Clear build cache: Settings → "Clear build cache" → Redeploy
- Check requirements.txt for version conflicts
- Verify all environment variables are set

### App Crashes After Deployment

**Check for:**
- Missing environment variables
- Port binding issues
- File path errors
- Model file not found

**Solution:**
1. Check logs in Render dashboard
2. Look for stack trace
3. Fix error in code
4. Push to GitHub
5. Render auto-redeploys

### High Memory Usage

**Free tier limit: 512MB**

**Solutions:**
- Upgrade to Starter plan (1GB)
- Implement lazy loading for models
- Optimize code to use less memory

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/2.3.x/deploying/)
- [Vercel Documentation](https://vercel.com/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)

---

## 🎯 Quick Reference

### Backend URL Format
```
https://[service-name].onrender.com
```

### API Endpoints
```
POST /api/recommendations
```

### Environment Variables
```
GEMINI_KEY=<your-key>
ALLOWED_ORIGINS=<frontend-urls>
PORT=<auto-set-by-render>
```

### Common Commands
```bash
# View logs
curl https://api.render.com/v1/services/[service-id]/logs

# Redeploy
git push origin main

# Manual deploy
# Use Render dashboard
```

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] All code changes applied
- [ ] Changes pushed to GitHub
- [ ] GEMINI_KEY set in Render
- [ ] Service deployed successfully
- [ ] API endpoint tested
- [ ] Frontend deployed
- [ ] CORS updated with frontend URL
- [ ] Full flow tested
- [ ] Error handling working
- [ ] Monitoring set up

---

## 🚀 You're Live!

Congratulations! Your Conversational Fashion Outfit Generator is now live!

**Share your app:**
- Frontend URL: `https://your-app.vercel.app`
- API Docs: Can create with Swagger/OpenAPI

**Next steps:**
- Monitor performance
- Collect user feedback
- Add analytics (Google Analytics, Mixpanel)
- Implement caching for better performance
- Add rate limiting
- Set up CI/CD pipeline

---

*Need help? Check the [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for troubleshooting.*
