import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(pl|en|uk|ru|hi|ar|zh)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
