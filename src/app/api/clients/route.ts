import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        brands: true
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

// POST - tworzenie nowego klienta
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Sprawdź czy wszystkie wymagane pola są dostępne
    if (!data.name) {
      return NextResponse.json(
        { error: 'Nazwa klienta jest wymagana' },
        { status: 400 }
      );
    }
    
    // Tworzenie nowego klienta
    const client = await prisma.client.create({
      data: {
        name: data.name
      }
    });
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Błąd podczas tworzenia klienta:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia klienta' },
      { status: 500 }
    );
  }
}

// PUT - aktualizacja klienta
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID klienta jest wymagane' },
        { status: 400 }
      );
    }
    
    const clientId = parseInt(id, 10);
    
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'ID klienta musi być liczbą' },
        { status: 400 }
      );
    }
    
    if (!name) {
      return NextResponse.json(
        { error: 'Nazwa klienta jest wymagana' },
        { status: 400 }
      );
    }
    
    // Sprawdź czy klient istnieje
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Klient o podanym ID nie istnieje' },
        { status: 404 }
      );
    }
    
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ success: true, data: updatedClient });
  } catch (error) {
    console.error('Błąd podczas aktualizacji klienta:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji klienta' },
      { status: 500 }
    );
  }
}

// DELETE - usunięcie klienta
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    
    if (!idParam) {
      return NextResponse.json(
        { error: 'ID klienta jest wymagane' },
        { status: 400 }
      );
    }
    
    const id = parseInt(idParam, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID klienta musi być liczbą' },
        { status: 400 }
      );
    }
    
    // Sprawdź czy klient istnieje
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        brands: {
          include: {
            tasks: true
          }
        }
      }
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Klient o podanym ID nie istnieje' },
        { status: 404 }
      );
    }
    
    // Sprawdź czy marki klienta mają powiązane zadania
    let hasTasks = false;
    for (const brand of existingClient.brands) {
      if (brand.tasks && brand.tasks.length > 0) {
        hasTasks = true;
        break;
      }
    }
    
    if (hasTasks) {
      return NextResponse.json(
        { error: 'Nie można usunąć klienta, którego marki mają przypisane zadania' },
        { status: 400 }
      );
    }
    
    // Usunięcie klienta (kaskadowo usunie też marki)
    await prisma.client.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Klient został usunięty' });
  } catch (error) {
    console.error('Błąd podczas usuwania klienta:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania klienta' },
      { status: 500 }
    );
  }
} 