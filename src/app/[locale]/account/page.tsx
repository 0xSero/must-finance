'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, Package, MapPin, Settings, HeadphonesIcon } from 'lucide-react';
import { useEffect } from 'react';

export default function AccountPage() {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('account.myAccount')}</h1>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {session.user.name || session.user.email}!</CardTitle>
            <CardDescription>Manage your account and orders</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/account/orders">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('account.orders')}</CardTitle>
              <CardDescription>View your order history and track shipments</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/account/addresses">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('account.addresses')}</CardTitle>
              <CardDescription>Manage your shipping and billing addresses</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/account/profile">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('account.profile')}</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/support">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <HeadphonesIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('common.support')}</CardTitle>
              <CardDescription>Contact support or request refunds</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/account/settings">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('account.settings')}</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
