import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const patient = await prisma.patient.findFirst({
      where: { 
        id: params.id,
        clinicId: session.clinicId // Security: ensure it belongs to this clinic
      },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          include: {
            dentist: {
              select: { name: true }
            }
          }
        },
        treatments: {
          orderBy: { createdAt: 'desc' },
          include: {
            dentist: { select: { name: true } }
          }
        },
        treatmentItems: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        clinicalEpisodes: {
          orderBy: { createdAt: 'desc' },
          take: 12,
          include: {
            dentist: {
              select: { name: true }
            },
            findings: {
              orderBy: { notedAt: 'desc' }
            },
            treatments: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        odontogramEntries: {
          orderBy: { createdAt: 'desc' },
          take: 12,
          include: {
            dentist: { select: { name: true } }
          }
        }
      }
    });

    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("GET Patient Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    // Check patient existence & clinic boundary
    const patientExists = await prisma.patient.findFirst({
      where: { id: params.id, clinicId: session.clinicId }
    });
    if (!patientExists) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const updatedPatient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        annotations: body.annotations !== undefined ? body.annotations : undefined
      }
    });

    return NextResponse.json({ success: true, patient: updatedPatient });
  } catch (error) {
    console.error("PUT Patient Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
