import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

const ROLES: Role[] = ['ADMIN', 'DENTIST', 'ASSISTANT'];

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const users = await prisma.user.findMany({
      where: { clinicId: session.clinicId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET Users Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Sólo el ADMIN puede crear personal
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only ADMIN can create staff.' }, { status: 403 });
    }

    const { name, email, password, role } = await req.json() as {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
    };

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    // Comprobar si el email ya existe en toda la base (por diseño global de login)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        clinicId: session.clinicId,
        name,
        email,
        passwordHash,
        // The type for role comes from the Prisma enum 'Role' which we defined
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("POST Users Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
