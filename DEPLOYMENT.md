# Deployment Guide

Complete guide for deploying your e-commerce platform to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Stripe account
- Domain name (optional but recommended)

## Environment Setup

### 1. Database Setup

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL
sudo apt-get install postgresql

# Create database
sudo -u postgres createdb ecommerce

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
```

**Option B: Cloud Database (Recommended)**

We recommend using one of these providers:
- **Supabase** (Free tier available)
- **Neon** (Serverless Postgres)
- **Railway** (Easy setup)
- **PlanetScale** (MySQL compatible)

Example for Supabase:
```bash
# Get connection string from Supabase dashboard
DATABASE_URL="postgresql://postgres:[password]@[project].supabase.co:5432/postgres"
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

**Required Variables:**
```env
# Database
DATABASE_URL="your-database-url"

# NextAuth
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="https://yourdomain.com"

# Stripe (get from https://dashboard.stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Created after setting up webhook

# App
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
ADMIN_EMAIL="your-email@example.com"
```

### 3. Database Migration

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or use migrations (recommended for production)
npx prisma migrate deploy
```

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env`
   - Redeploy after adding variables

4. **Set up Stripe Webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/checkout/webhook`
   - Select events: `checkout.session.completed`, `checkout.session.expired`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

**Vercel Configuration (vercel.json):**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["fra1"]
}
```

### Option 2: Docker Deployment

1. **Create Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Build and run:**
```bash
docker build -t ecommerce-store .
docker run -p 3000:3000 --env-file .env ecommerce-store
```

### Option 3: VPS (DigitalOcean, Linode, etc.)

1. **Install Node.js and PM2:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

2. **Clone and setup:**
```bash
git clone your-repo
cd e-com
npm install
npm run db:generate
npm run db:push
npm run build
```

3. **Run with PM2:**
```bash
pm2 start npm --name "ecommerce" -- start
pm2 save
pm2 startup
```

4. **Setup Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Setup SSL with Let's Encrypt:**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment Setup

### 1. Create Admin User

```bash
# Connect to your database
psql $DATABASE_URL

# Create admin user
INSERT INTO "users" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'admin-id',
  'admin@yourdomain.com',
  'Admin',
  '$2a$12$your-hashed-password', -- Generate with: bcrypt.hash('password', 12)
  'ADMIN',
  NOW(),
  NOW()
);
```

Or use this script:
```typescript
// scripts/create-admin.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('your-secure-password', 12);

  await prisma.user.create({
    data: {
      email: 'admin@yourdomain.com',
      name: 'Admin',
      password,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created!');
}

main();
```

### 2. Add Sample Products

```bash
# Use the API or Prisma Studio
npx prisma studio
```

### 3. Test Stripe Webhook

```bash
# Use Stripe CLI for testing
stripe listen --forward-to localhost:3000/api/checkout/webhook
```

### 4. Configure DNS

Point your domain to your deployment:
- **Vercel**: Add domain in Vercel dashboard
- **VPS**: Point A record to your server IP

### 5. Setup Monitoring (Optional)

**Sentry for Error Tracking:**
```bash
npm install @sentry/nextjs
```

**Vercel Analytics:**
```bash
npm install @vercel/analytics
```

## Admin Portal Deployment

The admin portal is a desktop app that connects to your API:

1. **Build the app:**
```bash
cd admin-portal
npm install
npm run tauri:build
```

2. **Configure API endpoint:**
   - Update `VITE_API_URL` in `.env` to point to your production API
   - Example: `VITE_API_URL=https://yourdomain.com`

3. **Distribute:**
   - Windows: `.exe` installer in `src-tauri/target/release/bundle/`
   - macOS: `.dmg` in `src-tauri/target/release/bundle/`
   - Linux: `.AppImage` or `.deb` in `src-tauri/target/release/bundle/`

## Performance Optimization

### 1. Enable Caching

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.com'],
  },
  headers: async () => [
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

### 2. Use CDN for Images

Upload product images to:
- **Cloudinary**
- **AWS S3 + CloudFront**
- **Vercel Blob Storage**

### 3. Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders("userId");
CREATE INDEX idx_orders_status ON orders(status);
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Stripe webhook signature verified
- [ ] Rate limiting enabled (use Vercel's built-in or add middleware)
- [ ] CORS configured properly
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Prisma)
- [ ] XSS prevention (React's built-in)
- [ ] CSRF tokens for forms (NextAuth handles this)

## Backup Strategy

### Database Backups

**Automated with Supabase/Neon:**
- Daily automatic backups included

**Manual with PostgreSQL:**
```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240101.sql
```

### Media Backups

- Store product images in cloud storage with versioning
- Setup automated backups for user-uploaded content

## Monitoring & Maintenance

### Health Checks

Create a health check endpoint:
```typescript
// app/api/health/route.ts
import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: 'healthy' });
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 500 });
  }
}
```

### Logging

- Use Vercel logs for hosted apps
- Setup Sentry for error tracking
- Monitor Stripe dashboard for payment issues

## Scaling Considerations

When you need to scale:

1. **Database**:
   - Move to connection pooling (PgBouncer)
   - Consider read replicas
   - Use Redis for caching

2. **Images**:
   - Use CDN
   - Implement lazy loading
   - Optimize image formats (WebP, AVIF)

3. **API**:
   - Implement rate limiting
   - Add API caching
   - Use edge functions for global distribution

## Support

For issues or questions:
- Check GitHub Issues
- Review Next.js documentation
- Check Stripe documentation for payment issues
- Review marketplace API docs for integration issues
