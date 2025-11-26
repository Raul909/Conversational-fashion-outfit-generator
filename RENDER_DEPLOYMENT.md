# Render Deployment Issues & Solutions

## 🚨 Common Render Deployment Errors

This document provides detailed solutions for common errors encountered when deploying the Fashion Outfit Generator backend to Render.

---

## Error 1: Port Binding Issue

### ❌ Error Message
```
Error: Address already in use (0.0.0.0:5000)
or
Error: Failed to bind to 0.0.0.0:10000
```

### 🔍 Root Cause
The application is hardcoded to use a specific port, but Render assigns a dynamic port via the `PORT` environment variable.

### ✅ Solution

**Current Code (Line 531-532 in `main_app.py`):**
```python
if __name__ == '__main__':
    app.run(debug=True)
```

**Fixed Code:**
```python
if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
```

### 📝 Explanation
- `os.environ.get("PORT", 5000)` reads Render's dynamic port
- `host='0.0.0.0'` allows external connections
- `debug=False` for production deployment

---

## Error 2: Environment Variable Missing

### ❌ Error Message
```
KeyError: 'GEMINI_KEY'
or
genai.exceptions.InvalidArgument: API key not valid
```

### 🔍 Root Cause
The `GEMINI_KEY` environment variable is not set in Render's environment.

### ✅ Solution

**Step 1: Add Environment Variable in Render Dashboard**
1. Go to your Render service
2. Navigate to "Environment" tab
3. Add new environment variable:
   - **Key:** `GEMINI_KEY`
   - **Value:** Your Gemini API key

**Step 2: Update Code for Better Error Handling**
```python
import os
from dotenv import load_dotenv

# Load .env in development only
if os.path.exists('.env'):
    load_dotenv()

token = os.environ.get("GEMINI_KEY")
if not token:
    raise ValueError("GEMINI_KEY environment variable is not set!")

genai.configure(api_key=token)
```

---

## Error 3: Relative Path Issues

### ❌ Error Message
```
FileNotFoundError: [Errno 2] No such file or directory: '.\\data\\indian_places.csv'
```

### 🔍 Root Cause
Windows-style paths (`.\data\file.csv`) don't work on Linux (Render uses Linux containers).

### ✅ Solution

**Current Code (Line 103):**
```python
csv_file_path = '.\\data\\indian_places.csv'
```

**Fixed Code:**
```python
import os

# Get the directory where the script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_file_path = os.path.join(BASE_DIR, 'data', 'indian_places.csv')
```

**Apply this pattern to all file paths:**
- Line 103: `indian_places.csv`
- Line 130: NER model paths
- Any other file references

---

## Error 4: spaCy Model Not Found

### ❌ Error Message
```
OSError: [E050] Can't find model 'en_core_web_md'
or
FileNotFoundError: ./models/ner_model_occasion/output/model-best
```

### 🔍 Root Cause
spaCy models and custom NER models are not available after deployment.

### ✅ Solution

**Option A: Include in Build Command**

Create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: fashion-outfit-backend
    env: python
    region: oregon
    buildCommand: |
      cd server
      pip install -r requirements.txt
      python -m spacy download en_core_web_md
      python -m spacy download en_core_web_sm
    startCommand: cd server && python main_app.py
    envVars:
      - key: GEMINI_KEY
        sync: false
```

**Option B: Add to `requirements.txt`**
```txt
# Add these lines to requirements.txt
https://github.com/explosion/spacy-models/releases/download/en_core_web_md-3.7.0/en_core_web_md-3.7.0-py3-none-any.whl
https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.0/en_core_web_sm-3.7.0-py3-none-any.whl
```

**Option C: Download at Runtime** (not recommended)
```python
import spacy
import os

def ensure_spacy_model(model_name):
    try:
        spacy.load(model_name)
    except OSError:
        os.system(f"python -m spacy download {model_name}")

ensure_spacy_model("en_core_web_md")
```

---

## Error 5: Large Model Files / Slug Size

### ❌ Error Message
```
Error: Compiled slug size: 700MB is too large (max is 500MB)
```

### 🔍 Root Cause
The custom NER models in `models/` directory are very large.

### ✅ Solutions

**Option A: Use Cloud Storage**

1. Upload models to Google Cloud Storage / AWS S3
2. Download during deployment:

```python
import os
import requests

def download_model(url, dest_path):
    """Download model from cloud storage"""
    if not os.path.exists(dest_path):
        print(f"Downloading model to {dest_path}...")
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        response = requests.get(url, stream=True)
        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Model downloaded successfully!")

# At startup
MODEL_URL = "https://your-storage.com/models/ner_model_occasion.tar.gz"
MODEL_PATH = "./models/ner_model_occasion"
download_model(MODEL_URL, MODEL_PATH)
```

**Option B: Use `.gitignore` and Document Manual Upload**

Add to `.gitignore`:
```
server/models/ner_model_occasion/
server/models/ner_model_colour/
*.pth
*.pkl
```

Then use Render's persistent disk feature or upload models post-deployment.

**Option C: Reduce Model Size**

1. Use quantization to reduce model size
2. Use smaller spaCy models (`sm` instead of `md`)
3. Remove unnecessary model components

---

## Error 6: CORS Issues in Production

### ❌ Error Message (in browser console)
```
Access to XMLHttpRequest blocked by CORS policy
```

### 🔍 Root Cause
Frontend deployed domain not in CORS allowed origins.

### ✅ Solution

**Current Code:**
```python
CORS(app)
```

**Production-Ready Code:**
```python
from flask_cors import CORS
import os

# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')

CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
```

**Set in Render Environment Variables:**
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://www.yourdomain.com
```

---

## Error 7: SSL Certificate Verification Failed

### ❌ Error Message
```
SSLError: HTTPSConnectionPool(host='www.flipkart.com', port=443)
```

### 🔍 Root Cause
SSL verification issues when scraping Flipkart.

### ✅ Solution

**Current Code (Line 208):**
```python
response = requests.get(url, verify=False)
```

**Better Solution:**
```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def get_session_with_retries():
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.3,
        status_forcelist=[500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

# Use it
session = get_session_with_retries()
response = session.get(url, timeout=10)
```

---

## Error 8: Memory Limit Exceeded

### ❌ Error Message
```
Error R14 (Memory quota exceeded)
or
Process killed (OOMKilled)
```

### 🔍 Root Cause
Loading multiple large NER models consumes too much memory.

### ✅ Solutions

**Option A: Lazy Loading**
```python
# Don't load at module level
# nlp1 = spacy.load(r"./models/ner_model_occasion/output/model-best")

# Load only when needed
def get_occasion_model():
    global _occasion_model
    if '_occasion_model' not in globals():
        _occasion_model = spacy.load(r"./models/ner_model_occasion/output/model-best")
    return _occasion_model

def check_prompt(prompt):
    nlp1 = get_occasion_model()
    # ... rest of code
```

**Option B: Upgrade Render Plan**
- Free tier: 512MB RAM
- Starter: 1GB RAM
- Standard: 2GB+ RAM

**Option C: Optimize Models**
```python
import spacy

# Disable unused pipeline components
nlp = spacy.load("en_core_web_md", disable=["parser", "ner", "textcat"])
```

---

## Error 9: Build Timeout

### ❌ Error Message
```
Build exceeded maximum time limit
```

### 🔍 Root Cause
Installing large dependencies (spaCy, PyTorch) takes too long.

### ✅ Solution

**Option A: Optimize requirements.txt**
Pin versions to avoid resolution time:
```txt
spacy==3.7.4
numpy==1.26.4
# ... etc
```

**Option B: Use Docker**
Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_md

# Copy application
COPY server/ .

# Run
CMD python main_app.py
```

---

## Error 10: Database Connection (Future Enhancement)

### If you add database support in the future:

```python
import os
from urllib.parse import urlparse

# Parse DATABASE_URL from Render
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    # Render uses postgres://, SQLAlchemy needs postgresql://
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
```

---

## 🔧 Complete Fixed `main_app.py` (Key Changes)

Here are the critical changes to make in `main_app.py`:

```python
# At the top of the file, add:
import os
from pathlib import Path

# Get base directory
BASE_DIR = Path(__file__).resolve().parent

# Update all file paths:
# Line 103
csv_file_path = BASE_DIR / 'data' / 'indian_places.csv'

# Line 130
nlp1 = spacy.load(str(BASE_DIR / 'models' / 'ner_model_occasion' / 'output' / 'model-best'))

# At the end (Line 531-535), replace with:
if __name__ == '__main__':
    # Get port from environment (Render sets this)
    port = int(os.environ.get('PORT', 5000))
    
    # Run on all interfaces for deployment
    # debug=False for production
    app.run(host='0.0.0.0', port=port, debug=False)
```

---

## 📋 Pre-Deployment Checklist

Before deploying to Render, verify:

- [ ] Environment variables set in Render dashboard (`GEMINI_KEY`)
- [ ] All relative paths converted to `os.path.join()` or `Path`
- [ ] Port binding uses `os.environ.get("PORT")`
- [ ] `debug=False` in production
- [ ] `requirements.txt` is complete and pinned versions
- [ ] Large files excluded from Git (`.gitignore`)
- [ ] CORS configured for production domain
- [ ] spaCy models download in build command
- [ ] Test locally with production settings

---

## 🧪 Local Testing with Production Settings

Test your app locally with production-like settings:

```bash
# Set environment variable
export PORT=10000
export GEMINI_KEY=your_key

# Run with production settings
python main_app.py
```

Test it:
```bash
curl -X POST http://localhost:10000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Suggest an outfit for a party"}'
```

---

## 📞 Getting Help

If issues persist:

1. Check Render logs: Dashboard → Logs
2. Enable verbose logging in Flask:
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```
3. Test endpoints individually
4. Check Render status page: status.render.com

---

## 🎯 Quick Fix Summary

**Most Common Fixes Required:**

1. **Update port binding**:
   ```python
   port = int(os.environ.get('PORT', 5000))
   app.run(host='0.0.0.0', port=port, debug=False)
   ```

2. **Fix file paths**:
   ```python
   import os
   BASE_DIR = os.path.dirname(os.path.abspath(__file__))
   csv_file_path = os.path.join(BASE_DIR, 'data', 'indian_places.csv')
   ```

3. **Add environment variable**: `GEMINI_KEY` in Render dashboard

4. **Handle model loading**: Add to build command in Render

These three changes should resolve 80% of deployment issues!

---

*Last Updated: November 2025*
