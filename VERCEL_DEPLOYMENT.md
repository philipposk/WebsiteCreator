# Vercel Deployment Steps - Website Creator

## Step-by-Step Guide

### 1. Sign in to Vercel
- Go to [vercel.com](https://vercel.com)
- Sign in with your GitHub account (recommended)
- Or create a new account if you don't have one

### 2. Import Your Project
- Click **"New Project"** or **"Add New..."** → **"Project"**
- You'll see a list of your GitHub repositories
- Find **"WebsiteCreator"** (philipposk/WebsiteCreator)
- Click **"Import"**

### 3. Configure Project Settings

#### Project Name
- **Recommended:** `website-creator` or `websitecreator`
- This will create the URL: `https://website-creator.vercel.app`
- You can change it later in Settings → General

#### Framework Preset
- Vercel should auto-detect **Next.js**
- If not, select **Next.js** from the framework dropdown

#### Root Directory
- Leave as default (usually blank or `./`)
- The project root is correct

#### Build and Output Settings
- **Build Command:** `pnpm build` (auto-filled)
- **Output Directory:** `.next` (auto-filled)
- **Install Command:** `pnpm install` (auto-filled)
- These should be correct based on `vercel.json`

### 4. Environment Variables (IMPORTANT!)

Click **"Environment Variables"** section and add:

#### Required for Website Creator:
1. **`BLOB_READ_WRITE_TOKEN`** (Optional but Recommended)
   - **Why:** For saving website settings across sessions
   - **How to get:**
     - After deployment, go to **Storage** tab in Vercel
     - Create a **Blob Store** (e.g., "website-creator-storage")
     - Vercel will automatically create the token
     - Go to **Settings** → **Environment Variables**
     - The token should appear automatically, or copy it from Storage settings
   - **Note:** Without this, the app will use localStorage (works but not persistent across browsers)

#### Optional (for future features):
2. **`GROQ_API_KEY`** (Optional)
   - Only needed if you want to add AI features later
   - Get from: https://console.groq.com
   - Not required for basic website builder functionality

#### Set for All Environments:
- Make sure to check all three:
  - ✅ **Production**
  - ✅ **Preview**
  - ✅ **Development**

### 5. Deploy
- Click **"Deploy"** button
- Vercel will:
  1. Install dependencies (`pnpm install`)
  2. Build the project (`pnpm build`)
  3. Deploy to production
- This usually takes 1-3 minutes

### 6. Wait for Deployment
- Watch the deployment logs
- You'll see:
  - ✅ Installing dependencies
  - ✅ Building project
  - ✅ Deploying
  - ✅ Ready (green checkmark)

### 7. Access Your Site
- Once deployment is complete, you'll see:
  - **Production URL:** `https://website-creator.vercel.app` (or your project name)
  - Click **"Visit"** button to open your live site
- Your Website Creator is now live! 🎉

### 8. (Optional) Add Custom Domain
- Go to **Settings** → **Domains**
- Click **"Add Domain"**
- Enter your domain (e.g., `websitecreator.6x7.gr`)
- Follow DNS configuration instructions
- Wait for DNS propagation (can take 24-48 hours)

## Post-Deployment Checklist

### ✅ Verify Everything Works:
1. **Visit your site URL**
   - Should load the Website Creator interface
   - Check sidebar and main content area

2. **Test Website Creation:**
   - Fill in the form (name, description, etc.)
   - Select template (Simple or Advanced)
   - Choose design settings (color, font)
   - Toggle sections on/off
   - Click "Generate Website"
   - Preview should show the generated HTML

3. **Test Website Management:**
   - Create a new website
   - Save and reload (should persist)
   - Export HTML (download should work)
   - Delete website

4. **Test Settings Persistence:**
   - If `BLOB_READ_WRITE_TOKEN` is set:
     - Settings should persist across browsers
     - Websites should be saved to cloud storage
   - If not set:
     - Settings will use localStorage
     - Works but only in the same browser

## Troubleshooting

### Build Fails
- **Check build logs** in Vercel dashboard
- **Common issues:**
  - Missing dependencies (check `package.json`)
  - TypeScript errors (check for type errors)
  - Build command issues (verify `vercel.json`)

### Site Shows 404
- **Check:** Build completed successfully
- **Check:** `src/app/page.tsx` exists
- **Try:** Redeploy the project

### Settings Not Saving
- **Check:** `BLOB_READ_WRITE_TOKEN` is set correctly
- **Check:** Environment variable is set for all environments
- **Note:** Without token, uses localStorage (browser-specific)

### Website Not Generating
- **Check:** Browser console for errors
- **Check:** Network tab for API errors
- **Check:** `/api/website/generate` route is working

## Quick Reference

### URLs:
- **Production:** `https://website-creator.vercel.app`
- **Dashboard:** `https://vercel.com/dashboard`
- **Project Settings:** `https://vercel.com/[username]/website-creator/settings`

### Important Files:
- `vercel.json` - Vercel configuration
- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration
- `src/app/api/website/generate/route.ts` - Website generation API

### Environment Variables:
- `BLOB_READ_WRITE_TOKEN` - For cloud storage (optional)
- `GROQ_API_KEY` - For AI features (optional, not required)

## Next Steps After Deployment

1. **Test the application thoroughly**
2. **Share the URL with users**
3. **Monitor usage in Vercel Analytics**
4. **Add custom domain (optional)**
5. **Set up monitoring and alerts**
6. **Consider adding more features:**
   - User authentication
   - Database for websites
   - More templates
   - Image uploads
   - Website hosting

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **GitHub Repository:** https://github.com/philipposk/WebsiteCreator

---

**Your Website Creator is ready to deploy! Follow the steps above and you'll be live in minutes.** 🚀

