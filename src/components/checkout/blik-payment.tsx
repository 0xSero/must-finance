'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface BlikPaymentProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BlikPayment({ orderId, amount, onSuccess, onCancel }: BlikPaymentProps) {
  const t = useTranslations();
  const [blikCode, setBlikCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (blikCode.length !== 6 || !/^\d{6}$/.test(blikCode)) {
      toast({
        title: t('common.error'),
        description: 'BLIK code must be 6 digits',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Process BLIK payment with code
      const response = await fetch(`/api/checkout/blik/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          blikCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      toast({
        title: t('common.success'),
        description: t('payment.paymentSuccess'),
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('payment.paymentFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBlikCode = (value: string) => {
    // Only allow digits and limit to 6
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setBlikCode(cleaned);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('payment.blik')}</CardTitle>
        <CardDescription>
          Open your banking app and generate a BLIK code to complete the payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Amount to pay:</span>
              <span className="text-lg font-bold">
                {amount.toFixed(2)} {t('common.currency')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blikCode">{t('payment.blikCode')}</Label>
            <Input
              id="blikCode"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              value={blikCode}
              onChange={(e) => formatBlikCode(e.target.value)}
              className="text-center text-2xl font-mono tracking-wider"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code from your banking app
            </p>
          </div>

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading || blikCode.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay with BLIK'
              )}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h4 className="mb-2 text-sm font-semibold">How to pay with BLIK:</h4>
            <ol className="space-y-1 text-xs text-muted-foreground">
              <li>1. Open your banking app</li>
              <li>2. Find the BLIK section</li>
              <li>3. Generate a 6-digit code</li>
              <li>4. Enter the code above within 2 minutes</li>
              <li>5. Confirm the payment in your app</li>
            </ol>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
