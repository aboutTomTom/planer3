import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    // Bezpieczne uzyskanie ID z parametru zgodnie z nowym API Next.js
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id);
    
    const data = await request.json();
    
    const block = await prisma.harmonogramBlock.update({
      where: { id },
      data: {
        userId: data.userId,
        date: new Date(data.date),
        allocatedTime: data.allocatedTime
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
    
    return NextResponse.json(block);
  } catch (error) {
    console.error('Błąd podczas aktualizacji bloku harmonogramu:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji bloku harmonogramu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    // Bezpieczne uzyskanie ID z parametru zgodnie z nowym API Next.js
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id);
    
    // Sprawdź, czy blok istnieje
    const block = await prisma.harmonogramBlock.findUnique({
      where: { id },
      include: {
        task: true
      }
    });
    
    if (!block) {
      return NextResponse.json(
        { error: 'Blok harmonogramu nie istnieje' },
        { status: 404 }
      );
    }
    
    // Usuń blok
    await prisma.harmonogramBlock.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Błąd podczas usuwania bloku harmonogramu:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania bloku harmonogramu' },
      { status: 500 }
    );
  }
} 