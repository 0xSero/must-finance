import { NextResponse } from 'next/server';
import { getBlikClient } from '@/lib/blik';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify BLIK notification
    const blikClient = getBlikClient();
    const isValid = await blikClient.verifyTransaction(body);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
    }

    // Get order by session ID
    const order = await db.order.findUnique({
      where: { id: body.sessionId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status based on payment status
    if (body.statement === 'success') {
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          completedAt: new Date(),
        },
      });

      // Update inventory - deduct quantities and release reserved
      for (const item of order.items) {
        await db.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            reserved: {
              decrement: item.quantity,
            },
          },
        });
      }

      console.log(`BLIK payment successful for order ${order.orderNumber}`);
    } else if (body.statement === 'failure') {
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
        },
      });

      // Release reserved inventory
      for (const item of order.items) {
        await db.inventory.update({
          where: { productId: item.productId },
          data: {
            reserved: {
              decrement: item.quantity,
            },
          },
        });
      }

      console.log(`BLIK payment failed for order ${order.orderNumber}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('BLIK webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
