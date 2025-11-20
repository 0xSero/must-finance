import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ShoppingBag, Package, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t('common.appName')}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Discover amazing products with support in multiple languages. Shop with confidence.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/products">
            <Button size="lg" className="gap-2">
              <ShoppingBag className="h-5 w-5" />
              {t('nav.shop')}
            </Button>
          </Link>
          <Link href="/categories">
            <Button size="lg" variant="outline">
              {t('nav.categories')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold">{t('common.learnMore')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Easy Shopping</CardTitle>
              <CardDescription>Browse and purchase products with just a few clicks</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Fast Delivery</CardTitle>
              <CardDescription>Get your orders delivered quickly and safely</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Best Prices</CardTitle>
              <CardDescription>Competitive prices and regular discounts</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Featured Products Section (will be populated with real data) */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">{t('nav.newArrivals')}</h2>
          <Link href="/products">
            <Button variant="link">{t('common.viewAll')}</Button>
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Product cards will go here */}
          <Card className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="aspect-square bg-muted" />
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg">Sample Product</CardTitle>
              <CardDescription>100.00 {t('common.currency')}</CardDescription>
              <Button className="mt-4 w-full">{t('product.addToCart')}</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
