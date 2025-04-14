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

// POST - tworzenie nowej marki
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Sprawdź czy wszystkie wymagane pola są dostępne
    if (!data.name) {
      return NextResponse.json(
        { error: 'Nazwa marki jest wymagana' },
        { status: 400 }
      );
    }
    
    if (!data.clientId) {
      return NextResponse.json(
        { error: 'ID klienta jest wymagane' },
        { status: 400 }
      );
    }
    
    const clientId = parseInt(data.clientId, 10);
    
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'ID klienta musi być liczbą' },
        { status: 400 }
      );
    }
    
    // Sprawdź czy klient istnieje
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Klient o podanym ID nie istnieje' },
        { status: 404 }
      );
    }
    
    // Sprawdź czy marka o takiej nazwie już istnieje dla tego klienta
    const existingBrand = await prisma.brand.findFirst({
      where: {
        name: data.name,
        clientId: clientId
      }
    });
    
    if (existingBrand) {
      return NextResponse.json(
        { error: 'Marka o takiej nazwie już istnieje dla tego klienta' },
        { status: 409 }
      );
    }
    
    // Tworzenie nowej marki
    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        clientId: clientId,
        color: data.color || '#808080'
      }
    });
    
    return NextResponse.json(brand);
  } catch (error) {
    console.error('Błąd podczas tworzenia marki:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia marki' },
      { status: 500 }
    );
  }
}

// PUT - aktualizacja marki
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name, color, clientId } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID marki jest wymagane' },
        { status: 400 }
      );
    }
    
    const brandId = parseInt(id, 10);
    
    if (isNaN(brandId)) {
      return NextResponse.json(
        { error: 'ID marki musi być liczbą' },
        { status: 400 }
      );
    }
    
    if (!name) {
      return NextResponse.json(
        { error: 'Nazwa marki jest wymagana' },
        { status: 400 }
      );
    }
    
    // Sprawdź czy marka istnieje
    const existingBrand = await prisma.brand.findUnique({
      where: { id: brandId }
    });
    
    if (!existingBrand) {
      return NextResponse.json(
        { error: 'Marka o podanym ID nie istnieje' },
        { status: 404 }
      );
    }
    
    // Sprawdź czy nazwa jest zajęta przez inną markę tego samego klienta
    const newClientId = clientId ? parseInt(clientId, 10) : existingBrand.clientId;
    
    if (clientId && isNaN(newClientId)) {
      return NextResponse.json(
        { error: 'ID klienta musi być liczbą' },
        { status: 400 }
      );
    }
    
    const brandWithSameName = await prisma.brand.findFirst({
      where: {
        name,
        clientId: newClientId,
        id: { not: brandId }
      }
    });
    
    if (brandWithSameName) {
      return NextResponse.json(
        { error: 'Marka o takiej nazwie już istnieje dla tego klienta' },
        { status: 400 }
      );
    }
    
    // Jeśli zmieniamy klienta, sprawdź czy nowy klient istnieje
    if (clientId && newClientId !== existingBrand.clientId) {
      const newClient = await prisma.client.findUnique({
        where: { id: newClientId }
      });
      
      if (!newClient) {
        return NextResponse.json(
          { error: 'Nowy klient o podanym ID nie istnieje' },
          { status: 404 }
        );
      }
    }
    
    // Aktualizacja marki
    const updatedBrand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        name,
        color: color || existingBrand.color,
        clientId: newClientId,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ success: true, data: updatedBrand });
  } catch (error) {
    console.error('Błąd podczas aktualizacji marki:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji marki' },
      { status: 500 }
    );
  }
}

// DELETE - usunięcie marki
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    
    if (!idParam) {
      return NextResponse.json(
        { error: 'ID marki jest wymagane' },
        { status: 400 }
      );
    }
    
    const id = parseInt(idParam, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID marki musi być liczbą' },
        { status: 400 }
      );
    }
    
    // Sprawdź czy marka istnieje
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
      include: {
        tasks: true
      }
    });
    
    if (!existingBrand) {
      return NextResponse.json(
        { error: 'Marka o podanym ID nie istnieje' },
        { status: 404 }
      );
    }
    
    // Sprawdź czy marka ma powiązane zadania
    if (existingBrand.tasks && existingBrand.tasks.length > 0) {
      return NextResponse.json(
        { error: 'Nie można usunąć marki, która ma przypisane zadania' },
        { status: 400 }
      );
    }
    
    // Usunięcie marki
    await prisma.brand.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Marka została usunięta' });
  } catch (error) {
    console.error('Błąd podczas usuwania marki:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania marki' },
      { status: 500 }
    );
  }
} 