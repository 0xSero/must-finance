'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from './product-card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  sku: string;
  inventory?: {
    quantity: number;
  };
}

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const loadProducts = async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      const response = await fetch(`/api/products?limit=${limit}&offset=${currentOffset}`);
      const data = await response.json();

      if (reset) {
        setProducts(data.products);
        setOffset(limit);
      } else {
        setProducts((prev) => [...prev, ...data.products]);
        setOffset((prev) => prev + limit);
      }

      setHasMore(data.products.length === limit);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(true);
  }, []);

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <Button onClick={() => loadProducts()} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
