import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const cartItem = await db.cartItem.findUnique({
      where: { id: params.id },
      include: { product: { include: { inventory: true } } },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    const availableQuantity = cartItem.product.inventory?.quantity || 0;
    const currentReserved = cartItem.quantity;
    const quantityDiff = quantity - currentReserved;

    if (quantity > 0 && availableQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock', availableQuantity },
        { status: 400 }
      );
    }

    if (quantity === 0) {
      // Remove from cart
      await db.cartItem.delete({ where: { id: params.id } });

      // Release reserved inventory
      await db.inventory.update({
        where: { productId: cartItem.productId },
        data: {
          reserved: {
            decrement: currentReserved,
          },
        },
      });

      return NextResponse.json({ message: 'Item removed from cart' });
    }

    // Update cart item
    const updatedCartItem = await db.cartItem.update({
      where: { id: params.id },
      data: { quantity },
      include: { product: true },
    });

    // Update reserved inventory
    await db.inventory.update({
      where: { productId: cartItem.productId },
      data: {
        reserved: {
          increment: quantityDiff,
        },
      },
    });

    return NextResponse.json(updatedCartItem);
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const cartItem = await db.cartItem.findUnique({
      where: { id: params.id },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await db.cartItem.delete({ where: { id: params.id } });

    // Release reserved inventory
    await db.inventory.update({
      where: { productId: cartItem.productId },
      data: {
        reserved: {
          decrement: cartItem.quantity,
        },
      },
    });

    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  }
}
