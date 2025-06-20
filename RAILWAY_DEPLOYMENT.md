# Railway Deployment Guide

This guide will help you deploy your Apartment Eagle to Railway with full functionality and PostgreSQL database.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **Environment Variables** - You'll need your API keys and email settings

## Step 1: Prepare Your Repository

Make sure your repository has these files:

- ✅ `railway.json` - Railway configuration
- ✅ `package.json` - Dependencies and scripts
- ✅ `src/server.ts` - Web server with health check
- ✅ `prisma/schema.prisma` - Database schema
- ✅ `CRITERIA.md` - Your apartment criteria

## Step 2: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign in with your GitHub account
4. Authorize Railway to access your repositories

## Step 3: Deploy Your Project

1. **Select Repository**: Choose your apartment-eagle repository
2. **Railway will automatically detect**:

   - Node.js project
   - Build command: `npm run build`
   - Start command: `node dist/server.js`
   - Health check: `/api/health`

3. **Click "Deploy"** - Railway will start building and deploying

## Step 4: Add PostgreSQL Database

1. **Add Database Service**:

   - In your Railway project, click "New Service"
   - Select "Database" → "PostgreSQL"
   - Railway will create a PostgreSQL database

2. **Connect Database to App**:
   - Railway automatically connects the database to your app
   - The `DATABASE_URL` environment variable will be set automatically

## Step 5: Configure Environment Variables

In your Railway project dashboard:

1. Go to the **Variables** tab
2. Add all your environment variables:

```env
MIN_PRICE=900
MAX_PRICE=1300
DEEPSEEK_API_KEY=your_deepseek_api_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_TO=recipient1@example.com,recipient2@example.com
SCRAPE_INTERVAL_MINUTES=30
LOG_LEVEL=info
# DATABASE_URL is automatically set by Railway
```

3. **Save** - Railway will automatically restart your app

## Step 6: Run Database Migrations

1. **Open Railway Shell**:

   - Go to your app service in Railway
   - Click on the "Deployments" tab
   - Click on the latest deployment
   - Click "View Logs" → "Shell"

2. **Run Prisma Commands**:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Verify Database**:
   ```bash
   npx prisma studio
   ```

## Step 7: Verify Deployment

1. **Check Logs**: Go to the **Deployments** tab to see build logs
2. **Health Check**: Visit your app URL + `/api/health`
3. **Root Endpoint**: Visit your app URL to see the status
4. **Database**: Check that URLs are being saved to the database

## Step 8: Monitor Your App

### Railway Dashboard Features:

- **Real-time logs** - See what your app is doing
- **Metrics** - CPU, memory, and network usage
- **Deployments** - Track all deployments
- **Variables** - Manage environment variables
- **Database** - View PostgreSQL data

### Check Your App is Working:

1. **Logs should show**: "Apartment Eagle is running!"
2. **Health check should return**: `{"status": "healthy"}`
3. **Database should contain**: Scraped URLs from agencies
4. **You should receive emails** when apartments are found

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify TypeScript compilation works locally: `npm run build`

### Database Connection Issues

- Check that PostgreSQL service is running
- Verify `DATABASE_URL` is set correctly
- Run `npx prisma db push` to create tables

### App Won't Start

- Check environment variables are set correctly
- Look at logs for error messages
- Verify `DEEPSEEK_API_KEY` and email settings

### No Emails

- Check `EMAIL_PASS` is an app password (not regular password)
- Verify `EMAIL_TO` addresses are correct
- Check Railway logs for email errors

### Puppeteer Issues

- Railway supports Puppeteer out of the box
- If issues occur, check logs for browser launch errors

## Railway Free Tier Limits

- ✅ **500 hours/month** - Enough for continuous operation
- ✅ **Unlimited deployments**
- ✅ **PostgreSQL database** - 1GB storage
- ✅ **Custom domains** (optional)
- ✅ **SSL certificates** (automatic)

## Database Benefits

With PostgreSQL instead of file storage:

- ✅ **Persistent across deployments**
- ✅ **No data loss on restarts**
- ✅ **Better performance** for large datasets
- ✅ **Automatic backups** (Railway feature)
- ✅ **Easy to query and analyze** data

## Next Steps

1. **Test the deployment** - Wait for the first scrape cycle
2. **Check your email** - You should receive notifications
3. **Monitor logs** - Keep an eye on Railway dashboard
4. **Check database** - Verify URLs are being saved
5. **Customize** - Update `CRITERIA.md` as needed

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Prisma Docs**: [prisma.io/docs](https://prisma.io/docs)
- **GitHub Issues**: For app-specific problems

Your Apartment Eagle is now running continuously on Railway with PostgreSQL! 🎉
