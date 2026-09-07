import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await context.params;
  const { id: patientId, itemId } = params;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Verify ownership and existence
    const existingItem = await prisma.treatmentItem.findFirst({
      where: {
        id: itemId,
        patientId: patientId,
        patient: {
          clinicId: session.clinicId
        }
      }
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Treatment item not found or unauthorized' }, { status: 404 });
    }

    const updatedItem = await prisma.treatmentItem.update({
      where: { id: itemId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("PATCH Treatment Item Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
