# Deployment Guide

This guide will help you deploy Praiser to a public URL and set up file storage.

## Deployment Platforms

### ❌ Platforms That Won't Work

**Wix, Squarespace, WordPress.com, etc.** - These are website builders, not hosting platforms for custom applications. They don't support:
- Next.js applications
- Custom API routes
- Server-side code
- Custom React components
- Environment variables
- File uploads to cloud storage

### ✅ Platforms That Work

**Vercel (Recommended)** - Built by the Next.js team, easiest deployment
**Netlify** - Similar to Vercel, good Next.js support
**Railway** - Simple deployment with database options
**Render** - Good for full-stack apps
**AWS Amplify** - Enterprise-grade hosting
**DigitalOcean App Platform** - Simple PaaS

## Quick Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your repository
   - **Important:** Add environment variables (see "Environment Variables" section below)
   - Click "Deploy"

3. **Find Your Site URL**
   - After clicking "Deploy", Vercel will start building your app
   - Once deployment completes (usually 1-3 minutes), you'll see:
     - **On the deployment page:** A "Visit" button that takes you to your live site
     - **On the project Overview page:** Your production URL at the top (e.g., `https://praiser.vercel.app`)
     - **In the Deployments tab:** Click any successful deployment to see the URL
   - The URL format is: `https://[project-name].vercel.app`
   - **Recommended project name:** `praiser` (will give you `https://praiser.vercel.app`)
   - **To change the URL:** Go to **Settings** → **General** → Change "Project Name" to your desired name
   - **If URL doesn't update after renaming:**
     - Wait 1-2 minutes for DNS propagation
     - Check if the name is already taken (Vercel will add a suffix like `-1` if taken)
     - Try triggering a new deployment (push a commit or click "Redeploy")
     - The old URL will still work and redirect to the new one
   - **Custom Domain (Best Option):** Add your own domain (e.g., `praiser.com`, `praiser.app`, `6x7.gr`)
     
     **Step-by-Step Instructions:**
     
     1. **Buy a domain** (if you don't have one):
        - Popular registrars: Namecheap, Google Domains, Cloudflare, GoDaddy
        - Cost: Usually $10-15/year for `.com` domains
        - Cheaper options: `.app`, `.io`, `.dev` domains
        - **You already have:** `6x7.gr` ✅
     
     2. **Add domain in Vercel:**
        - Go to your project → **Settings** tab → **Domains** section
        - Click **"Add"** or **"Add Domain"** button
        - Enter your domain:
          - **For `6x7.gr`:** Enter `6x7.gr` (this will also automatically add `www.6x7.gr`)
          - **For subdomain `6x7.praiser.gr`:** Enter `6x7.praiser.gr` (you must own `praiser.gr`)
          - **For subdomain `praiser.6x7.gr`:** Enter `praiser.6x7.gr` (using your existing `6x7.gr`)
        - Click **"Add"**
     
     3. **Configure DNS at your domain registrar:**
        - Vercel will show you DNS records to add (usually something like):
          - **Type:** `A` or `CNAME`
          - **Name:** `@` or `www` (or leave blank for root domain)
          - **Value:** Vercel will provide an IP address or CNAME target
        - **For `6x7.gr` (root domain) on Papaki:**
          - Go to [papaki.com](https://papaki.com) and log in
          - Navigate to your domain management for `6x7.gr`
          - Click on **"Υπηρεσία DNS"** (DNS Service) in the left sidebar
          - Click on the **"ΓΙΑ ΠΡΟΧΩΡΗΜΕΝΟΥΣ"** (For Advanced) tab
          - **Add A record for root domain (`6x7.gr`):**
            - In the **"A (Host)"** section, click **"Εισαγωγή Νέου A record"** (Add New A record)
            - **Host:** Leave blank or enter `@` (this represents the root domain)
            - **Δείχνει σε** (Points to): Enter the IP address Vercel provides (usually something like `76.76.21.21` or similar - Vercel will show you the exact IP)
            - **TTL:** Leave as default (usually `1 Ώρα` / 1 Hour) or set to `3600`
            - Click **"Αποθήκευση"** (Save) or the save button
          - **Add CNAME record for www (`www.6x7.gr`):**
            - In the **"CNAMES (Aliases)"** section, click **"Εισαγωγή Νέου CNAME record"** (Add New CNAME record)
            - **Host:** Enter `www`
            - **Δείχνει σε** (Points to): Enter the CNAME target Vercel provides (usually `cname.vercel-dns.com` or similar - Vercel will show you the exact value)
            - **TTL:** Leave as default (usually `1 Ώρα` / 1 Hour) or set to `3600`
            - Click **"Αποθήκευση"** (Save) or the save button
          - **Important:** After adding the records, wait 4-48 hours for DNS to fully propagate (Papaki will show you a message about this)
        - **For subdomain `6x7.praiser.gr` (if you own `praiser.gr`):**
          - Go to your `praiser.gr` domain's DNS management panel
          - Add a new DNS record:
            - **Type:** `CNAME`
            - **Name/Host:** `6x7` (or `6x7.praiser.gr` depending on your registrar)
            - **Value/Target:** Vercel will provide a CNAME target (usually `cname.vercel-dns.com` or similar)
            - **TTL:** 3600 (or leave default)
          - Save the DNS changes
        - **For subdomain `praiser.6x7.gr` (using your existing `6x7.gr`) on Papaki:**
          - Go to [papaki.com](https://papaki.com) and log in
          - Navigate to your domain management for `6x7.gr`
          - Click on **"Υπηρεσία DNS"** (DNS Service) in the left sidebar
          - Click on the **"ΓΙΑ ΠΡΟΧΩΡΗΜΕΝΟΥΣ"** (For Advanced) tab
          - **Add CNAME record for subdomain (`praiser.6x7.gr`):**
            - In the **"CNAMES (Aliases)"** section, click **"Εισαγωγή Νέου CNAME record"** (Add New CNAME record)
            - **Host:** Enter `praiser` (just the subdomain part, not the full domain)
            - **Δείχνει σε** (Points to): Enter the CNAME target Vercel provides (usually `cname.vercel-dns.com` or similar - Vercel will show you the exact value)
            - **TTL:** Leave as default (usually `1 Ώρα` / 1 Hour) or set to `3600`
            - Click **"Αποθήκευση"** (Save) or the save button
          - **Important:** After adding the record, wait 4-48 hours for DNS to fully propagate (Papaki will show you a message about this)
          - **Note:** Subdomains only need a CNAME record, not an A record
     
     4. **Wait for DNS propagation:**
        - DNS changes can take 24-48 hours, but usually work within 1-2 hours
        - You can check DNS propagation at: https://dnschecker.org
        - Enter your domain/subdomain and check if the DNS records are updated globally
     
     5. **Verify in Vercel:**
        - Vercel will automatically verify your domain once DNS propagates
        - Check the **Domains** section in Vercel - it should show "Valid Configuration" ✅
        - Once verified, your site will be live at your chosen domain
        - SSL certificate is automatically provided by Vercel (HTTPS)
     
     **Note:** You can add multiple domains (e.g., both `6x7.gr` and `www.6x7.gr`). Vercel will handle redirects automatically.
   - **Note:** Git repository URLs (like `github.com/...`) are for code, not web hosting. You need a web URL like `praiser.vercel.app` or a custom domain.

4. **Check if Your Site is Ready**
   
   **Deployment Status:**
   - ✅ **Ready:** If you see "Ready" or a green checkmark, your site is live!
   - ⏳ **Building:** If it says "Building" or shows a progress indicator, wait a few minutes
   - ❌ **Error:** If deployment failed, check the build logs for errors
   
   **Verify Everything Works:**
   - Visit your site URL (from step 3 above)
   - Check that the page loads correctly
   - Test chat functionality (requires `GROQ_API_KEY` to be set correctly)
   - Test file uploads (requires `BLOB_READ_WRITE_TOKEN` to be set correctly)
   
   **Common Issues:**
   - **404 Error:** If you see "404 NOT_FOUND" in the preview:
     - Check the **Build Logs** to see if the build succeeded
     - Make sure your `src/app/page.tsx` file exists
     - Try clicking the **"Visit"** button to open the actual site (preview can sometimes show errors)
     - Check if environment variables are set correctly
   - If chat doesn't work: Check that `GROQ_API_KEY` is set (not `groq`)
   - If uploads fail: Check that `BLOB_READ_WRITE_TOKEN` is set
   - If build fails: Check the deployment logs for errors

5. **Important Notes for Vercel**
   - **File Storage**: Vercel's filesystem is read-only in production. Uploaded files will be lost on each deployment.
   - **Solution**: For persistent storage, you need to use:
     - **Vercel Blob Storage** (recommended for Vercel)
     - **AWS S3** or **Cloudinary**
     - **Database** (PostgreSQL with file references)

## File Storage Setup

**Good news:** The app is already configured to use Vercel Blob Storage! ✅

- `@vercel/blob` is already installed
- `/api/upload/route.ts` already uses Vercel Blob Storage
- You just need to set the `BLOB_READ_WRITE_TOKEN` environment variable (see below)

### Alternative Storage Options

If you prefer not to use Vercel Blob Storage, you can modify `/api/upload/route.ts` to use:

- **AWS S3**: Install `@aws-sdk/client-s3` and update the upload route
- **Cloudinary**: Install `cloudinary` and update the upload route
- **Database**: Store file references in PostgreSQL or another database

However, Vercel Blob Storage is recommended and already configured.

## Environment Variables

**You MUST add these environment variables in Vercel before deploying:**

### Required Variables:

1. **`GROQ_API_KEY`** (Required for AI functionality)
   - Get it from: https://console.groq.com
   - In Vercel: Add as key `GROQ_API_KEY` with your API key as the value
   - **⚠️ Important:** The variable name must be exactly `GROQ_API_KEY` (not `groq` or `GROQ_KEY`). The code looks for this specific name.

2. **`BLOB_READ_WRITE_TOKEN`** (Required for file uploads)
   - **How to get it:**
     - After creating a Blob store (e.g., "praiser-blob"), Vercel automatically creates this token
     - Go to your Vercel project → **Settings** → **Environment Variables**
     - Look for `BLOB_READ_WRITE_TOKEN` - it should already be there automatically
     - If you don't see it, go to **Settings** → **Storage** → Click on your blob store → Look for "Environment Variables" or "Token" section
     - Copy the token value and add it manually if needed
   - The token is automatically generated when you create a Blob store in Vercel

### Steps in Vercel Deployment Page:

1. **In the "Environment Variables" section:**
   - Click "+ Add More" button
   - Add `GROQ_API_KEY` with your Groq API key value
   - Add `BLOB_READ_WRITE_TOKEN` with your Vercel Blob token value
   - Make sure both are set for "Production", "Preview", and "Development" environments

2. **After first deployment:**
   - If you don't have a Blob store yet, create one in Vercel dashboard
   - The `BLOB_READ_WRITE_TOKEN` will be available in your project settings
   - Add it to your environment variables

**Note:** Without `BLOB_READ_WRITE_TOKEN`, file uploads will fail. The app will work for chat, but images/videos won't be saved.

## Current Storage Implementation

The app now uses **Vercel Blob Storage** for file uploads:
- Images and videos are stored in Vercel Blob Storage
- Files are publicly accessible via CDN URLs
- Person info is still saved to `data/person-info.json` (can be migrated to a database later)

**This works for:**
- ✅ Vercel deployments
- ✅ Any platform that supports Vercel Blob
- ✅ Local development (with BLOB_READ_WRITE_TOKEN set)

**Setup:**
1. Get your `BLOB_READ_WRITE_TOKEN` from Vercel dashboard
2. Add it as an environment variable
3. Deploy - files will be stored in cloud storage automatically

