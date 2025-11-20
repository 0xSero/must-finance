import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error('No order ID in session metadata');
          break;
        }

        // Update order status
        const order = await db.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
            completedAt: new Date(),
          },
          include: {
            items: true,
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

        console.log(`Order ${order.orderNumber} paid successfully`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) break;

        // Mark order as cancelled and release reserved inventory
        const order = await db.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
          },
          include: {
            items: true,
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

        console.log(`Order ${order.orderNumber} expired`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
