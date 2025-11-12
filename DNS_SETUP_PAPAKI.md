# DNS Setup Guide: Vercel to Papaki

## Step-by-Step Instructions for Connecting Your Domain

### Step 1: Add Domain in Vercel

1. **Go to your Vercel project**
   - Navigate to your project dashboard
   - Click on **"Settings"** tab
   - Click on **"Domains"** in the left sidebar

2. **Add your domain**
   - Click **"Add Domain"** button
   - Enter your domain (e.g., `websitecreator.6x7.gr` or `6x7.gr`)
   - Click **"Add"**

3. **Get DNS Records from Vercel**
   - Vercel will show you the DNS records you need to add
   - You'll see something like:
     - **Type A Record:**
       - Name: `@` (or blank for root domain)
       - Value: `76.76.21.21` (this is the IP address - Vercel will show you the exact one)
     - **Type CNAME Record:**
       - Name: `www` (for www subdomain)
       - Value: `cname.vercel-dns.com` (Vercel will show you the exact CNAME target)

### Step 2: Add DNS Records in Papaki

#### For Root Domain (e.g., `websitecreator.6x7.gr`)

**Option A: If adding a subdomain (recommended)**
- Example: `websitecreator.6x7.gr`
- You only need **CNAME record**

**Option B: If using root domain**
- Example: `6x7.gr`
- You need **A record** for root and **CNAME** for www

#### Steps in Papaki:

1. **Log in to Papaki**
   - Go to [papaki.com](https://papaki.com)
   - Log in with your account

2. **Navigate to DNS Management**
   - Go to your domain management
   - Click on **"Υπηρεσία DNS"** (DNS Service) in the left sidebar
   - Click on the **"ΓΙΑ ΠΡΟΧΩΡΗΜΕΝΟΥΣ"** (For Advanced) tab

3. **Add CNAME Record (for subdomain)**
   - In the **"CNAMES (Aliases)"** section
   - Click **"Εισαγωγή Νέου CNAME record"** (Add New CNAME record)
   - **Host:** Enter `websitecreator` (just the subdomain part, not the full domain)
   - **Δείχνει σε** (Points to): Enter the CNAME target from Vercel (usually `cname.vercel-dns.com`)
   - **TTL:** Leave as default (usually `1 Ώρα` / 1 Hour) or set to `3600`
   - Click **"Αποθήκευση"** (Save)

4. **Add A Record (for root domain only)**
   - In the **"A (Host)"** section
   - Click **"Εισαγωγή Νέου A record"** (Add New A record)
   - **Host:** Leave blank or enter `@` (this represents the root domain)
   - **Δείχνει σε** (Points to): Enter the IP address from Vercel (usually `76.76.21.21` - Vercel will show you the exact IP)
   - **TTL:** Leave as default (usually `1 Ώρα` / 1 Hour) or set to `3600`
   - Click **"Αποθήκευση"** (Save)

5. **Add CNAME for www (if using root domain)**
   - In the **"CNAMES (Aliases)"** section
   - Click **"Εισαγωγή Νέου CNAME record"** (Add New CNAME record)
   - **Host:** Enter `www`
   - **Δείχνει σε** (Points to): Enter the CNAME target from Vercel (usually `cname.vercel-dns.com`)
   - **TTL:** Leave as default (usually `1 Ώρα` / 1 Hour) or set to `3600`
   - Click **"Αποθήκευση"** (Save)

### Step 3: Wait for DNS Propagation

- **DNS changes can take 24-48 hours** to propagate globally
- **Usually works within 1-2 hours** for most regions
- You can check DNS propagation at: https://dnschecker.org
- Enter your domain and check if the DNS records are updated globally

### Step 4: Verify in Vercel

1. **Go back to Vercel**
   - Go to **Settings** → **Domains**
   - Vercel will automatically verify your domain once DNS propagates
   - You should see **"Valid Configuration"** ✅
   - Once verified, your site will be live at your domain
   - SSL certificate is automatically provided by Vercel (HTTPS)

## Example: Adding Subdomain `websitecreator.6x7.gr`

### In Vercel:
1. Add domain: `websitecreator.6x7.gr`
2. Vercel shows:
   - **CNAME:** `websitecreator` → `cname.vercel-dns.com` (or similar)

### In Papaki:
1. Go to DNS management for `6x7.gr`
2. Add CNAME record:
   - **Host:** `websitecreator`
   - **Δείχνει σε:** `cname.vercel-dns.com` (or the value Vercel shows)
   - **TTL:** `3600` (1 hour)

### Result:
- After DNS propagation, your site will be live at `https://websitecreator.6x7.gr`
- Vercel automatically provides SSL (HTTPS)

## Example: Adding Root Domain `6x7.gr`

### In Vercel:
1. Add domain: `6x7.gr`
2. Vercel shows:
   - **A Record:** `@` → `76.76.21.21` (or the IP Vercel shows)
   - **CNAME:** `www` → `cname.vercel-dns.com` (or similar)

### In Papaki:
1. Go to DNS management for `6x7.gr`
2. Add A record:
   - **Host:** `@` (or leave blank)
   - **Δείχνει σε:** `76.76.21.21` (or the IP Vercel shows)
   - **TTL:** `3600`
3. Add CNAME record:
   - **Host:** `www`
   - **Δείχνει σε:** `cname.vercel-dns.com` (or the value Vercel shows)
   - **TTL:** `3600`

### Result:
- After DNS propagation, your site will be live at `https://6x7.gr` and `https://www.6x7.gr`
- Vercel automatically provides SSL (HTTPS)

## Important Notes

### Which Records to Use:

**For Subdomain (e.g., `websitecreator.6x7.gr`):**
- ✅ **CNAME record only**
- ❌ Don't use A record for subdomain

**For Root Domain (e.g., `6x7.gr`):**
- ✅ **A record** for root domain (`@`)
- ✅ **CNAME record** for www subdomain

### What Numbers/IPs from Vercel:

1. **A Record IP Address:**
   - Usually: `76.76.21.21` or similar
   - **Vercel will show you the exact IP** in the Domains section
   - Copy this IP and paste it in Papaki's "Δείχνει σε" field

2. **CNAME Target:**
   - Usually: `cname.vercel-dns.com` or similar
   - **Vercel will show you the exact CNAME target** in the Domains section
   - Copy this and paste it in Papaki's "Δείχνει σε" field

### Troubleshooting:

**DNS Not Working:**
- Wait 24-48 hours for full propagation
- Check DNS propagation at https://dnschecker.org
- Verify records are correct in Papaki
- Make sure TTL is set correctly (3600 seconds)

**Vercel Shows "Invalid Configuration":**
- Double-check DNS records in Papaki
- Make sure you copied the exact values from Vercel
- Wait a few more hours for DNS propagation
- Try removing and re-adding the domain in Vercel

**Site Not Loading:**
- Check if DNS has propagated (use dnschecker.org)
- Verify SSL certificate is issued (Vercel does this automatically)
- Check Vercel deployment status
- Make sure your domain is verified in Vercel

## Quick Reference

### Papaki DNS Fields:
- **Host:** The subdomain (e.g., `websitecreator`) or `@` for root
- **Δείχνει σε (Points to):** The IP (for A) or CNAME target (for CNAME)
- **TTL:** Time to live (usually `3600` seconds = 1 hour)

### Vercel DNS Values:
- **A Record IP:** Shown in Vercel Domains section (usually `76.76.21.21`)
- **CNAME Target:** Shown in Vercel Domains section (usually `cname.vercel-dns.com`)

### Recommended Setup:
1. Use subdomain (e.g., `websitecreator.6x7.gr`) - easier setup
2. Only need CNAME record
3. Faster DNS propagation
4. Easier to manage

---

**Need Help?**
- Check Vercel documentation: https://vercel.com/docs/concepts/projects/domains
- Check Papaki support: https://www.papaki.com/support
- Verify DNS propagation: https://dnschecker.org

