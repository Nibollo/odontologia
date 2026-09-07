import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { status, notes, startTime, endTime, dentistId } = body;

    // Verify ownership
    const existing = await prisma.appointment.findFirst({
      where: { id, clinicId: session.clinicId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        dentistId: dentistId || undefined,
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        dentist: { select: { name: true } }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH Appointment Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify ownership
    const existing = await prisma.appointment.findFirst({
      where: { id, clinicId: session.clinicId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    await prisma.appointment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Appointment Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
