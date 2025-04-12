import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// Pobieranie pojedynczego zadania
export async function GET(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    // Bezpieczne uzyskanie ID z parametru zgodnie z nowym API Next.js
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id);
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        brand: {
          include: {
            client: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Zadanie nie zostało znalezione' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Błąd podczas pobierania zadania:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zadania' },
      { status: 500 }
    );
  }
}

// Aktualizacja zadania
export async function PUT(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    // Bezpieczne uzyskanie ID z parametru zgodnie z nowym API Next.js
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id);
    
    const data = await request.json();
    
    console.log('Dane zadania do aktualizacji:', JSON.stringify(data, null, 2));
    
    // Sprawdź, czy zadanie istnieje
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Zadanie nie zostało znalezione' },
        { status: 404 }
      );
    }
    
    // Konwersja priorytetu jeśli przesłano go jako string
    let preparedData = { ...data };
    
    if (typeof preparedData.priority === 'string') {
      let priorityValue = 2; // Domyślny priorytet (MEDIUM)
      if (preparedData.priority === 'HIGH') priorityValue = 1;
      else if (preparedData.priority === 'MEDIUM') priorityValue = 2;
      else if (preparedData.priority === 'LOW') priorityValue = 3;
      preparedData.priority = priorityValue;
    }
    
    // Konwersja identyfikatorów na liczby
    if (preparedData.brandId && typeof preparedData.brandId === 'string') {
      preparedData.brandId = parseInt(preparedData.brandId);
    }
    
    if (preparedData.createdById && typeof preparedData.createdById === 'string') {
      preparedData.createdById = parseInt(preparedData.createdById);
    }
    
    if (preparedData.assignedToId && typeof preparedData.assignedToId === 'string') {
      preparedData.assignedToId = parseInt(preparedData.assignedToId);
    }
    
    // Konwersja estimatedTime na liczbę zmiennoprzecinkową
    if (preparedData.estimatedTime && typeof preparedData.estimatedTime === 'string') {
      preparedData.estimatedTime = parseFloat(preparedData.estimatedTime);
    }
    
    // Konwersja daty
    if (preparedData.expiryDate && typeof preparedData.expiryDate === 'string') {
      preparedData.expiryDate = new Date(preparedData.expiryDate);
    }
    
    console.log('Dane przygotowane do zapisu:', JSON.stringify(preparedData, null, 2));
    
    // Aktualizacja zadania
    const updatedTask = await prisma.task.update({
      where: { id },
      data: preparedData,
      include: {
        brand: {
          include: {
            client: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Błąd podczas aktualizacji zadania:', error);
    // Bardziej szczegółowy komunikat o błędzie
    let errorMessage = 'Wystąpił błąd podczas aktualizacji zadania';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Stack trace:', error.stack);
      
      // Sprawdź typowe błędy Prisma
      if (error.message.includes('Foreign key constraint failed')) {
        errorMessage = 'Nieprawidłowe powiązania z innymi danymi (np. nieistniejąca marka lub użytkownik)';
      } else if (error.message.includes('Unique constraint failed')) {
        errorMessage = 'Naruszenie unikalności danych';
      } else if (error.message.includes('Invalid')) {
        errorMessage = 'Nieprawidłowy format danych: ' + error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Usuwanie zadania
export async function DELETE(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    // Bezpieczne uzyskanie ID z parametru zgodnie z nowym API Next.js
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id);
    
    // Sprawdź, czy zadanie istnieje
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Zadanie nie zostało znalezione' },
        { status: 404 }
      );
    }
    
    // Usuń najpierw wszystkie bloki harmonogramu powiązane z zadaniem
    await prisma.harmonogramBlock.deleteMany({
      where: { taskId: id }
    });
    
    // Usuń zadanie
    const deletedTask = await prisma.task.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      message: 'Zadanie zostało usunięte',
      id: deletedTask.id 
    });
  } catch (error) {
    console.error('Błąd podczas usuwania zadania:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania zadania' },
      { status: 500 }
    );
  }
} 