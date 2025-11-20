'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Minus, Plus, Package } from 'lucide-react';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    tags: string[];
    sku: string;
    barcode?: string | null;
    inventory?: {
      quantity: number;
      lowStockThreshold: number;
    } | null;
  };
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const t = useTranslations();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const inStock = (product.inventory?.quantity || 0) > 0;
  const stockQuantity = product.inventory?.quantity || 0;
  const isLowStock = stockQuantity <= (product.inventory?.lowStockThreshold || 10);
  const discount = product.compareAtPrice
    ? calculateDiscount(product.price, product.compareAtPrice)
    : 0;

  const handleAddToCart = () => {
    if (!inStock || quantity > stockQuantity) return;

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      sku: product.sku,
      quantity,
    });

    toast({
      title: t('common.success'),
      description: `Added ${quantity}x ${product.name} to cart`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            {product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">{product.category}</Badge>
              {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
              {isLowStock && inStock && (
                <Badge variant="outline" className="border-orange-500 text-orange-500">
                  {t('product.lowStock', { count: stockQuantity })}
                </Badge>
              )}
            </div>

            <h1 className="mb-4 text-3xl font-bold">{product.name}</h1>

            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                {formatPrice(product.price, t('common.currency'))}
              </span>
              {product.compareAtPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice, t('common.currency'))}
                </span>
              )}
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('product.sku')}:</span>
              <span className="font-mono">{product.sku}</span>
            </div>

            {inStock ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-600" />
                <span className="font-medium">{t('product.inStock')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span className="font-medium">{t('product.outOfStock')}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Quantity Selector */}
          {inStock && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">{t('product.quantity')}</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-16 text-center text-lg font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                    disabled={quantity >= stockQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t('product.addToCart')} - {formatPrice(product.price * quantity, t('common.currency'))}
              </Button>
            </div>
          )}

          <Separator />

          {/* Description */}
          <div>
            <h2 className="mb-3 text-xl font-semibold">{t('product.description')}</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">{t('product.tags')}</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
