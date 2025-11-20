import { useTranslations } from 'next-intl';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductFilters } from '@/components/products/product-filters';

export default function ProductsPage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('nav.shop')}</h1>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block">
          <ProductFilters />
        </aside>

        {/* Products Grid */}
        <main>
          <ProductGrid />
        </main>
      </div>
    </div>
  );
}
