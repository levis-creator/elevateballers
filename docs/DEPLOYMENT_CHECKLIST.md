# Vercel Deployment Checklist

Use this checklist to ensure your app is ready for Vercel deployment.

## Pre-Deployment

- [x] Installed `@astrojs/vercel` adapter
- [x] Updated `astro.config.mjs` to use Vercel adapter
- [x] Removed `@astrojs/node` dependency
- [x] Created `vercel.json` configuration
- [ ] All code committed and pushed to Git repository
- [ ] Database migrations are ready
- [ ] Environment variables documented

## Vercel Setup

- [ ] Created Vercel account
- [ ] Connected Git repository to Vercel
- [ ] Initial deployment completed

## Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong secret key (generate with `openssl rand -base64 32`)
- [ ] `NODE_ENV` - Set to `production`
- [ ] Any feature flags (optional)

## Database

- [ ] Database created (Vercel Postgres or external)
- [ ] `DATABASE_URL` environment variable set
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Database connection tested

## Post-Deployment

- [ ] Site loads correctly
- [ ] API routes work
- [ ] Database queries work
- [ ] Authentication works (if applicable)
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active (automatic with Vercel)

## Testing

- [ ] Homepage loads
- [ ] Navigation works
- [ ] API endpoints respond correctly
- [ ] Database reads/writes work
- [ ] Forms submit correctly
- [ ] Images and assets load

## Monitoring

- [ ] Vercel Analytics enabled (optional)
- [ ] Error tracking set up (optional)
- [ ] Deployment notifications configured (optional)

---

**Quick Deploy Command:**
```bash
vercel --prod
```

**View Logs:**
```bash
vercel logs
```



