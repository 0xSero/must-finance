import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, reason, amount } = body;

    if (!orderId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify order belongs to user
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { refundRequests: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json({ error: 'Order has not been paid' }, { status: 400 });
    }

    // Check if refund already requested
    const existingRefund = order.refundRequests.find(
      (r) => r.status === 'PENDING' || r.status === 'APPROVED'
    );

    if (existingRefund) {
      return NextResponse.json(
        { error: 'Refund request already exists for this order' },
        { status: 400 }
      );
    }

    const refundRequest = await db.refundRequest.create({
      data: {
        orderId,
        userId: session.user.id,
        reason,
        amount: amount || order.total,
        status: 'PENDING',
      },
    });

    return NextResponse.json(refundRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating refund request:', error);
    return NextResponse.json({ error: 'Failed to create refund request' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const refunds = await db.refundRequest.findMany({
      where: { userId: session.user.id },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(refunds);
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    return NextResponse.json({ error: 'Failed to fetch refund requests' }, { status: 500 });
  }
}
