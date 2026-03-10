'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, TrendingUp } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';

const navItems = [
  { name: 'HOME', href: '/' },
  { name: '시장분석', href: '/market-analysis' },
  { name: '특징주분석', href: '/featured-stocks' },
  { name: '종목분석', href: '/stock-analysis' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-amber-500" />
            <span className="text-xl font-bold tracking-tight text-white">
              Intell<span className="text-amber-500">ic</span>
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:block">
          <div className="ml-10 flex items-baseline space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 h-0.5 w-full bg-amber-500"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="-mr-2 flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-white/5 hover:text-white focus:outline-none"
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-white/10 bg-black">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
