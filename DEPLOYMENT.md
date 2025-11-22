# StockMaster - Deployment Guide

## Vercel Deployment Setup

### 1. Prerequisites
- A Vercel account
- A MySQL database (e.g., PlanetScale, Railway, or any MySQL provider)
- GitHub repository connected to Vercel

### 2. Environment Variables

Add these environment variables in your Vercel project settings:

**Go to: Vercel Dashboard → Your Project → Settings → Environment Variables**

Add the following:

```env
DATABASE_URL="mysql://root:WatvEDcXOVgKWqqvonMaNXSlwahlVrAu@ballast.proxy.rlwy.net:34937/railway"
JWT_SECRET="stockmaster-jwt-secret-key-change-in-production-2024"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

**Important Notes:**
- `DATABASE_URL`: Railway MySQL database URL (already configured above)
- `JWT_SECRET`: Strong random string for JWT token signing
- `NEXT_PUBLIC_APP_URL`: Your actual Vercel deployment URL (e.g., https://odoo-stockmaster-2024cssparsh.vercel.app)
- Make sure to set these for **Production**, **Preview**, and **Development** environments

### 3. Database Setup

After deploying, you need to initialize your database:

#### Option A: Using Prisma Studio (Recommended)
1. Install Prisma CLI locally: `npm install -g prisma`
2. Set your `DATABASE_URL` in local `.env` file
3. Run migrations: `npx prisma db push`
4. Create initial user via Prisma Studio: `npx prisma studio`

#### Option B: Using SQL
Connect to your database and run:
```sql
CREATE DATABASE IF NOT EXISTS stockmaster;
```
Then run Prisma migrations from your local machine pointing to production DB.

### 4. Create First User

You need at least one user to login. Either:

**Via Prisma Studio:**
1. Run `npx prisma studio` (with DATABASE_URL pointing to production)
2. Go to User model
3. Create a user with hashed password

**Via API (After deployment):**
```bash
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "yourpassword"
  }'
```

### 5. Deploy

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

Vercel will automatically deploy when you push to your repository.

### 6. Verify Deployment

1. Visit your Vercel URL
2. You should see the login page
3. Try logging in with your created user credentials

## Common Issues

### "An error occurred. Please try again" during login
- Check that DATABASE_URL is correctly set in Vercel
- Verify the database is accessible from Vercel's servers
- Check that you've run `prisma db push` to create tables
- Ensure you have at least one user in the database

### Build fails with Prisma errors
- Ensure `prisma` is in dependencies (not devDependencies)
- Check that `postinstall` script runs `prisma generate`

### Edge Runtime warnings
- These are warnings, not errors. The app will still work.
- They appear because jsonwebtoken uses Node.js APIs

## Database Providers

### Recommended MySQL Providers:
1. **PlanetScale** (Free tier available)
   - No need to run migrations manually
   - Automatic scaling
   - Get connection string from dashboard

2. **Railway** (Free tier available)
   - Easy MySQL setup
   - Good for development

3. **AWS RDS** (Production)
   - More control
   - Better for production at scale

## Support

For issues, check:
- Vercel deployment logs
- Browser console for client-side errors
- Database connection from Vercel (check environment variables)
