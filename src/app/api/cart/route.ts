import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// For now, we'll use session-based carts (guest checkout)
// Later integrate with NextAuth for user carts

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const cartItems = await db.cartItem.findMany({
      where: { sessionId },
      include: {
        product: {
          include: {
            inventory: true,
          },
        },
      },
    });

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, productId, quantity = 1 } = body;

    if (!sessionId || !productId) {
      return NextResponse.json({ error: 'Session ID and product ID required' }, { status: 400 });
    }

    // Check if product exists and has stock
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.isVisible) {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
    }

    const availableQuantity = product.inventory?.quantity || 0;
    if (availableQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock', availableQuantity },
        { status: 400 }
      );
    }

    // Check if item already in cart
    const existingCartItem = await db.cartItem.findUnique({
      where: {
        sessionId_productId: {
          sessionId,
          productId,
        },
      },
    });

    let cartItem;

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;

      if (availableQuantity < newQuantity) {
        return NextResponse.json(
          { error: 'Insufficient stock', availableQuantity },
          { status: 400 }
        );
      }

      cartItem = await db.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
        include: { product: true },
      });
    } else {
      cartItem = await db.cartItem.create({
        data: {
          sessionId,
          productId,
          quantity,
        },
        include: { product: true },
      });
    }

    // Reserve inventory
    await db.inventory.update({
      where: { productId },
      data: {
        reserved: {
          increment: quantity,
        },
      },
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}
