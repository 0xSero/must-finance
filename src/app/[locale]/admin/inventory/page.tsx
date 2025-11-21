'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Loader2, AlertTriangle, Package } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';

interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  supplierName?: string;
  supplierSku?: string;
  product: {
    name: string;
    sku: string;
    category: string;
    images: string[];
  };
}

export default function InventoryManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchInventory();
    }
  }, [status, session]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/inventory');
      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.lowStockThreshold;
  const needsReorder = (item: InventoryItem) => item.quantity <= item.reorderPoint;

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplierSku?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = !filterLowStock || isLowStock(item);

    return matchesSearch && matchesFilter;
  });

  const lowStockCount = inventory.filter(isLowStock).length;
  const reorderNeededCount = inventory.filter(needsReorder).length;
  const totalValue = inventory.reduce((sum, item) => sum + item.quantity, 0);

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
        <h1 className="mb-2 text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">Monitor stock levels and manage inventory</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-xs text-muted-foreground">{totalValue} units in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reorder Needed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reorderNeededCount}</div>
            <p className="text-xs text-muted-foreground">Critical stock levels</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product name, SKU, or supplier SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={filterLowStock ? 'default' : 'outline'}
              onClick={() => setFilterLowStock(!filterLowStock)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Low Stock Only
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>In Stock</TableHead>
                  <TableHead>Low Stock</TableHead>
                  <TableHead>Reorder Point</TableHead>
                  <TableHead>Reorder Qty</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => {
                    const lowStock = isLowStock(item);
                    const reorder = needsReorder(item);

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                              {item.product.images[0] ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <Link
                              href={`/admin/products/${item.productId}/edit`}
                              className="font-medium hover:underline"
                            >
                              {item.product.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.product.sku}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={reorder ? 'font-bold text-destructive' : ''}>
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{item.lowStockThreshold}</TableCell>
                        <TableCell>{item.reorderPoint}</TableCell>
                        <TableCell>{item.reorderQuantity}</TableCell>
                        <TableCell>
                          {item.supplierName ? (
                            <div>
                              <p className="text-sm font-medium">{item.supplierName}</p>
                              {item.supplierSku && (
                                <p className="text-xs text-muted-foreground">
                                  SKU: {item.supplierSku}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {reorder ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Reorder Now
                            </Badge>
                          ) : lowStock ? (
                            <Badge variant="secondary" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="default">In Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
