import { useEffect, useState, type ComponentType } from 'react';

interface IconWrapperProps {
  iconName: string;
  size?: number;
  className?: string;
  color?: string;
}

export default function IconWrapper({ iconName, size = 20, className, color }: IconWrapperProps) {
  const [Icon, setIcon] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    // Dynamically import the icon only on the client
    import('lucide-react').then((icons: any) => {
      const IconComponent = icons[iconName];
      if (IconComponent) {
        setIcon(() => IconComponent);
      }
    }).catch((err) => {
      console.error(`Failed to load icon: ${iconName}`, err);
    });
  }, [iconName]);

  if (!Icon) {
    return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  }

  return <Icon size={size} className={className} color={color} />;
}

