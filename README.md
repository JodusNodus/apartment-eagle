# Apartment Watcher

A Node.js application that scrapes rental agencies in Antwerp and monitors for new apartments using AI for evaluation.

## Features

- Scrapes multiple rental agency websites
- Uses AI (DeepSeek) to evaluate apartments against your criteria
- Sends email notifications when matching apartments are found
- Runs on a configurable schedule
- Logs all activities for monitoring

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# DeepSeek API Key for AI evaluation
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Email configuration for notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_TO=recipient@example.com

# Optional: Scraping configuration
SCRAPE_INTERVAL_MINUTES=30
MAX_RETRIES=3
REQUEST_DELAY_MS=2000

# Optional: Server configuration
PORT=3000

# Optional: Logging
LOG_LEVEL=info
```

### 3. Email Setup

For Gmail, you'll need to:

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

## Current Criteria

The application is currently configured to find apartments that meet these criteria:

**Mandatory requirements:**

- Must be in Antwerp
- Must have at least 2 bedrooms (or 1 bedroom and a bureau)
- Must cost less than 1300 EUR/month
- If a move-in date is provided, it must be after July 30th

**Optional preferences:**

- Terrace would be ideal

## Monitoring

The application logs all activities to:

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## Troubleshooting

If you're not receiving email notifications:

1. Check that all environment variables are set correctly
2. Verify your email credentials (especially app passwords for Gmail)
3. Check the logs for any error messages
4. Ensure the DeepSeek API key is valid and has sufficient credits
