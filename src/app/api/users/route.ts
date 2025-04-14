import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { UserRole } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - pobieranie wszystkich użytkowników
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Błąd podczas pobierania użytkowników:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania użytkowników' },
      { status: 500 }
    );
  }
}

// POST - tworzenie nowego użytkownika
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Walidacja podstawowych pól
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json(
        { error: 'Nazwa, email i hasło są wymagane' },
        { status: 400 }
      );
    }
    
    // Sprawdzenie czy użytkownik o podanym emailu już istnieje
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Użytkownik o podanym adresie email już istnieje' },
        { status: 409 }
      );
    }
    
    // Walidacja departmentId jeśli podano
    if (data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: parseInt(data.departmentId, 10) }
      });
      
      if (!department) {
        return NextResponse.json(
          { error: 'Wskazany dział nie istnieje' },
          { status: 400 }
        );
      }
    }
    
    // Utworzenie nowego użytkownika
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, // Uwaga: w produkcji hasło powinno być zaszyfrowane!
        role: data.role || 'EDITOR',
        departmentId: data.departmentId ? parseInt(data.departmentId, 10) : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
    
    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Błąd podczas tworzenia użytkownika:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia użytkownika' },
      { status: 500 }
    );
  }
}

// PUT - aktualizacja użytkownika
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Walidacja ID
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID użytkownika jest wymagane' },
        { status: 400 }
      );
    }
    
    const userId = parseInt(data.id, 10);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID użytkownika musi być liczbą' },
        { status: 400 }
      );
    }
    
    // Sprawdzenie czy użytkownik istnieje
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Użytkownik o podanym ID nie istnieje' },
        { status: 404 }
      );
    }
    
    // Sprawdzenie unikalności emaila jeśli jest zmieniany
    if (data.email && data.email !== existingUser.email) {
      const userWithSameEmail = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (userWithSameEmail) {
        return NextResponse.json(
          { error: 'Podany adres email jest już używany przez innego użytkownika' },
          { status: 409 }
        );
      }
    }
    
    // Walidacja departmentId jeśli jest zmieniany
    let departmentId = existingUser.departmentId;
    if (data.departmentId !== undefined) {
      if (data.departmentId === null) {
        departmentId = null;
      } else {
        const deptId = parseInt(data.departmentId, 10);
        if (isNaN(deptId)) {
          return NextResponse.json(
            { error: 'ID działu musi być liczbą' },
            { status: 400 }
          );
        }
        
        const department = await prisma.department.findUnique({
          where: { id: deptId }
        });
        
        if (!department) {
          return NextResponse.json(
            { error: 'Wskazany dział nie istnieje' },
            { status: 400 }
          );
        }
        
        departmentId = deptId;
      }
    }
    
    // Aktualizacja użytkownika
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? data.name : existingUser.name,
        email: data.email !== undefined ? data.email : existingUser.email,
        role: data.role !== undefined ? data.role : existingUser.role,
        departmentId: departmentId,
        password: data.password !== undefined ? data.password : undefined // Uwaga: w produkcji hasło powinno być zaszyfrowane!
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Błąd podczas aktualizacji użytkownika:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji użytkownika' },
      { status: 500 }
    );
  }
}

// DELETE - usunięcie użytkownika
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    
    if (!idParam) {
      return NextResponse.json(
        { error: 'ID użytkownika jest wymagane' },
        { status: 400 }
      );
    }
    
    const id = parseInt(idParam, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID użytkownika musi być liczbą' },
        { status: 400 }
      );
    }
    
    // Sprawdź czy użytkownik istnieje
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Użytkownik o podanym ID nie istnieje' },
        { status: 404 }
      );
    }
    
    // Sprawdź czy użytkownik ma przypisane zadania
    const assignedTasksCount = await prisma.task.count({
      where: { assignedToId: id }
    });
    
    if (assignedTasksCount > 0) {
      return NextResponse.json(
        { error: 'Nie można usunąć użytkownika, który ma przypisane zadania' },
        { status: 400 }
      );
    }
    
    // Usuń użytkownika
    await prisma.user.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Użytkownik został usunięty' });
  } catch (error) {
    console.error('Błąd podczas usuwania użytkownika:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania użytkownika' },
      { status: 500 }
    );
  }
} 