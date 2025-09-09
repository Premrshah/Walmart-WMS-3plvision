# Vercel Deployment Troubleshooting Guide

## Issue: Dropbox OAuth Redirect Not Working on Vercel

### Step 1: Check Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Verify these variables are set:

```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
DROPBOX_APP_KEY=your_dropbox_app_key
DROPBOX_APP_SECRET=your_dropbox_app_secret
DROPBOX_REDIRECT_URI=https://your-app-name.vercel.app/api/dropbox/callback
DROPBOX_KYC_PARENT_FOLDER=/3PLVision/KYC-Uploads
```

**Important:** 
- Replace `your-app-name` with your actual Vercel app name
- Use `https://` not `http://` for production
- Make sure there are no trailing slashes

### Step 2: Update Dropbox App Settings

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Select your app
3. Go to "OAuth 2" tab
4. Update "Redirect URIs" to include:
   ```
   https://your-app-name.vercel.app/api/dropbox/callback
   ```
5. Save the changes

### Step 3: Check Debug Logs

After deploying with the debug logging, check your Vercel function logs:

1. Go to Vercel dashboard → Functions tab
2. Look for logs from `/api/dropbox/auth` and `/api/dropbox/callback`
3. Look for these debug messages:
   - `🔍 Dropbox Auth URL Debug:`
   - `🔍 Dropbox Callback Debug:`
   - `🔍 Redirecting to:`

### Step 4: Common Issues & Solutions

#### Issue 1: Environment Variables Not Set
**Symptoms:** `appKey: 'MISSING'` in logs
**Solution:** Add all required environment variables in Vercel dashboard

#### Issue 2: Wrong Redirect URI
**Symptoms:** `invalid_redirect_uri` error from Dropbox
**Solution:** Update Dropbox app settings with correct Vercel URL

#### Issue 3: HTTP vs HTTPS
**Symptoms:** Mixed content errors or redirect failures
**Solution:** Ensure all URLs use `https://` in production

#### Issue 4: URL Construction Issues
**Symptoms:** Malformed redirect URLs in logs
**Solution:** Check that `NEXT_PUBLIC_APP_URL` is set correctly

### Step 5: Test the Flow

1. Deploy the updated code with debug logging
2. Try the OAuth flow on Vercel
3. Check the logs to see where it's failing
4. Fix the specific issue identified in the logs

### Step 6: Remove Debug Logging

Once the issue is fixed, remove the debug console.log statements from:
- `lib/dropbox.ts` (lines 32-37)
- `app/api/dropbox/callback/route.ts` (lines 12-18, 85-86, 92-93)

### Quick Fix Checklist

- [ ] Environment variables set in Vercel
- [ ] Dropbox app redirect URI updated
- [ ] All URLs use HTTPS
- [ ] No trailing slashes in URLs
- [ ] Debug logs show correct values
- [ ] Test the complete flow

### Expected Debug Output

When working correctly, you should see:
```
🔍 Dropbox Auth URL Debug: {
  appKey: 'SET',
  baseUrl: 'https://your-app.vercel.app',
  redirectUri: 'https://your-app.vercel.app/api/dropbox/callback',
  environment: 'production'
}
```

And in the callback:
```
🔍 Dropbox Callback Debug: {
  url: 'https://your-app.vercel.app/api/dropbox/callback?code=...',
  code: 'PRESENT',
  state: 'PRESENT',
  error: 'NONE',
  environment: 'production'
}
```
