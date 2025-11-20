'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    email: session?.user?.email || '',
    phone: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'PL',
  });

  const [billingAddress, setBillingAddress] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'PL',
  });

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">{t('cart.empty')}</h1>
        <Button onClick={() => router.push('/products')}>{t('cart.continueShopping')}</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customerEmail: shippingAddress.email,
          customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
          userId: session?.user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        clearCart();
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('errors.generic'),
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.shippingAddress')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('checkout.firstName')}</Label>
                    <Input
                      id="firstName"
                      required
                      value={shippingAddress.firstName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('checkout.lastName')}</Label>
                    <Input
                      id="lastName"
                      required
                      value={shippingAddress.lastName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('checkout.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={shippingAddress.email}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('checkout.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">{t('checkout.company')}</Label>
                  <Input
                    id="company"
                    value={shippingAddress.company}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, company: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address1">{t('checkout.address')}</Label>
                  <Input
                    id="address1"
                    required
                    value={shippingAddress.address1}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address1: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={shippingAddress.address2}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address2: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('checkout.city')}</Label>
                    <Input
                      id="city"
                      required
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">{t('checkout.postalCode')}</Label>
                    <Input
                      id="postalCode"
                      required
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.billingAddress')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onCheckedChange={(checked) => setSameAsShipping(checked as boolean)}
                  />
                  <Label htmlFor="sameAsShipping" className="cursor-pointer font-normal">
                    {t('checkout.sameAsShipping')}
                  </Label>
                </div>

                {!sameAsShipping && (
                  <div className="space-y-4">
                    {/* Same fields as shipping address */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="billingFirstName">{t('checkout.firstName')}</Label>
                        <Input
                          id="billingFirstName"
                          required={!sameAsShipping}
                          value={billingAddress.firstName}
                          onChange={(e) =>
                            setBillingAddress({ ...billingAddress, firstName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingLastName">{t('checkout.lastName')}</Label>
                        <Input
                          id="billingLastName"
                          required={!sameAsShipping}
                          value={billingAddress.lastName}
                          onChange={(e) =>
                            setBillingAddress({ ...billingAddress, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    {/* Add more billing fields as needed */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{t('checkout.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.price * item.quantity, t('common.currency'))}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('cart.subtotal')}</span>
                    <span>{formatPrice(getTotalPrice(), t('common.currency'))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('cart.shipping')}</span>
                    <span className="text-muted-foreground">Calculated at next step</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary">
                    {formatPrice(getTotalPrice(), t('common.currency'))}
                  </span>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('checkout.processingPayment')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      {t('checkout.placeOrder')}
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  You will be redirected to Stripe for secure payment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
