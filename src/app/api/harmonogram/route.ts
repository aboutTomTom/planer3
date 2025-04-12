import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let weekStart = searchParams.get('week');
    
    let startDate: Date;
    let endDate: Date;
    
    if (weekStart) {
      // Jeśli podano konkretny tydzień
      startDate = startOfWeek(parseISO(weekStart), { weekStartsOn: 1 });
      endDate = endOfWeek(startDate, { weekStartsOn: 1 });
    } else {
      // Jeśli nie podano tygodnia, użyj bieżącego
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      endDate = endOfWeek(startDate, { weekStartsOn: 1 });
    }
    
    const blocks = await prisma.harmonogramBlock.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        task: {
          include: {
            brand: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      },
      orderBy: [
        { userId: 'asc' },
        { date: 'asc' }
      ]
    });

    return NextResponse.json(blocks);
  } catch (error) {
    console.error('Błąd podczas pobierania bloków harmonogramu:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania bloków harmonogramu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Sprawdź, czy blok nie jest już zablokowany przez innego użytkownika
    if (data.taskId && data.userId && data.date) {
      const existingBlock = await prisma.harmonogramBlock.findUnique({
        where: {
          taskId_userId_date: {
            taskId: data.taskId,
            userId: data.userId,
            date: new Date(data.date)
          }
        }
      });
      
      if (existingBlock && existingBlock.isLocked && existingBlock.lockedUntil && new Date(existingBlock.lockedUntil) > new Date()) {
        return NextResponse.json(
          { error: 'Ten blok jest obecnie zablokowany przez innego użytkownika' },
          { status: 403 }
        );
      }
    }
    
    // Utwórz nowy blok
    const block = await prisma.harmonogramBlock.create({
      data: {
        ...data,
        date: new Date(data.date)
      },
      include: {
        task: {
          include: {
            brand: true
          }
        },
        user: true
      }
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error('Błąd podczas tworzenia bloku harmonogramu:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia bloku harmonogramu' },
      { status: 500 }
    );
  }
} 