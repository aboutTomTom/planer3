import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Błąd podczas pobierania klientów:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania klientów' },
      { status: 500 }
    );
  }
} 