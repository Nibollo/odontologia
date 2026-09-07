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

    const appointments = await prisma.appointment.findMany({
      where: { clinicId: session.clinicId },
      include: {
        patient: {
          select: { firstName: true, lastName: true },
        },
        dentist: {
          select: { name: true },
        }
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { patientId, dentistId, startTime, endTime, notes } = await req.json();
    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);
    const finalDentistId = dentistId || session.userId;

    // Logic: Anti-solapamiento (Double-Booking)
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        dentistId: finalDentistId, 
        status: { not: 'CANCELLED' },
        AND: [
          { startTime: { lt: parsedEnd } },
          { endTime: { gt: parsedStart } }
        ]
      }
    });

    if (existingAppointment) {
      return NextResponse.json({ error: 'Horario ocupado. Ya hay otra cita en ese intervalo de tiempo para este Doctor.' }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: session.clinicId,
        patientId,
        dentistId: finalDentistId,
        startTime: parsedStart,
        endTime: parsedEnd,
        notes,
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
