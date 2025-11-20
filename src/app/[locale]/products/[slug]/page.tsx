import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ProductDetails } from '@/components/products/product-details';

interface ProductPageProps {
  params: {
    slug: string;
    locale: string;
  };
}

async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      inventory: true,
    },
  });

  return product;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product || !product.isVisible) {
    notFound();
  }

  return <ProductDetails product={product} />;
}
