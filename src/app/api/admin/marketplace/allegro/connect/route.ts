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
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Store credentials securely (encrypted)
    // 2. Initiate OAuth flow with Allegro
    // 3. Return authorization URL

    return NextResponse.json({
      message: 'Allegro credentials saved. Connection will be established after OAuth.',
      // authUrl: 'https://allegro.pl/auth/oauth/authorize?...'
    });
  } catch (error) {
    console.error('Error connecting to Allegro:', error);
    return NextResponse.json({ error: 'Failed to connect to Allegro' }, { status: 500 });
  }
}
