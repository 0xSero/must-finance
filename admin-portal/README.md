# E-Commerce Admin Portal

Desktop application for managing your e-commerce store with marketplace integrations.

## Features

- 📊 **Inventory Dashboard** - Real-time stock levels and alerts
- 📦 **Product Management** - Add, edit, remove, and hide products
- 🛍️ **Order Management** - View and process orders
- 🔄 **Marketplace Sync** - Integrate with Allegro, Amazon.pl
- 🚚 **Supplier Integration** - Auto-order from Aliexpress/Alibaba
- 📈 **Analytics** - Sales reports and insights

## Tech Stack

- **Tauri** - Cross-platform desktop framework
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Query** - Data fetching
- **Zustand** - State management

## Getting Started

### Prerequisites

- Node.js 18+
- Rust (for Tauri)
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd admin-portal
npm install
```

2. Configure API endpoint:
Edit `.env` and set your main store API URL:
```
VITE_API_URL=http://localhost:3000
```

3. Run development server:
```bash
npm run tauri:dev
```

### Building for Production

```bash
npm run tauri:build
```

This will create installers for your platform in `src-tauri/target/release/bundle/`.

## Project Structure

```
admin-portal/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page views
│   ├── lib/            # Utilities and API clients
│   ├── types/          # TypeScript types
│   └── App.tsx         # Root component
├── src-tauri/          # Tauri backend
│   ├── src/
│   │   └── main.rs     # Rust main file
│   ├── Cargo.toml      # Rust dependencies
│   └── tauri.conf.json # Tauri configuration
└── package.json
```

## Marketplace Integrations

### Allegro API
- Product listing management
- Order synchronization
- Stock level updates
- Pricing management

### Amazon SP-API
- Marketplace integration for Amazon.pl
- FBA inventory tracking
- Order fulfillment
- Product catalog sync

### Aliexpress/Alibaba
- Automated reordering when stock is low
- Supplier order tracking
- Price monitoring
- Shipment tracking

## Development

### Adding a New Feature

1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update routing in `App.tsx`
4. Add API calls in `src/lib/api.ts`

### Environment Variables

- `VITE_API_URL` - Main store API endpoint
- `VITE_ALLEGRO_CLIENT_ID` - Allegro OAuth client ID
- `VITE_AMAZON_REGION` - Amazon marketplace region
- `VITE_ALIEXPRESS_APP_KEY` - Aliexpress app key

## License

MIT
