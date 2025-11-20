'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Menu, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from './language-switcher';
import { useCartStore } from '@/store/cart-store';

function CartBadge() {
  const totalItems = useCartStore((state) => state.getTotalItems());

  if (totalItems === 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
      {totalItems}
    </span>
  );
}

export function Header() {
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">{t('common.appName')}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/products" className="text-sm font-medium hover:text-primary">
            {t('nav.shop')}
          </Link>
          <Link href="/categories" className="text-sm font-medium hover:text-primary">
            {t('nav.categories')}
          </Link>
          <Link href="/deals" className="text-sm font-medium hover:text-primary">
            {t('nav.deals')}
          </Link>
          <Link href="/support" className="text-sm font-medium hover:text-primary">
            {t('common.support')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              <CartBadge />
            </Button>
          </Link>

          <Link href="/account">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container mx-auto flex flex-col gap-4 p-4">
            <Link
              href="/products"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.shop')}
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.categories')}
            </Link>
            <Link
              href="/deals"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.deals')}
            </Link>
            <Link
              href="/support"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.support')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
