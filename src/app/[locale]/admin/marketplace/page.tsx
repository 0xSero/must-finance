'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface MarketplaceConnection {
  id: string;
  marketplace: 'ALLEGRO' | 'AMAZON' | 'ALIEXPRESS';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  autoSync: boolean;
  lastSync?: string;
  credentials?: any;
}

export default function MarketplacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Allegro credentials
  const [allegroClientId, setAllegroClientId] = useState('');
  const [allegroClientSecret, setAllegroClientSecret] = useState('');

  // Amazon credentials
  const [amazonSellerId, setAmazonSellerId] = useState('');
  const [amazonAccessKey, setAmazonAccessKey] = useState('');
  const [amazonSecretKey, setAmazonSecretKey] = useState('');

  // Aliexpress credentials
  const [aliexpressAppKey, setAliexpressAppKey] = useState('');
  const [aliexpressAppSecret, setAliexpressAppSecret] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchConnections();
    }
  }, [status, session]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/marketplace/connections');
      const data = await response.json();
      setConnections(data.connections || []);

      // Populate existing credentials (without secrets)
      data.connections.forEach((conn: MarketplaceConnection) => {
        if (conn.marketplace === 'ALLEGRO' && conn.credentials) {
          setAllegroClientId(conn.credentials.clientId || '');
        } else if (conn.marketplace === 'AMAZON' && conn.credentials) {
          setAmazonSellerId(conn.credentials.sellerId || '');
        } else if (conn.marketplace === 'ALIEXPRESS' && conn.credentials) {
          setAliexpressAppKey(conn.credentials.appKey || '');
        }
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load marketplace connections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const connectAllegro = async () => {
    try {
      const response = await fetch('/api/admin/marketplace/allegro/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: allegroClientId,
          clientSecret: allegroClientSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      if (data.authUrl) {
        // Redirect to Allegro OAuth
        window.location.href = data.authUrl;
      } else {
        toast({
          title: 'Success',
          description: 'Allegro connected successfully',
        });
        fetchConnections();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect Allegro',
        variant: 'destructive',
      });
    }
  };

  const connectAmazon = async () => {
    try {
      const response = await fetch('/api/admin/marketplace/amazon/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: amazonSellerId,
          accessKey: amazonAccessKey,
          secretKey: amazonSecretKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast({
        title: 'Success',
        description: 'Amazon connected successfully',
      });
      fetchConnections();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect Amazon',
        variant: 'destructive',
      });
    }
  };

  const connectAliexpress = async () => {
    try {
      const response = await fetch('/api/admin/marketplace/aliexpress/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appKey: aliexpressAppKey,
          appSecret: aliexpressAppSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast({
        title: 'Success',
        description: 'Aliexpress connected successfully',
      });
      fetchConnections();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect Aliexpress',
        variant: 'destructive',
      });
    }
  };

  const syncMarketplace = async (marketplace: string) => {
    try {
      setSyncing(marketplace);
      const response = await fetch(`/api/admin/marketplace/${marketplace.toLowerCase()}/sync`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast({
        title: 'Success',
        description: `${marketplace} sync completed`,
      });
      fetchConnections();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to sync ${marketplace}`,
        variant: 'destructive',
      });
    } finally {
      setSyncing(null);
    }
  };

  const toggleAutoSync = async (connectionId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/marketplace/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSync: enabled }),
      });

      if (!response.ok) throw new Error('Failed to update auto-sync');

      toast({
        title: 'Success',
        description: `Auto-sync ${enabled ? 'enabled' : 'disabled'}`,
      });
      fetchConnections();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update auto-sync',
        variant: 'destructive',
      });
    }
  };

  const getConnectionStatus = (marketplace: string) => {
    const conn = connections.find((c) => c.marketplace === marketplace);
    return conn;
  };

  const StatusBadge = ({ connection }: { connection?: MarketplaceConnection }) => {
    if (!connection || connection.status === 'DISCONNECTED') {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Disconnected
        </Badge>
      );
    }
    if (connection.status === 'ERROR') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Connected
      </Badge>
    );
  };

  if (status === 'loading' || loading || session?.user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Marketplace Integration</h1>
        <p className="text-muted-foreground">
          Connect and manage your marketplace integrations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Allegro */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Allegro
              </CardTitle>
              <StatusBadge connection={getConnectionStatus('ALLEGRO')} />
            </div>
            <CardDescription>Polish marketplace integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getConnectionStatus('ALLEGRO')?.status === 'CONNECTED' ? (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allegro-auto">Auto-sync</Label>
                  <Switch
                    id="allegro-auto"
                    checked={getConnectionStatus('ALLEGRO')?.autoSync}
                    onCheckedChange={(checked) =>
                      toggleAutoSync(getConnectionStatus('ALLEGRO')!.id, checked)
                    }
                  />
                </div>
                {getConnectionStatus('ALLEGRO')?.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Last sync:{' '}
                    {new Date(getConnectionStatus('ALLEGRO')!.lastSync!).toLocaleString()}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={() => syncMarketplace('ALLEGRO')}
                  disabled={syncing === 'ALLEGRO'}
                >
                  {syncing === 'ALLEGRO' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="allegro-client-id">Client ID</Label>
                  <Input
                    id="allegro-client-id"
                    value={allegroClientId}
                    onChange={(e) => setAllegroClientId(e.target.value)}
                    placeholder="Enter Allegro Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allegro-secret">Client Secret</Label>
                  <Input
                    id="allegro-secret"
                    type="password"
                    value={allegroClientSecret}
                    onChange={(e) => setAllegroClientSecret(e.target.value)}
                    placeholder="Enter Allegro Client Secret"
                  />
                </div>
                <Button className="w-full" onClick={connectAllegro}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connect Allegro
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Amazon */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Amazon
              </CardTitle>
              <StatusBadge connection={getConnectionStatus('AMAZON')} />
            </div>
            <CardDescription>Amazon SP-API integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getConnectionStatus('AMAZON')?.status === 'CONNECTED' ? (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="amazon-auto">Auto-sync</Label>
                  <Switch
                    id="amazon-auto"
                    checked={getConnectionStatus('AMAZON')?.autoSync}
                    onCheckedChange={(checked) =>
                      toggleAutoSync(getConnectionStatus('AMAZON')!.id, checked)
                    }
                  />
                </div>
                {getConnectionStatus('AMAZON')?.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Last sync:{' '}
                    {new Date(getConnectionStatus('AMAZON')!.lastSync!).toLocaleString()}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={() => syncMarketplace('AMAZON')}
                  disabled={syncing === 'AMAZON'}
                >
                  {syncing === 'AMAZON' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amazon-seller-id">Seller ID</Label>
                  <Input
                    id="amazon-seller-id"
                    value={amazonSellerId}
                    onChange={(e) => setAmazonSellerId(e.target.value)}
                    placeholder="Enter Amazon Seller ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amazon-access-key">Access Key</Label>
                  <Input
                    id="amazon-access-key"
                    value={amazonAccessKey}
                    onChange={(e) => setAmazonAccessKey(e.target.value)}
                    placeholder="Enter AWS Access Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amazon-secret-key">Secret Key</Label>
                  <Input
                    id="amazon-secret-key"
                    type="password"
                    value={amazonSecretKey}
                    onChange={(e) => setAmazonSecretKey(e.target.value)}
                    placeholder="Enter AWS Secret Key"
                  />
                </div>
                <Button className="w-full" onClick={connectAmazon}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connect Amazon
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Aliexpress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Aliexpress
              </CardTitle>
              <StatusBadge connection={getConnectionStatus('ALIEXPRESS')} />
            </div>
            <CardDescription>Supplier integration for auto-reorder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getConnectionStatus('ALIEXPRESS')?.status === 'CONNECTED' ? (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="aliexpress-auto">Auto-sync</Label>
                  <Switch
                    id="aliexpress-auto"
                    checked={getConnectionStatus('ALIEXPRESS')?.autoSync}
                    onCheckedChange={(checked) =>
                      toggleAutoSync(getConnectionStatus('ALIEXPRESS')!.id, checked)
                    }
                  />
                </div>
                {getConnectionStatus('ALIEXPRESS')?.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Last sync:{' '}
                    {new Date(getConnectionStatus('ALIEXPRESS')!.lastSync!).toLocaleString()}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={() => syncMarketplace('ALIEXPRESS')}
                  disabled={syncing === 'ALIEXPRESS'}
                >
                  {syncing === 'ALIEXPRESS' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="aliexpress-app-key">App Key</Label>
                  <Input
                    id="aliexpress-app-key"
                    value={aliexpressAppKey}
                    onChange={(e) => setAliexpressAppKey(e.target.value)}
                    placeholder="Enter Aliexpress App Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliexpress-app-secret">App Secret</Label>
                  <Input
                    id="aliexpress-app-secret"
                    type="password"
                    value={aliexpressAppSecret}
                    onChange={(e) => setAliexpressAppSecret(e.target.value)}
                    placeholder="Enter Aliexpress App Secret"
                  />
                </div>
                <Button className="w-full" onClick={connectAliexpress}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connect Aliexpress
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>Overview of all marketplace connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Total Connections</p>
                <p className="text-sm text-muted-foreground">Active marketplace integrations</p>
              </div>
              <div className="text-3xl font-bold">
                {connections.filter((c) => c.status === 'CONNECTED').length}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Products Synced</p>
                <p className="mt-2 text-2xl font-bold">-</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Orders Imported</p>
                <p className="mt-2 text-2xl font-bold">-</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Inventory Syncs</p>
                <p className="mt-2 text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
