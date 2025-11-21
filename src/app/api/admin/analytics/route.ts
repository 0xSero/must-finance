import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Get overview stats
    const [orders, totalCustomers, totalProducts] = await Promise.all([
      db.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
          paymentStatus: 'PAID',
        },
        select: {
          total: true,
          userId: true,
        },
      }),
      db.user.count(),
      db.product.count({
        where: {
          isVisible: true,
        },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get top selling products
    const topProducts = await db.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        price: true,
      },
      where: {
        order: {
          createdAt: {
            gte: startDate,
          },
          paymentStatus: 'PAID',
        },
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    // Get product names
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });

        return {
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          totalSold: item._sum.quantity || 0,
          revenue: (item._sum.price || 0) * (item._sum.quantity || 0),
        };
      })
    );

    // Get top customers
    const topCustomersData = await db.order.groupBy({
      by: ['userId'],
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
        paymentStatus: 'PAID',
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 10,
    });

    // Get customer details
    const topCustomers = await Promise.all(
      topCustomersData.map(async (item) => {
        const user = await db.user.findUnique({
          where: { id: item.userId },
          select: { name: true, email: true },
        });

        return {
          userId: item.userId,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || 'N/A',
          totalSpent: item._sum.total || 0,
          orderCount: item._count.id,
        };
      })
    );

    return NextResponse.json({
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalCustomers,
        totalProducts,
      },
      topProducts: topProductsWithNames,
      topCustomers,
      revenueByPeriod: [], // Can be implemented with more complex date grouping
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
