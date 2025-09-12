# Database Setup Guide for POS System

This guide will help you set up the database connection properly to ensure the checkout process works without authentication errors.

## 🚀 Quick Setup

### Step 1: Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Connection (Supabase PostgreSQL Direct Connection)
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 2: Get Your Supabase Credentials

1. **Go to [Supabase Dashboard](https://app.supabase.com/)**
2. **Select your project** (or create a new one)
3. **Navigate to Settings → API**
4. **Copy the following values:**
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Key (anon public)** → Use for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Project API Key (service_role)** → Use for `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Get Your Database Connection String

1. **In Supabase Dashboard, go to Settings → Database**
2. **Click on "Connection string" tab**
3. **Select "URI" format**
4. **Copy the connection string** - it will look like:
   ```
   postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```
5. **Replace `[YOUR-PASSWORD]` with your actual database password**
6. **Use this as your `DATABASE_URL`**

## 🔧 Troubleshooting Common Issues

### Error: "password authentication failed for user 'postgres'"

**Solution:**

1. Check that your `DATABASE_URL` has the correct password
2. Make sure you're using the database password, not the project password
3. Verify the connection string format is correct

**To find/reset your database password:**

1. Go to Supabase Dashboard → Settings → Database
2. Scroll down to "Database password"
3. Click "Generate a new password" if needed
4. Update your `DATABASE_URL` with the new password

### Error: "Database service is currently unavailable"

**Solution:**

1. Check that all environment variables are set correctly
2. Verify your Supabase project is active and running
3. Test the connection string separately

### Error: "connection timeout" or "connection refused"

**Solution:**

1. Check your internet connection
2. Verify the project ID in your connection string is correct
3. Make sure your Supabase project hasn't been paused

## 🏗️ Database Schema Setup

Make sure your database has the required tables for the POS system:

1. **Run migrations:**

   ```bash
   npm run db:migrate
   # or
   bun run db:migrate
   ```

2. **Generate and push schema:**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

## 📋 Environment Variables Checklist

Make sure you have all these variables set:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`

## 🧪 Testing Your Setup

You can test your database connection by:

1. **Using the Drizzle Studio:**

   ```bash
   npx drizzle-kit studio
   ```

2. **Testing the checkout API:**

   ```bash
   curl -X POST http://localhost:3000/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

3. **Check the browser console and server logs** for any connection errors

## 🌟 Best Practices

1. **Never commit `.env.local`** to version control
2. **Use different projects** for development, staging, and production
3. **Enable Row Level Security (RLS)** in production
4. **Use service role key only on server-side** operations
5. **Regularly rotate your API keys** for security

## 📞 Getting Help

If you continue to have issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Verify your project is in the correct region
3. Check the Supabase status page for any outages
4. Make sure your IP is not blocked (check Supabase Auth settings)

## 🔄 Production Deployment

For production deployment (Vercel, Netlify, etc.):

1. **Set environment variables** in your deployment platform
2. **Use production Supabase project** credentials
3. **Enable SSL mode** by ensuring your `DATABASE_URL` includes `?sslmode=require`
4. **Configure proper connection pooling** if needed

Example production `DATABASE_URL`:

```
postgres://postgres:password@db.project-id.supabase.co:5432/postgres?sslmode=require
```

---

After following this guide, your POS system should be able to connect to the database successfully and process checkout transactions with proper stock deduction and transaction recording.

