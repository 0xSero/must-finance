'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/components/ui/use-toast';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: string[];
    sku: string;
    inventory?: {
      quantity: number;
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations();
  const addItem = useCartStore((state) => state.addItem);

  const inStock = (product.inventory?.quantity || 0) > 0;
  const discount = product.compareAtPrice
    ? calculateDiscount(product.price, product.compareAtPrice)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!inStock) return;

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      sku: product.sku,
    });

    toast({
      title: t('common.success'),
      description: `${product.name} ${t('product.addToCart').toLowerCase()}`,
    });
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}

            {discount > 0 && (
              <div className="absolute right-2 top-2 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">
                -{discount}%
              </div>
            )}

            {!inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <span className="rounded-full bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground">
                  {t('product.outOfStock')}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <CardTitle className="mb-2 line-clamp-2 text-lg">{product.name}</CardTitle>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl font-bold text-primary">
              {formatPrice(product.price, t('common.currency'))}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice, t('common.currency'))}
              </span>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={!inStock}
            variant={inStock ? 'default' : 'secondary'}
          >
            {inStock ? (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t('product.addToCart')}
              </>
            ) : (
              t('product.outOfStock')
            )}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
