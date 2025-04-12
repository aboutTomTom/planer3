import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    let whereClause = {};
    
    if (clientId) {
      whereClause = {
        clientId: parseInt(clientId)
      };
    }
    
    const brands = await prisma.brand.findMany({
      where: whereClause,
      include: {
        client: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Błąd podczas pobierania marek:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania marek' },
      { status: 500 }
    );
  }
} 