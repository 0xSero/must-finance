import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      quantity,
      lowStockThreshold,
      reorderPoint,
      reorderQuantity,
      supplierName,
      supplierSku,
      supplierUrl,
      autoReorder,
    } = body;

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if inventory already exists
    const existingInventory = await db.inventory.findUnique({
      where: { productId: params.id },
    });

    if (existingInventory) {
      return NextResponse.json(
        { error: 'Inventory already exists for this product. Use PATCH to update.' },
        { status: 409 }
      );
    }

    // Create inventory
    const inventory = await db.inventory.create({
      data: {
        productId: params.id,
        quantity: quantity || 0,
        lowStockThreshold: lowStockThreshold || 10,
        reorderPoint: reorderPoint || 5,
        reorderQuantity: reorderQuantity || 50,
        supplierName,
        supplierSku,
        supplierUrl,
        autoReorder: autoReorder || false,
      },
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory:', error);
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 });
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
      quantity,
      lowStockThreshold,
      reorderPoint,
      reorderQuantity,
      supplierName,
      supplierSku,
      supplierUrl,
      autoReorder,
    } = body;

    // Check if inventory exists
    const existingInventory = await db.inventory.findUnique({
      where: { productId: params.id },
    });

    if (!existingInventory) {
      // Create if doesn't exist
      const inventory = await db.inventory.create({
        data: {
          productId: params.id,
          quantity: quantity || 0,
          lowStockThreshold: lowStockThreshold || 10,
          reorderPoint: reorderPoint || 5,
          reorderQuantity: reorderQuantity || 50,
          supplierName,
          supplierSku,
          supplierUrl,
          autoReorder: autoReorder || false,
        },
      });

      return NextResponse.json(inventory, { status: 201 });
    }

    // Update inventory
    const inventory = await db.inventory.update({
      where: { productId: params.id },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
        ...(reorderPoint !== undefined && { reorderPoint }),
        ...(reorderQuantity !== undefined && { reorderQuantity }),
        ...(supplierName !== undefined && { supplierName }),
        ...(supplierSku !== undefined && { supplierSku }),
        ...(supplierUrl !== undefined && { supplierUrl }),
        ...(autoReorder !== undefined && { autoReorder }),
      },
    });

    return NextResponse.json(inventory);
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
