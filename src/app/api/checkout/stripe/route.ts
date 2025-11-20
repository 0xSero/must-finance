import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items,
      customerEmail,
      customerName,
      shippingAddress,
      billingAddress,
      userId,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!customerEmail || !customerName || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
    }

    // Validate all products and check stock
    const productIds = items.map((item: any) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock and calculate totals
    let subtotal = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (!product.isVisible) {
        return NextResponse.json(
          { error: `Product ${product.name} is not available` },
          { status: 400 }
        );
      }

      const availableQuantity = product.inventory?.quantity || 0;
      if (availableQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      subtotal += product.price * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'pln',
          product_data: {
            name: product.name,
            description: product.description.substring(0, 500),
            images: product.images.slice(0, 1),
            metadata: {
              productId: product.id,
              sku: product.sku,
            },
          },
          unit_amount: Math.round(product.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      });
    }

    // Create addresses in database
    const shippingAddressRecord = await db.address.create({
      data: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        company: shippingAddress.company,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
        userId: userId || null,
      },
    });

    const billingAddressRecord = billingAddress
      ? await db.address.create({
          data: {
            firstName: billingAddress.firstName,
            lastName: billingAddress.lastName,
            company: billingAddress.company,
            address1: billingAddress.address1,
            address2: billingAddress.address2,
            city: billingAddress.city,
            state: billingAddress.state,
            postalCode: billingAddress.postalCode,
            country: billingAddress.country,
            phone: billingAddress.phone,
            userId: userId || null,
          },
        })
      : shippingAddressRecord;

    // Create order
    const orderNumber = generateOrderNumber();
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        customerEmail,
        customerName,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'STRIPE_CARD',
        subtotal,
        tax: 0,
        shipping: 0,
        total: subtotal,
        currency: 'PLN',
        shippingAddressId: shippingAddressRecord.id,
        billingAddressId: billingAddressRecord.id,
        items: {
          create: items.map((item: any) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
              total: product.price * item.quantity,
            };
          }),
        },
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
      customer_email: customerEmail,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Update order with Stripe payment intent ID
    await db.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: session.id },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
