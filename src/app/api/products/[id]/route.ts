import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      dimensions,
    } = body;

    // Update slug if name changes
    let slug;
    if (name) {
      slug =
        name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-') +
        '-' +
        Date.now();
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name, slug }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(compareAtPrice !== undefined && { compareAtPrice }),
        ...(sku && { sku }),
        ...(barcode !== undefined && { barcode }),
        ...(images && { images }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(isVisible !== undefined && { isVisible }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(translations !== undefined && { translations }),
        ...(dimensions !== undefined && { dimensions }),
      },
      include: {
        inventory: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Product with this SKU already exists' }, { status: 409 });
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if product has any orders
    const ordersWithProduct = await db.orderItem.count({
      where: { productId: params.id },
    });

    if (ordersWithProduct > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete product with existing orders. Consider hiding it instead.',
        },
        { status: 400 }
      );
    }

    // Delete inventory first (if exists)
    await db.inventory.deleteMany({
      where: { productId: params.id },
    });

    // Delete product
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
