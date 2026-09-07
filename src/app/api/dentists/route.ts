import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dentists = await prisma.user.findMany({
      where: { 
        clinicId: session.clinicId,
        role: { in: ['ADMIN', 'DENTIST'] }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json(dentists);
  } catch (error) {
    console.error("GET Dentists Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
