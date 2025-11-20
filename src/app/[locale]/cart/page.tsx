'use client';

import { useTranslations } from 'next-intl';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const t = useTranslations();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">{t('cart.empty')}</h1>
        <p className="mb-8 text-muted-foreground">Add some products to get started!</p>
        <Link href="/products">
          <Button size="lg">{t('cart.continueShopping')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('cart.title')}</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.productId}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatPrice(item.price * item.quantity, t('common.currency'))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.price, t('common.currency'))} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-bold">{t('checkout.orderSummary')}</h2>

              <div className="space-y-3 border-b pb-4">
                <div className="flex justify-between text-sm">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatPrice(getTotalPrice(), t('common.currency'))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('cart.shipping')}</span>
                  <span className="text-muted-foreground">Calculated at checkout</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between text-lg font-bold">
                <span>{t('cart.total')}</span>
                <span className="text-primary">
                  {formatPrice(getTotalPrice(), t('common.currency'))}
                </span>
              </div>

              <Link href="/checkout" className="mt-6 block">
                <Button size="lg" className="w-full">
                  {t('cart.checkout')}
                </Button>
              </Link>

              <Link href="/products" className="mt-2 block">
                <Button variant="outline" className="w-full">
                  {t('cart.continueShopping')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
