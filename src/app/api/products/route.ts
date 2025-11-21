import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const includeInventory = searchParams.get('includeInventory') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    // Only filter by visibility if includeHidden is false (default behavior)
    if (!includeHidden) {
      where.isVisible = true;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          inventory: includeInventory,
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      isVisible = true,
      isFeatured = false,
      metaTitle,
      metaDescription,
      translations,
      inventory,
    } = body;

    // Validate required fields
    if (!name || !description || !price || !sku || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price, sku, category' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug =
      name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-') +
      '-' +
      Date.now();

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price,
        compareAtPrice,
        sku,
        barcode,
        images: images || [],
        category,
        tags: tags || [],
        isVisible,
        isFeatured,
        metaTitle,
        metaDescription,
        translations,
        inventory: inventory
          ? {
              create: {
                quantity: inventory.quantity || 0,
                lowStockThreshold: inventory.lowStockThreshold || 10,
                supplierName: inventory.supplierName,
                supplierSku: inventory.supplierSku,
                supplierUrl: inventory.supplierUrl,
                reorderQuantity: inventory.reorderQuantity || 50,
                autoReorder: inventory.autoReorder || false,
              },
            }
          : undefined,
      },
      include: {
        inventory: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Product with this SKU already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
