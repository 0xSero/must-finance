'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/utils';
import { Loader2, Package } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
      images: string[];
    };
    quantity: number;
  }>;
}

export default function OrdersPage() {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          setOrders(data.orders || []);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching orders:', error);
          setLoading(false);
        });
    }
  }, [status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'default';
      case 'SHIPPED':
        return 'secondary';
      case 'PROCESSING':
        return 'outline';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('account.orderHistory')}</h1>
        <Link href="/account">
          <Button variant="outline">{t('common.back')}</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="mb-4 text-lg font-medium">{t('account.noOrders')}</p>
            <Link href="/products">
              <Button>{t('account.startShopping')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="mb-2">
                      {t('account.orderNumber')} {order.orderNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                    <p className="mt-2 text-lg font-semibold">
                      {formatPrice(order.total, order.currency)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {item.product.images[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{order.items.length - 3} more items
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/account/orders/${order.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      {t('account.viewOrder')}
                    </Button>
                  </Link>
                  {order.status === 'DELIVERED' && (
                    <Link href={`/support/refund?order=${order.id}`}>
                      <Button variant="outline">{t('account.requestRefund')}</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
