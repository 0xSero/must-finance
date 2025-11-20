'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';

export function ProductFilters() {
  const t = useTranslations();

  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys'];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('nav.categories')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox id={category} />
              <Label htmlFor={category} className="cursor-pointer text-sm font-normal">
                {category}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="price-1" />
            <Label htmlFor="price-1" className="cursor-pointer text-sm font-normal">
              Under 50 PLN
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-2" />
            <Label htmlFor="price-2" className="cursor-pointer text-sm font-normal">
              50 - 100 PLN
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-3" />
            <Label htmlFor="price-3" className="cursor-pointer text-sm font-normal">
              100 - 200 PLN
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-4" />
            <Label htmlFor="price-4" className="cursor-pointer text-sm font-normal">
              Over 200 PLN
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
