# Apartment Eagle

A Node.js application that checks rental agency websites in Antwerp and notifies you when new apartments match your criteria.

## How It Works

The apartment eagle follows these simple steps:

1. **Check All Agencies** - Looks at all rental agency websites
2. **Find New Listings** - Identifies new apartment listings across all agencies
3. **Get Details** - Scrapes the full details of each listing
4. **Check Criteria** - Uses AI to see if each listing matches your requirements
5. **Send Alerts** - Emails you when matching apartments are found

## Setup

### 1. Update Your Search Criteria

Edit the `CRITERIA.md` file to define what you're looking for in an apartment.

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
MIN_PRICE=900
MAX_PRICE=1300

# DeepSeek API Key for AI evaluation
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Email configuration for notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_TO=recipient1@example.com,recipient2@example.com,recipient3@example.com

SCRAPE_INTERVAL_MINUTES=30

# Optional: Logging
LOG_LEVEL=info
```

### 4. Email Setup

For Gmail:

1. Enable 2-factor authentication
2. Generate an "App Password"
3. Use the app password as `EMAIL_PASS`

### 5. DeepSeek API

Get your API key from [DeepSeek](https://platform.deepseek.com/)

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Deployment Options (Free Hosting)

### Option 1: Railway ⭐ (Recommended)

**Best free option for your full functionality:**

1. **Sign up**: [railway.app](https://railway.app)
2. **Connect GitHub**: Link your repository
3. **Deploy**: Railway automatically detects and deploys
4. **Set Environment Variables**: Add all your `.env` variables in Railway dashboard
5. **Done**: Your app runs continuously with full functionality

**Railway Free Tier:**

- ✅ 500 hours/month (enough for continuous operation)
- ✅ Supports Puppeteer (browser automation)
- ✅ Persistent storage
- ✅ Long-running processes
- ✅ All 20+ agencies supported
- ✅ Full AI evaluation

### Option 2: Render

**Good alternative with sleep/wake functionality:**

1. **Sign up**: [render.com](https://render.com)
2. **Create Web Service**: Connect your GitHub repo
3. **Configure**: Set build command `npm run build` and start command `npm start`
4. **Set Environment Variables**: Add all your `.env` variables
5. **Deploy**: Render handles the rest

**Render Free Tier:**

- ✅ Always free
- ✅ Supports Puppeteer
- ✅ Persistent storage
- ⚠️ Sleeps after 15 minutes inactivity (wakes up automatically)
- ⚠️ 30-second wake-up delay

### Option 3: Oracle Cloud (Always Free)

**Most powerful free option:**

1. **Sign up**: [oracle.com/cloud/free](https://oracle.com/cloud/free)
2. **Create VM**: Ubuntu 20.04 or 22.04
3. **SSH in and install**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo apt-get install -y chromium-browser
   ```
4. **Clone and deploy**:
   ```bash
   git clone your-repo
   cd your-repo
   npm install
   npm run build
   npm start
   ```

**Oracle Cloud Free Tier:**

- ✅ 2 VMs, 24GB RAM total
- ✅ Always free (no time limits)
- ✅ Full control
- ⚠️ Requires more setup

### Option 4: DigitalOcean App Platform

**Easy managed platform:**

1. **Sign up**: [digitalocean.com](https://digitalocean.com)
2. **Create App**: Connect your GitHub repo
3. **Configure**: Set build and run commands
4. **Deploy**: DigitalOcean handles everything

**DigitalOcean:**

- ✅ $5/month credit (effectively free for small apps)
- ✅ Managed platform
- ✅ Supports everything you need
- ⚠️ Requires credit card

### Option 5: Google Cloud Run

**Serverless with generous free tier:**

1. **Sign up**: [cloud.google.com](https://cloud.google.com)
2. **Create Dockerfile** (see below)
3. **Deploy**: `gcloud run deploy`

**Google Cloud Run Free Tier:**

- ✅ 2 million requests/month
- ✅ Containerized deployment
- ⚠️ Not ideal for long-running processes

## Why Not Vercel Free Tier?

Your app requires:

- ❌ **Puppeteer** (browser automation) - 8 agencies need JavaScript rendering
- ❌ **Long-running processes** (30-45 minute intervals)
- ❌ **Persistent storage** (saves URL history)
- ❌ **10-second execution limit** (not enough for 20+ agencies)
- ❌ **No cron jobs** (Pro plan only)

## Monitoring

The application keeps logs in:

- `logs/combined.log` - All activity logs
- `logs/error.log` - Only error messages

## Quick Start with Railway

1. **Fork/Clone** this repository
2. **Sign up** at [railway.app](https://railway.app)
3. **Connect** your GitHub repository
4. **Add environment variables** in Railway dashboard
5. **Deploy** - Railway handles everything else!

Your apartment watcher will run continuously, checking all agencies every 30-45 minutes and sending you email notifications when matching apartments are found.
