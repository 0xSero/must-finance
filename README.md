# E-Commerce Store

A modern, full-featured e-commerce platform built with Next.js 14, TypeScript, and Shadcn UI. Supports multiple languages, payment methods, and marketplace integrations.

## Features

### Customer Features
- 🌍 **Multi-language Support**: Polish, English, Ukrainian, Russian, Hindi, Arabic, Chinese
- 🛒 **Shopping Cart**: Add, remove, and update products
- 💳 **Payment Integration**: Stripe & BLIK payment support
- 📱 **PWA Support**: Install as mobile app
- 🌙 **Dark Mode**: Beautiful dark theme with purple accents
- 📦 **Order Tracking**: Track orders and view history
- 💬 **Support System**: Contact support and request refunds
- 🔐 **User Authentication**: Secure login and account management

### Admin Features (Separate Desktop App)
- 📊 **Inventory Management**: Track stock levels with low stock alerts
- 📝 **Product Management**: Add, edit, remove, or hide products
- 🛍️ **Marketplace Integration**:
  - Allegro - List and manage products
  - Amazon.pl - Marketplace integration
  - Aliexpress/Alibaba - Auto-order when stock is low
- 📈 **Analytics Dashboard**: View sales and inventory data
- 🔄 **Automated Reordering**: Automatic stock replenishment

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe code
- **Shadcn UI** - Modern component library
- **Tailwind CSS** - Utility-first styling
- **next-intl** - Internationalization
- **Zustand** - State management

### Backend
- **Next.js API Routes** - Serverless API
- **PostgreSQL** - Primary database
- **Prisma** - Type-safe ORM

### Payments
- **Stripe** - Credit/debit card payments
- **BLIK** - Polish payment method

### External Integrations
- **Allegro API** - Polish marketplace
- **Amazon SP-API** - Amazon marketplace
- **Aliexpress/Alibaba API** - Supplier integration

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd e-com
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- Database connection string
- Stripe API keys
- BLIK credentials
- Marketplace API keys (Allegro, Amazon, Aliexpress)

4. **Set up the database**
```bash
npm run db:push
npm run db:generate
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
e-com/
├── src/
│   ├── app/
│   │   ├── [locale]/           # Localized pages
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── products/       # Product pages
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── checkout/       # Checkout flow
│   │   │   ├── account/        # User account
│   │   │   └── support/        # Customer support
│   │   └── api/                # API routes
│   │       ├── products/       # Product management
│   │       ├── orders/         # Order processing
│   │       ├── stripe/         # Stripe webhooks
│   │       └── inventory/      # Inventory tracking
│   ├── components/
│   │   ├── ui/                 # Shadcn UI components
│   │   ├── layout/             # Layout components
│   │   └── products/           # Product components
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   └── utils.ts           # Utility functions
│   ├── i18n.ts                # i18n configuration
│   └── middleware.ts          # Next.js middleware
├── prisma/
│   └── schema.prisma          # Database schema
├── messages/                   # Translation files
│   ├── en.json
│   ├── pl.json
│   ├── uk.json
│   ├── ru.json
│   ├── hi.json
│   ├── ar.json
│   └── zh.json
├── public/                    # Static assets
└── admin-portal/             # Admin desktop app (separate)
```

## Color Scheme

- **Background**: `#1b1b1b`
- **Card Background**: `#303030`
- **Primary (Purple)**: `hsl(270 80% 60%)`
- **Text**: Light gray/white

## API Routes

### Products
- `GET /api/products` - List all products
- `GET /api/products/[id]` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/[id]` - Update product (admin)
- `DELETE /api/products/[id]` - Delete product (admin)
- `PATCH /api/products/[id]/visibility` - Toggle visibility (admin)

### Orders
- `GET /api/orders` - List user orders
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders` - Create order
- `POST /api/orders/[id]/refund` - Request refund

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `PUT /api/cart/[id]` - Update cart item
- `DELETE /api/cart/[id]` - Remove from cart

### Payments
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/blik/payment` - Process BLIK payment

### Inventory
- `GET /api/inventory` - Get inventory levels
- `POST /api/inventory/reorder` - Trigger reorder
- `GET /api/inventory/low-stock` - Get low stock items

## Admin Portal

The admin portal is a separate Electron/Tauri desktop application located in `/admin-portal`.

### Features
- Product management across all platforms
- Inventory tracking and alerts
- Automated ordering from Aliexpress/Alibaba
- Marketplace listing management (Allegro, Amazon.pl)
- Sales analytics and reporting

### Setup
```bash
cd admin-portal
npm install
npm run dev
```

## Deployment

### Vercel (Recommended for Next.js)
```bash
npm run build
vercel deploy
```

### Environment Variables
Ensure all environment variables are set in your deployment platform:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BLIK_API_KEY`
- `ALLEGRO_CLIENT_ID`
- `ALLEGRO_CLIENT_SECRET`
- `AMAZON_LWA_CLIENT_ID`
- `AMAZON_LWA_CLIENT_SECRET`
- `ALIEXPRESS_APP_KEY`
- `ALIEXPRESS_APP_SECRET`

## Contributing

This is an open-source project built with free frameworks and tools:
- Next.js (MIT)
- Shadcn UI (MIT)
- Prisma (Apache 2.0)
- Tailwind CSS (MIT)

## Development Status

### ✅ Completed
- [x] Project initialization with Next.js 14
- [x] TypeScript configuration
- [x] Shadcn UI setup with dark theme
- [x] Tailwind CSS configuration
- [x] PWA support
- [x] Multi-language support (7 languages)
- [x] Database schema with Prisma
- [x] Basic layout and homepage

### 🚧 In Progress
- [ ] Product management API routes
- [ ] Stripe integration
- [ ] BLIK integration
- [ ] Shopping cart functionality
- [ ] Checkout flow
- [ ] User authentication
- [ ] Order management
- [ ] Support system
- [ ] Admin portal
- [ ] Marketplace integrations

### 📋 Planned
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Product reviews
- [ ] Wishlist
- [ ] Discount codes
- [ ] Multi-currency support

## License

MIT

## Support

For questions or issues, please open an issue on GitHub or contact support.
