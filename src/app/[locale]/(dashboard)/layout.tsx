'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, CalendarRange, ClipboardList, Users, Globe } from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { key: 'students', href: '/students', icon: Users },
  { key: 'parentBooking', href: '/booking', icon: CalendarRange },
  { key: 'teacherRoster', href: '/roster', icon: ClipboardList },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  // Switch locale manually without losing route context
  const handleLocaleChange = (newLocale: string) => {
    // Strip current locale prefix from pathname if present
    const cleanPath = pathname.replace(/^\/(en|id)/, '') || '/';
    router.push(`/${newLocale}${cleanPath}`);
  };

  // Get active path checks (stripped of locale prefix)
  const getCleanPath = (href: string) => {
    return `/${locale}${href}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 bg-teal-600 text-white rounded-xl shadow-md shadow-teal-600/10">
                <Sparkles className="w-5 h-5 fill-amber-300 stroke-teal-600" />
              </div>
              <div>
                <span className="font-display font-black text-lg tracking-tight bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                  ottodot
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 block -mt-1.5 ml-0.5">
                  Science & Math
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const targetPath = getCleanPath(item.href);
                const isActive = pathname === targetPath || pathname.startsWith(targetPath + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={targetPath}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>

            {/* Language Switcher & Profile */}
            <div className="flex items-center gap-4">
              {/* Modern Segmented Language Switcher EN | ID */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
                <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleLocaleChange('en')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      locale === 'en'
                        ? 'bg-white text-teal-700 shadow-xs font-extrabold ring-1 ring-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLocaleChange('id')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      locale === 'id'
                        ? 'bg-white text-teal-700 shadow-xs font-extrabold ring-1 ring-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ID
                  </button>
                </div>
              </div>

              {/* Simulated User Profile */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-700">{t('accountName')}</p>
                  <p className="text-[10px] font-medium text-teal-600">{t('accountRole')}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center font-display font-bold text-amber-700 text-sm shadow-2xs">
                  MP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="grid grid-cols-3 text-center py-1">
            {navItems.map((item) => {
              const targetPath = getCleanPath(item.href);
              const isActive = pathname === targetPath || pathname.startsWith(targetPath + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={targetPath}
                  className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold ${
                    isActive ? 'text-teal-600' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t(item.key)}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
