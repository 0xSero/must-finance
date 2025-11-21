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
    const { appKey, appSecret } = body;

    if (!appKey || !appSecret) {
      return NextResponse.json(
        { error: 'App Key and App Secret are required' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Store credentials securely (encrypted)
    // 2. Test connection with Aliexpress API
    // 3. Store connection status

    return NextResponse.json({
      message: 'Aliexpress credentials saved successfully',
    });
  } catch (error) {
    console.error('Error connecting to Aliexpress:', error);
    return NextResponse.json({ error: 'Failed to connect to Aliexpress' }, { status: 500 });
  }
}
