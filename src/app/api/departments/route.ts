import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - pobieranie wszystkich działów
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeUserCount = url.searchParams.get('includeUserCount') === 'true';
    
    if (includeUserCount) {
      const departments = await prisma.department.findMany({
        orderBy: {
          name: 'asc'
        },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });
      
      // Transformuj wyniki, aby zawierały pole userCount
      const transformedDepartments = departments.map(dept => ({
        ...dept,
        userCount: dept._count.users,
        _count: undefined
      }));
      
      return NextResponse.json(transformedDepartments);
    } else {
      const departments = await prisma.department.findMany({
        orderBy: {
          name: 'asc'
        }
      });
      
      return NextResponse.json(departments);
    }
  } catch (error) {
    console.error('Błąd podczas pobierania działów:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania działów' },
      { status: 500 }
    );
  }
}

// POST - tworzenie nowego działu
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Sprawdź czy wszystkie wymagane pola są dostępne
    if (!data.name) {
      return NextResponse.json(
        { error: 'Nazwa działu jest wymagana' },
        { status: 400 }
      );
    }
    
    // Sprawdź czy dział o takiej nazwie już istnieje
    const existingDepartment = await prisma.department.findUnique({
      where: {
        name: data.name
      }
    });
    
    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Dział o takiej nazwie już istnieje' },
        { status: 409 }
      );
    }
    
    const department = await prisma.department.create({
      data: {
        name: data.name,
        color: data.color || '#808080' // Domyślny kolor, jeśli nie został podany
      }
    });
    
    return NextResponse.json(department);
  } catch (error) {
    console.error('Błąd podczas tworzenia działu:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia działu' },
      { status: 500 }
    );
  }
}

// PUT - aktualizacja działu
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name, color } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID działu jest wymagane' },
        { status: 400 }
      );
    }
    
    const departmentId = parseInt(id, 10);
    
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: 'ID działu musi być liczbą' },
        { status: 400 }
      );
    }
    
    if (!name) {
      return NextResponse.json(
        { error: 'Nazwa działu jest wymagana' },
        { status: 400 }
      );
    }
    
    // Sprawdź czy dział istnieje
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    
    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Dział o podanym ID nie istnieje' },
        { status: 404 }
      );
    }
    
    // Sprawdź czy nazwa jest już zajęta przez inny dział
    const departmentWithSameName = await prisma.department.findFirst({
      where: {
        name,
        id: { not: departmentId }
      }
    });
    
    if (departmentWithSameName) {
      return NextResponse.json(
        { error: 'Dział o takiej nazwie już istnieje' },
        { status: 400 }
      );
    }
    
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name,
        color: color || existingDepartment.color,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ success: true, data: updatedDepartment });
  } catch (error) {
    console.error('Błąd podczas aktualizacji działu:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji działu' },
      { status: 500 }
    );
  }
}

// DELETE - usunięcie działu
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    
    if (!idParam) {
      return NextResponse.json(
        { error: 'ID działu jest wymagane' },
        { status: 400 }
      );
    }
    
    const id = parseInt(idParam, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID działu musi być liczbą' },
        { status: 400 }
      );
    }
    
    // Sprawdź czy dział istnieje
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });
    
    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Dział o podanym ID nie istnieje' },
        { status: 404 }
      );
    }
    
    // Sprawdź czy są użytkownicy przypisani do tego działu
    const usersInDepartment = await prisma.user.count({
      where: { departmentId: id }
    });
    
    if (usersInDepartment > 0) {
      return NextResponse.json(
        { error: 'Nie można usunąć działu, do którego są przypisani użytkownicy' },
        { status: 400 }
      );
    }
    
    await prisma.department.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Dział został usunięty' });
  } catch (error) {
    console.error('Błąd podczas usuwania działu:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania działu' },
      { status: 500 }
    );
  }
} 