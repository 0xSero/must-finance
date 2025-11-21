import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sellerId, accessKey, secretKey } = body;

    if (!sellerId || !accessKey || !secretKey) {
      return NextResponse.json(
        { error: 'Seller ID, Access Key, and Secret Key are required' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Store credentials securely (encrypted)
    // 2. Test connection with Amazon SP-API
    // 3. Store connection status

    return NextResponse.json({
      message: 'Amazon credentials saved successfully',
    });
  } catch (error) {
    console.error('Error connecting to Amazon:', error);
    return NextResponse.json({ error: 'Failed to connect to Amazon' }, { status: 500 });
  }
}
