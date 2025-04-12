import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unassignedOnly = searchParams.get('unassigned') === 'true';
    
    if (unassignedOnly) {
      // Pobierz zadania, które nie są przypisane do żadnego bloku harmonogramu
      const tasks = await prisma.task.findMany({
        where: {
          harmonogramBlocks: {
            none: {}
          }
        },
        include: {
          brand: {
            include: {
              client: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          priority: 'asc'
        }
      });
      
      return NextResponse.json(tasks);
    } else {
      // Standardowe pobieranie wszystkich zadań
      const tasks = await prisma.task.findMany({
        include: {
          brand: {
            include: {
              client: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              departmentId: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return NextResponse.json(tasks);
    }
  } catch (error) {
    console.error('Błąd podczas pobierania zadań:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zadań' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    console.log('Dane zadania do utworzenia:', JSON.stringify(data, null, 2));
    
    // Walidacja wymaganych pól
    if (!data.title) {
      return NextResponse.json({ error: 'Tytuł zadania jest wymagany' }, { status: 400 });
    }
    
    if (!data.brandId) {
      return NextResponse.json({ error: 'Marka jest wymagana' }, { status: 400 });
    }
    
    if (!data.estimatedTime) {
      return NextResponse.json({ error: 'Szacowany czas jest wymagany' }, { status: 400 });
    }
    
    if (!data.createdById) {
      return NextResponse.json({ error: 'Account jest wymagany' }, { status: 400 });
    }

    // Konwersja priorytetu z typu string na int zgodnie ze schematem bazy danych
    let priorityValue = 2; // Domyślny priorytet (MEDIUM)
    if (data.priority) {
      if (data.priority === 'HIGH') priorityValue = 1;
      else if (data.priority === 'MEDIUM') priorityValue = 2;
      else if (data.priority === 'LOW') priorityValue = 3;
    }

    // Przygotuj dane w formacie zgodnym ze schematem
    const taskData = {
      title: data.title,
      description: data.description || '',
      priority: priorityValue, // Używamy przekonwertowanej wartości liczbowej
      estimatedTime: parseFloat(data.estimatedTime),
      brandId: parseInt(data.brandId as string),
      createdById: parseInt(data.createdById as string),
      assignedToId: data.assignedToId ? parseInt(data.assignedToId as string) : null,
      expiryDate: data.endDate ? new Date(data.endDate) : null,
      notes: data.notes || '',
      links: data.links || ''
    };

    console.log('Dane przygotowane do zapisu:', JSON.stringify(taskData, null, 2));
    
    const task = await prisma.task.create({
      data: taskData,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Błąd podczas tworzenia zadania:', error);
    // Określ bardziej szczegółowy komunikat o błędzie
    let errorMessage = 'Wystąpił błąd podczas tworzenia zadania';
    
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