import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { clinicName, userName, email, password } = await req.json();

    if (!clinicName || !userName || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Generate Clinic Slug
    let slug = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingClinic = await prisma.clinic.findUnique({ where: { slug } });
    if (existingClinic) {
      slug = `${slug}-${Date.now()}`;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create Clinic and Admin User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          clinicId: clinic.id,
          name: userName,
          email,
          passwordHash,
          role: 'ADMIN',
        },
      });

      return { clinic, user };
    });

    // Sign Token
    const token = signToken({
      userId: result.user.id,
      clinicId: result.clinic.id,
      role: result.user.role,
    });

    const response = NextResponse.json({ success: true, clinicId: result.clinic.id });
    
    // Set HTTP-only cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
