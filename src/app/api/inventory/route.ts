import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: any = {};

    if (lowStock) {
      where.quantity = {
        lte: db.$queryRaw`"lowStockThreshold"`,
      };
    }

    const inventory = await db.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            images: true,
          },
        },
      },
      orderBy: {
        quantity: 'asc',
      },
    });

    // Filter low stock items in application code since Prisma doesn't support column comparison in where clause
    const filteredInventory = lowStock
      ? inventory.filter((item) => item.quantity <= item.lowStockThreshold)
      : inventory;

    return NextResponse.json(filteredInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity, operation = 'set' } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const inventory = await db.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    let updatedInventory;

    if (operation === 'increment') {
      updatedInventory = await db.inventory.update({
        where: { productId },
        data: {
          quantity: {
            increment: quantity,
          },
          lastRestocked: new Date(),
        },
      });
    } else if (operation === 'decrement') {
      updatedInventory = await db.inventory.update({
        where: { productId },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });
    } else {
      updatedInventory = await db.inventory.update({
        where: { productId },
        data: {
          quantity,
          lastRestocked: new Date(),
        },
      });
    }

    return NextResponse.json(updatedInventory);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
