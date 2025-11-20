import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      compareAtPrice,
      sku,
      barcode,
      images,
      category,
      tags,
      isVisible,
      isFeatured,
      metaTitle,
      metaDescription,
      translations,
    } = body;

    const product = await db.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price,
        compareAtPrice,
        sku,
        barcode,
        images,
        category,
        tags,
        isVisible,
        isFeatured,
        metaTitle,
        metaDescription,
        translations,
      },
      include: {
        inventory: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Product with this SKU already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await db.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { isVisible } = body;

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json({ error: 'isVisible must be a boolean' }, { status: 400 });
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: { isVisible },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product visibility:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to update product visibility' }, { status: 500 });
  }
}
