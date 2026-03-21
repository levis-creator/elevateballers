import { type ComponentType } from 'react';
import { useState, useEffect } from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const [icons, setIcons] = useState<{
    Home?: ComponentType<any>;
    ChevronRight?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Home: mod.Home,
        ChevronRight: mod.ChevronRight,
      });
    });
  }, []);

  const HomeIcon = icons.Home;
  const ChevronRightIcon = icons.ChevronRight;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center flex-wrap gap-2 list-none p-0 m-0">
        <li className="flex items-center gap-2">
          <a
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
            data-astro-prefetch
          >
            {HomeIcon ? <HomeIcon size={16} /> : null}
            <span>Dashboard</span>
          </a>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {ChevronRightIcon ? (
              <ChevronRightIcon size={16} className="text-muted-foreground flex-shrink-0" />
            ) : null}
            {item.href ? (
              <a
                href={item.href}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
                data-astro-prefetch
              >
                {item.label}
              </a>
            ) : (
              <span className="text-sm text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
