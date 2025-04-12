'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaCalendarAlt, FaTasks, FaCog } from 'react-icons/fa';
import { useOffline } from '@/lib/context/OfflineContext';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathFromRouter = usePathname();
  const [pathname, setPathname] = useState<string | null>(null);
  const { isOnline, isPendingChanges, synchronizeChanges, pendingChangesCount } = useOffline();

  // Ustawienie ścieżki tylko po stronie klienta, aby uniknąć problemów z hydratacją
  useEffect(() => {
    setPathname(pathFromRouter);
  }, [pathFromRouter]);

  const handleSynchronize = async () => {
    await synchronizeChanges();
  };

  const navItems = [
    { href: '/harmonogram', label: 'Harmonogram', icon: FaCalendarAlt },
    { href: '/zadania', label: 'Zadania', icon: FaTasks },
    { href: '/ustawienia', label: 'Ustawienia', icon: FaCog },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Nagłówek */}
      <header className="bg-white shadow-sm z-10">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">Planer</h1>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  // Użyj domyślnego stanu dla pierwszego renderowania
                  const isActive = pathname ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                        isActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      )}
                    >
                      <item.icon className="mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center">
              {!isOnline && (
                <div className="mr-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  Tryb offline
                </div>
              )}
              {isPendingChanges && (
                <button
                  onClick={handleSynchronize}
                  disabled={!isOnline}
                  className={clsx(
                    'inline-flex items-center px-3 py-1 rounded-full text-sm',
                    isOnline 
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Synchronizuj zmiany ({pendingChangesCount})
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobilne */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around">
          {navItems.map((item) => {
            // Użyj domyślnego stanu dla pierwszego renderowania
            const isActive = pathname ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center py-2 px-3',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                <item.icon className="text-lg" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Główna zawartość */}
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-16 sm:pb-6">
        {children}
      </main>
    </div>
  );
} 