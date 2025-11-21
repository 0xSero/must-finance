import { NextResponse } from 'next/server';
import { getBlikClient } from '@/lib/blik';
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
      blikCode, // Optional: 6-digit BLIK code
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!customerEmail || !customerName || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
    }

    // Validate products and check stock
    const productIds = items.map((item: any) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate totals and validate stock
    let subtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.isVisible) {
        return NextResponse.json(
          { error: `Product ${item.productId} not available` },
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
        paymentMethod: 'BLIK',
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

    // Initialize BLIK payment
    const blikClient = getBlikClient();
    const blikPayment = await blikClient.registerTransaction({
      amount: subtotal,
      currency: 'PLN',
      description: `Order ${orderNumber}`,
      email: customerEmail,
      sessionId: order.id,
      urlReturn: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id=${order.id}`,
      urlStatus: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/blik/webhook`,
      blikCode,
    });

    // Update order with BLIK transaction ID
    await db.order.update({
      where: { id: order.id },
      data: { blikTransactionId: blikPayment.token },
    });

    return NextResponse.json({
      orderId: order.id,
      token: blikPayment.token,
      url: blikPayment.url,
      // If BLIK code was provided, process immediately
      requiresBlikCode: !blikCode,
    });
  } catch (error: any) {
    console.error('BLIK checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create BLIK payment' },
      { status: 500 }
    );
  }
}
