'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, TrendingUp, ShoppingCart, DollarSign, Package, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Analytics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    totalProducts: number;
  };
  revenueByPeriod: {
    period: string;
    revenue: number;
    orders: number;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
  }[];
  topCustomers: {
    userId: string;
    userName: string;
    userEmail: string;
    totalSpent: number;
    orderCount: number;
  }[];
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchAnalytics();
    }
  }, [status, session, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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

  if (!analytics) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Sales reports and business insights</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalRevenue.toFixed(2)} PLN</div>
            <p className="text-xs text-muted-foreground">Last {period} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total orders placed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.averageOrderValue.toFixed(2)} PLN
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active listings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.topProducts.map((product, index) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-6 w-6 rounded-full p-0">
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{product.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.totalSold} units</TableCell>
                        <TableCell className="text-right font-medium">
                          {product.revenue.toFixed(2)} PLN
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.topCustomers.map((customer, index) => (
                      <TableRow key={customer.userId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-6 w-6 rounded-full p-0">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{customer.userName || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">
                                {customer.userEmail}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.orderCount}</TableCell>
                        <TableCell className="text-right font-medium">
                          {customer.totalSpent.toFixed(2)} PLN
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
