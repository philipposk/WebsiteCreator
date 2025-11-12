# Environment Variables Setup for Vercel

## Quick Setup Guide

### Step 1: Add Environment Variable in Vercel

1. **Go to your Vercel project**
   - Navigate to your project dashboard
   - Click on your project: **WebsiteCreator**

2. **Go to Settings**
   - Click on **"Settings"** tab at the top
   - Click on **"Environment Variables"** in the left sidebar

3. **Add BLOB_READ_WRITE_TOKEN**
   - Click **"Add New"** button
   - **Key:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** `vercel_blob_rw_rZ3BPS9MlU1svIBj_cZrNHsidgPRvQWhoRMVP0OC7AHNSuW`
   - **Environments:** Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

4. **Redeploy (if already deployed)**
   - Go to **"Deployments"** tab
   - Click the **"..."** menu on the latest deployment
   - Click **"Redeploy"**
   - This will apply the new environment variable

### Step 2: Verify It Works

After redeployment:
1. Visit your site
2. Create a website
3. Save it
4. Open in a different browser or incognito mode
5. Your websites should still be there (persisted to cloud storage)

## What This Does

**With BLOB_READ_WRITE_TOKEN:**
- ✅ Website settings persist across browsers
- ✅ Websites saved to cloud storage (Vercel Blob)
- ✅ Works in incognito/private mode
- ✅ Persistent storage across devices

**Without BLOB_READ_WRITE_TOKEN:**
- ⚠️ Websites stored in localStorage only
- ⚠️ Only works in the same browser
- ⚠️ Lost when clearing browser data
- ⚠️ Not available in incognito mode

## Token Security

**Important:** 
- Keep your token secret
- Never commit it to GitHub
- Only add it in Vercel's environment variables
- The token is already in `.gitignore` (won't be committed)

## Troubleshooting

### Token Not Working
- **Check:** Environment variable is set for all environments (Production, Preview, Development)
- **Check:** Redeployed after adding the variable
- **Check:** Token is correct (no extra spaces)
- **Check:** Vercel Blob store exists and is active

### Settings Not Saving
- **Check:** Browser console for errors
- **Check:** Network tab for API errors
- **Check:** `/api/settings` route is working
- **Try:** Clear browser cache and retry

## Next Steps

1. ✅ Add environment variable in Vercel
2. ✅ Redeploy (if needed)
3. ✅ Test website creation and saving
4. ✅ Verify persistence across browsers
5. 🎉 Your Website Creator is fully configured!

---

**Your Token:**
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_rZ3BPS9MlU1svIBj_cZrNHsidgPRvQWhoRMVP0OC7AHNSuW
```

**Add this in Vercel → Settings → Environment Variables**

