import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { patientId, toothNumber, surface, description, cost, status } = await req.json();

    if (!patientId || !description) {
      return NextResponse.json({ error: 'Campos requeridos vacíos' }, { status: 400 });
    }

    // Asegurar que el paciente sea de la clínica del usuario
    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId: session.clinicId } });
    if (!patient) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });

    const treatment = await prisma.treatment.create({
      data: {
        patientId,
        dentistId: session.userId,
        toothNumber,
        surface,
        description,
        cost: cost ? parseFloat(cost) : null,
        status: status || 'COMPLETED',
      }
    });

    return NextResponse.json({ success: true, treatment });
  } catch (error) {
    console.error("POST Treatment Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
