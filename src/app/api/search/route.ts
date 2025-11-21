import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      isVisible: true,
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
            { sku: { contains: query, mode: 'insensitive' } },
          ],
        },
        {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
        },
      ],
    };

    if (category) {
      where.category = category;
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      default:
        // Relevance - prioritize name matches over description
        orderBy = { name: 'asc' };
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
        include: {
          inventory: true,
        },
      }),
      db.product.count({ where }),
    ]);

    // Get unique categories from results for filtering
    const categories = await db.product.findMany({
      where: {
        isVisible: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } },
        ],
      },
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      products,
      total,
      limit,
      offset,
      query,
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
