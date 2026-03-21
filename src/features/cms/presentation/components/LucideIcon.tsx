import { ComponentType, lazy, Suspense } from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

// Lazy load icons to avoid SSR issues
const iconMap: Record<string, () => Promise<{ default: ComponentType<any> }>> = {};

export default function LucideIcon({ name, size = 20, className, color }: IconProps) {
  // Dynamically import the icon
  if (!iconMap[name]) {
    iconMap[name] = () => import('lucide-react').then((mod: any) => ({ default: mod[name] }));
  }

  const LazyIcon = lazy(iconMap[name]);

  return (
    <Suspense fallback={<span style={{ width: size, height: size, display: 'inline-block' }} />}>
      <LazyIcon size={size} className={className} color={color} />
    </Suspense>
  );
}

