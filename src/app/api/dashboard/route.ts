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

    // Citas de hoy: Starts today between 00:00 and 23:59
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [totalPatients, appointmentsToday, recentAppointments] = await Promise.all([
      prisma.patient.count({
        where: { clinicId: session.clinicId }
      }),
      prisma.appointment.count({
        where: {
          clinicId: session.clinicId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      prisma.appointment.findMany({
        where: { clinicId: session.clinicId },
        orderBy: { startTime: 'desc' },
        take: 5,
        include: {
          patient: { select: { firstName: true, lastName: true } },
          dentist: { select: { name: true } }
        }
      })
    ]);

    return NextResponse.json({
      totalPatients,
      appointmentsToday,
      recentAppointments
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
