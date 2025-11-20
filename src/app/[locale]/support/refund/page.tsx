'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function RefundRequestPage() {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || '');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      // Fetch user orders
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          const eligibleOrders = (data.orders || []).filter(
            (order: any) => order.paymentStatus === 'PAID' && order.status !== 'REFUNDED'
          );
          setOrders(eligibleOrders);
        });
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrderId || !reason) {
      toast({
        title: t('common.error'),
        description: t('errors.requiredField'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit refund request');
      }

      toast({
        title: t('common.success'),
        description: t('refund.requestSubmitted'),
      });

      router.push('/account/orders');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">{t('refund.requestRefund')}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t('refund.requestRefund')}</CardTitle>
            <CardDescription>
              Please select an order and provide a reason for the refund request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order">Select Order</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNumber} - {order.total.toFixed(2)} {order.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">{t('refund.reason')}</Label>
                <Textarea
                  id="reason"
                  required
                  rows={6}
                  placeholder="Please describe why you would like a refund..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium">Refund Policy:</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Refund requests are reviewed within 2-3 business days</li>
                  <li>Approved refunds are processed within 5-7 business days</li>
                  <li>Items must be in original condition for full refund</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !selectedOrderId}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  t('refund.submitRequest')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
