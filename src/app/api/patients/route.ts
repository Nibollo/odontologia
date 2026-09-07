import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

interface PatientGeneralInfo {
  fluorideUse: string;
  visitReason: string;
  dentistVisitReason: string;
  lastDentalVisit: string;
  previousDentist: string;
  additionalInformation: string;
}

interface PatientMedicalInfo {
  cardiovascularDisease: boolean;
  alteredBloodPressure: boolean;
  pulmonaryDisease: boolean;
  bloodDisorder: boolean;
  gastrointestinalDisease: boolean;
  epilepsy: boolean;
  kidneyDisease: boolean;
  diabetes: boolean;
  liverDisease: boolean;
  drugAllergies: boolean;
  oncologicalHistory: boolean;
  pregnancy: boolean;
  immuneSystemDisease: boolean;
}

const GENERAL_INFO_KEYS = [
  'fluorideUse',
  'visitReason',
  'dentistVisitReason',
  'lastDentalVisit',
  'previousDentist',
  'additionalInformation',
] as const;

const MEDICAL_INFO_KEYS = [
  'cardiovascularDisease',
  'alteredBloodPressure',
  'pulmonaryDisease',
  'bloodDisorder',
  'gastrointestinalDisease',
  'epilepsy',
  'kidneyDisease',
  'diabetes',
  'liverDisease',
  'drugAllergies',
  'oncologicalHistory',
  'pregnancy',
  'immuneSystemDisease',
] as const;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const patients = await prisma.patient.findMany({
      where: { clinicId: session.clinicId },
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json(patients);
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

    const formData = await req.formData();
    const firstName = readText(formData, 'firstName');
    const lastName = readText(formData, 'lastName');
    const phone = readOptionalText(formData, 'phone');
    const documentId = readOptionalText(formData, 'documentId');

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Nombres y apellidos son obligatorios.' }, { status: 400 });
    }

    const upload = formData.get('profileAsset');
    const profileImagePath = isFileLike(upload) && upload.size > 0 ? await savePatientAsset(upload) : null;

    const generalInfo = GENERAL_INFO_KEYS.reduce<PatientGeneralInfo>((accumulator, key) => {
      accumulator[key] = readOptionalText(formData, key) ?? '';
      return accumulator;
    }, {
      fluorideUse: '',
      visitReason: '',
      dentistVisitReason: '',
      lastDentalVisit: '',
      previousDentist: '',
      additionalInformation: '',
    });

    const medicalInfo = MEDICAL_INFO_KEYS.reduce<PatientMedicalInfo>((accumulator, key) => {
      accumulator[key] = readBoolean(formData, key);
      return accumulator;
    }, {
      cardiovascularDisease: false,
      alteredBloodPressure: false,
      pulmonaryDisease: false,
      bloodDisorder: false,
      gastrointestinalDisease: false,
      epilepsy: false,
      kidneyDisease: false,
      diabetes: false,
      liverDisease: false,
      drugAllergies: false,
      oncologicalHistory: false,
      pregnancy: false,
      immuneSystemDisease: false,
    });

    const patientData = {
      clinicId: session.clinicId,
      firstName,
      lastName,
      phone,
      email: readOptionalText(formData, 'email'),
      birthDate: parseDate(readOptionalText(formData, 'birthDate')),
      gender: readOptionalText(formData, 'gender'),
      address: readOptionalText(formData, 'address'),
      city: readOptionalText(formData, 'city'),
      country: readOptionalText(formData, 'country') ?? 'Paraguay',
      isForeigner: readBoolean(formData, 'isForeigner'),
      familyDoctor: readOptionalText(formData, 'familyDoctor'),
      insuranceName: readOptionalText(formData, 'insuranceName'),
      communicationLanguage: readOptionalText(formData, 'communicationLanguage'),
      profileImagePath,
      documentType: readOptionalText(formData, 'documentType') ?? 'CEDULA',
      documentId,
      annotations: readOptionalText(formData, 'annotations'),
      generalInfo,
      medicalInfo,
    };

    const newPatient = await prisma.patient.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: patientData as any, // Temporary fix for complex Json types until Prisma types are fully synced
    });

    return NextResponse.json(newPatient);
  } catch (error) {
    console.error('POST Patient Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 },
    );
  }
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readBoolean(formData: FormData, key: string) {
  return readText(formData, key) === 'true';
}

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'arrayBuffer' in value &&
    'name' in value &&
    'size' in value,
  );
}

async function savePatientAsset(file: File) {
  const uploadDirectory = path.join(process.cwd(), 'public', 'uploads', 'patients');
  await mkdir(uploadDirectory, { recursive: true });

  const extension = path.extname(file.name) || '.bin';
  const fileName = `${Date.now()}-${randomUUID()}${extension.toLowerCase()}`;
  const filePath = path.join(uploadDirectory, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return `/uploads/patients/${fileName}`;
}
