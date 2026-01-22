# Deployment Guide

## Quick Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps. Free tier is perfect for demos and small cities.

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
cd repos/hometownmap/apps/web
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your personal account
- **Link to existing project?** No
- **Project name?** hometownmap-threeforks
- **Directory?** `./` (current directory)
- **Override settings?** No

### 3. Add Environment Variables

After first deploy, add your Mapbox token:

```bash
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
```

Paste your token: `pk.eyJ1IjoiaXRvZ2VvIiwiYSI6ImNta3ByZTZpNjBsbzMzZm9vb3BxeGFoNmoifQ.pHK8DdvZh5QHAkP4iRd1yw`

Select: Production, Preview, Development

### 4. Redeploy

```bash
vercel --prod
```

You'll get a URL like: `hometownmap-threeforks.vercel.app`

---

## Alternative: Digital Ocean App Platform

For production with multiple cities.

### Pricing
- **Basic**: $12/month (512MB RAM)
- **Professional**: $24/month (1GB RAM) - Recommended

### Steps

1. **Push to GitHub** (see GITHUB_SETUP.sh)

2. **Create App on Digital Ocean**:
   - Go to https://cloud.digitalocean.com/apps
   - "Create App"
   - Connect GitHub: `itogeo/hometownmap`
   - Detect web service automatically

3. **Configure Build**:
   - **Source Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **Port**: 3000

4. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiaXRvZ2VvIiwiYSI6ImNta3ByZTZpNjBsbzMzZm9vb3BxeGFoNmoifQ.pHK8DdvZh5QHAkP4iRd1yw
   NEXT_PUBLIC_DEFAULT_CITY=three-forks
   NODE_ENV=production
   ```

5. **Deploy**:
   - Click "Create Resources"
   - Wait 5-10 minutes
   - Your app will be live at `https://hometownmap-xxxxx.ondigitalocean.app`

### Custom Domain

1. **Add Domain** in Digital Ocean:
   - Settings → Domains
   - Add: `threeforks.hometownmap.com`

2. **Update DNS**:
   - Add CNAME record:
     - Host: `threeforks`
     - Points to: `hometownmap-xxxxx.ondigitalocean.app`

---

## Production Checklist

Before deploying to production for Three Forks:

### Data
- [ ] Process all county GIS data
- [ ] Add Montana Cadastral ownership
- [ ] Integrate OpenStreetMap data
- [ ] Add Microsoft Building Footprints
- [ ] Verify data accuracy

### Configuration
- [ ] Update Three Forks demographics (population, income, etc.)
- [ ] Add city hall contact information
- [ ] Add city logo (if available)
- [ ] Verify resource links are correct
- [ ] Test all map modes

### Performance
- [ ] Test load time (should be <3 seconds)
- [ ] Verify all layers display correctly
- [ ] Test on mobile devices
- [ ] Test search functionality
- [ ] Check for console errors

### Legal & Compliance
- [ ] Add privacy policy (if collecting analytics)
- [ ] Add terms of service
- [ ] Verify data attribution
- [ ] Get city approval for deployment

### SEO & Branding
- [ ] Add favicon
- [ ] Update meta descriptions
- [ ] Add Open Graph tags for social sharing
- [ ] Set up Google Analytics (optional)

---

## Scaling to Multiple Cities

### Option 1: One Deployment Per City

**Pros**: Simple, isolated, easy to customize
**Cons**: More management overhead

```bash
# Deploy Three Forks
cd apps/web
vercel --prod

# Deploy Belgrade (future)
# Update config to belgrade.json
vercel --prod
```

Each city gets its own URL:
- `threeforks.hometownmap.com`
- `belgrade.hometownmap.com`
- `manhattan.hometownmap.com`

### Option 2: Multi-Tenant Single Deployment

**Pros**: One codebase, easier updates
**Cons**: More complex routing

Use subdirectories:
- `hometownmap.com/three-forks`
- `hometownmap.com/belgrade`

Or dynamic routes:
- `hometownmap.com/cities/three-forks`

---

## Cost Estimates

### Demo/First City (Three Forks)

**Vercel Free Tier**:
- Hosting: $0/month
- Bandwidth: 100GB/month included
- Build time: 100 hours/month
- **Good for**: Demo, pilot, proof of concept

### Production (1-10 Cities)

**Digital Ocean App Platform** ($24/month):
- 1GB RAM, 2 vCPU
- 250GB bandwidth
- **Per city cost**: $2.40/month (10 cities)
- **Revenue**: $300-500/city
- **Profit margin**: 99%+

### Scale (10-50 Cities)

**Digital Ocean Droplet** ($48/month):
- 2GB RAM, 2 vCPU
- 3TB bandwidth
- Self-managed
- **Per city cost**: $0.96/month (50 cities)

**Mapbox**:
- Free tier: 50,000 loads/month
- Pro: $5 per 10,000 loads (after free tier)
- **Estimate**: $0-10/month for 10 cities

---

## Monitoring & Analytics

### Error Tracking

**Sentry** (optional):
```bash
npm install @sentry/nextjs
```

Add to `next.config.js`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
  nextConfig,
  { silent: true },
  { hideSourceMaps: true }
)
```

### Usage Analytics

**Simple: Vercel Analytics**
```bash
npm install @vercel/analytics
```

**Advanced: Google Analytics**
Add to `_app.tsx`:
```javascript
import Script from 'next/script'

// Add Google Analytics script
<Script
  strategy="afterInteractive"
  src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX`}
/>
```

---

## Backup & Disaster Recovery

### Data Backups

Store processed GeoJSON in:
1. **GitHub** (version controlled)
2. **Digital Ocean Spaces** (S3-compatible storage, $5/month for 250GB)
3. **Local backup** (your machine)

### Deployment Rollback

```bash
# Vercel: View deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

---

## Security

### Environment Variables

Never commit:
- Mapbox tokens
- API keys
- Database credentials

Always use:
- `.env.local` (local development)
- Vercel/DO environment variables (production)

### API Rate Limiting

Add to API routes (future):
```javascript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Digital Ocean Docs**: https://docs.digitalocean.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

**You're ready to deploy! 🚀**
