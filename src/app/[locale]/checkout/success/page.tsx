'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          setOrder(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching order:', error);
          setLoading(false);
        });
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <CheckCircle className="mx-auto mb-6 h-20 w-20 text-green-600" />
        <h1 className="mb-4 text-3xl font-bold">{t('payment.paymentSuccess')}</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Thank you for your order! We've received your payment and will process your order shortly.
        </p>

        {order && (
          <Card className="mb-8 text-left">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-mono font-semibold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{order.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">
                  {order.total.toFixed(2)} {order.currency}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/account/orders">
            <Button size="lg">{t('account.viewOrder')}</Button>
          </Link>
          <Link href="/products">
            <Button size="lg" variant="outline">
              {t('cart.continueShopping')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
