// Force recompile - Total rewrite
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import {
  buildDetailedTreatmentPlan_V2,
  extractClinicalFindingsFromSnapshot,
  summarizeClinicalEpisode,
} from '@/components/clinical/odontogramState';
import type { OdontogramSnapshot } from '@/components/clinical/types';

interface OdontogramUpdateBody {
  state?: unknown;
  summary?: unknown;
  note?: string;
  label?: string;
}

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  return token ? verifyToken(token) : null;
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as OdontogramUpdateBody;
    if (!body.state || typeof body.state !== 'object') {
      return NextResponse.json({ error: 'Odontogram state is required' }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        clinicId: session.clinicId,
      },
      select: {
        id: true,
        odontogramState: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const incomingState = body.state as Prisma.InputJsonValue;
    const incomingSummary = (body.summary ?? undefined) as Prisma.InputJsonValue | undefined;
    const snapshot = body.state as OdontogramSnapshot;
    
    // Process clinical intelligence
    const findings = extractClinicalFindingsFromSnapshot(snapshot);
    const suggestedTreatments = buildDetailedTreatmentPlan_V2(findings);
    const episodeSummary = summarizeClinicalEpisode(snapshot, findings, suggestedTreatments) as Prisma.InputJsonValue;

    const result = await prisma.$transaction(async (tx) => {
      const updatedPatient = await tx.patient.update({
        where: { id: params.id },
        data: {
          odontogramState: incomingState,
          odontogramSummary: incomingSummary,
          odontogramUpdatedAt: new Date(),
        },
      });

      const entry = await tx.odontogramEntry.create({
        data: {
          patientId: params.id,
          dentistId: session.userId,
          label: body.label?.trim() || 'Actualización clínica',
          note: body.note?.trim() || null,
          summary: incomingSummary,
          state: incomingState,
        },
        include: {
          dentist: { select: { name: true } },
        },
      });

      const episode = await tx.clinicalEpisode.create({
        data: {
          patientId: params.id,
          dentistId: session.userId,
          type: 'EXAM',
          title: body.label?.trim() || 'Consulta clinica',
          note: body.note?.trim() || null,
          snapshot: incomingState,
          summary: incomingSummary ?? episodeSummary,
          findings: {
            create: findings.map((f) => ({
              patientId: params.id,
              toothNumber: f.toothNumber ?? null,
              surfaceCode: f.surfaceCode ?? null,
              scope: f.scope,
              code: f.code,
              label: f.label,
              category: f.category,
              severity: f.severity ?? null,
              status: f.status,
              payload: (f.payload ?? undefined) as Prisma.InputJsonValue | undefined,
            })),
          },
          treatments: {
            create: suggestedTreatments.map((t) => ({
              patientId: params.id,
              dentistId: session.userId,
              toothNumber: t.toothNumber ?? null,
              surfaceCode: t.surfaceCode ?? null,
              diagnosisCode: t.diagnosisCode ?? null,
              title: t.title,
              description: t.description ?? null,
              status: t.status,
              estimatedCost: t.estimatedCost ?? null,
              actualCost: t.actualCost ?? null,
              completedAt: t.completedAt ? new Date(t.completedAt) : null,
            })),
          },
        },
        include: {
          dentist: { select: { name: true } },
          findings: true,
          treatments: true,
        },
      });

      return { updatedPatient, entry, episode };
    });

    return NextResponse.json({
      success: true,
      patient: result.updatedPatient,
      entry: result.entry,
      episode: result.episode,
    });
  } catch (error) {
    console.error('PUT Odontogram Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
