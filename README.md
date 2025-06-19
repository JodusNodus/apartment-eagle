# Apartment Watcher

A Node.js application that checks rental agency websites in Antwerp and notifies you when new apartments match your criteria.

## How It Works

The apartment watcher follows these simple steps:

1. **Check All Agencies** - Looks at all rental agency websites
2. **Find New Listings** - Identifies new apartment listings across all agencies
3. **Get Details** - Scrapes the full details of each listing
4. **Check Criteria** - Uses AI to see if each listing matches your requirements
5. **Send Alerts** - Emails you when matching apartments are found

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# DeepSeek API Key for AI evaluation
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Email configuration for notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_TO=recipient@example.com

# Optional: How often to check (in minutes)
SCRAPE_INTERVAL_MINUTES=30
MAX_SCRAPE_INTERVAL_MINUTES=45
MAX_RETRIES=3
REQUEST_DELAY_MS=2000

# Optional: Server configuration
PORT=3000

# Optional: Logging
LOG_LEVEL=info
```

### 3. Email Setup

For Gmail:

1. Enable 2-factor authentication
2. Generate an "App Password"
3. Use the app password as `EMAIL_PASS`

### 4. DeepSeek API

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

## Monitoring

The application keeps logs in:

- `logs/combined.log` - All activity logs
- `logs/error.log` - Only error messages

## What It Looks For

See [CRITERIA.md](./CRITERIA.md) for the complete list of apartment requirements.

**To modify search criteria:** Edit the `CRITERIA.md` file and restart the application. The AI will automatically use your updated criteria for evaluating apartments.
