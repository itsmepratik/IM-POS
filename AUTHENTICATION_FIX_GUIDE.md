# 🔐 Database Authentication Fix Guide

This guide will help you resolve the "Database authentication failed" error step by step.

## 🚨 Quick Diagnosis

First, let's identify the exact issue:

```bash
curl http://localhost:3000/api/diagnose-db
```

This will run comprehensive diagnostics and tell you exactly what's wrong.

## 🔧 Step-by-Step Fix

### Step 1: Get Your Correct Database Password

1. **Go to [Supabase Dashboard](https://app.supabase.com)**
2. **Select your project**
3. **Navigate to Settings → Database**
4. **Scroll down to "Database password"**
5. **Click "Generate a new password"** (if you don't know the current one)
6. **Copy the password** (it will look like: `your-password-here`)

### Step 2: Update Your Environment Variables

Create or update your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Connection - REPLACE [YOUR-PASSWORD] with the actual password
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 3: Get Your Project ID

1. **In Supabase Dashboard → Settings → General**
2. **Copy the "Reference ID"** (this is your project ID)
3. **Replace `[PROJECT-ID]` in your DATABASE_URL** with this ID

### Step 4: Test the Connection

```bash
# Test the connection
curl http://localhost:3000/api/diagnose-db

# If that works, test the checkout flow
curl http://localhost:3000/api/checkout/test
```

## 🔍 Common Issues & Solutions

### Issue: "password authentication failed for user 'postgres'"

**Cause:** Wrong database password in DATABASE_URL

**Solution:**

1. Go to Supabase Dashboard → Settings → Database
2. Generate a new password
3. Update your DATABASE_URL with the new password
4. Restart your development server

### Issue: "no pg_hba.conf entry for host"

**Cause:** IP address not allowed or SSL configuration issue

**Solution:**

1. Check if your IP is blocked in Supabase Auth settings
2. Try adding `?sslmode=require` to your DATABASE_URL
3. Ensure you're using the correct connection string format

### Issue: "connection refused"

**Cause:** Wrong hostname or project is paused

**Solution:**

1. Verify your project ID in the hostname
2. Check if your Supabase project is active (not paused)
3. Ensure you're using the correct Supabase URL

### Issue: "timeout" or "connection timeout"

**Cause:** Network issues or project overload

**Solution:**

1. Check your internet connection
2. Try again in a few minutes
3. Check Supabase status page for outages

## 🧪 Testing Your Fix

### 1. Test Database Connection

```bash
curl http://localhost:3000/api/diagnose-db
```

**Expected Success Response:**

```json
{
  "success": true,
  "message": "Database configuration is working correctly!",
  "diagnostics": [
    {
      "step": "Environment Variables",
      "status": "success",
      "message": "All required environment variables are present"
    },
    {
      "step": "Connection Test (SSL require)",
      "status": "success",
      "message": "Database connection successful with SSL require"
    }
  ]
}
```

### 2. Test Checkout Flow

```bash
curl http://localhost:3000/api/checkout/test
```

**Expected Success Response:**

```json
{
  "success": true,
  "message": "✅ Checkout flow is working correctly!",
  "testResults": {
    "summary": {
      "stockDeducted": true,
      "transactionRecorded": true,
      "errors": []
    }
  }
}
```

## 🚀 Production Setup

For production deployment, ensure your environment variables are set in your hosting platform:

### Vercel

1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add all the required variables
4. Redeploy your application

### Other Platforms

- Set the environment variables in your platform's configuration
- Ensure `DATABASE_URL` includes `?sslmode=require` for production

## 📋 Verification Checklist

- [ ] Environment variables are set correctly
- [ ] Database password is correct and current
- [ ] Project ID is correct in DATABASE_URL
- [ ] Supabase project is active (not paused)
- [ ] `/api/diagnose-db` returns success
- [ ] `/api/checkout/test` returns success
- [ ] No authentication errors in logs

## 🆘 Still Having Issues?

If you're still getting authentication errors:

1. **Run the diagnostic tool:**

   ```bash
   curl http://localhost:3000/api/diagnose-db
   ```

2. **Check the specific error message** in the response

3. **Follow the recommended solution** provided by the diagnostic tool

4. **Common mistakes to double-check:**
   - Using project password instead of database password
   - Wrong project ID in the hostname
   - Missing or extra characters in the connection string
   - Using old/expired passwords

## 🔄 Reset Everything

If you want to start fresh:

1. **Generate new database password** in Supabase Dashboard
2. **Get fresh API keys** from Supabase Dashboard
3. **Update all environment variables** with new values
4. **Restart your development server**
5. **Test with the diagnostic tool**

---

**Note:** The most common cause of this error is using the wrong database password. Make sure you're using the database password from Supabase Dashboard → Settings → Database, not the project password or API keys.

