import { 
  LayoutDashboard, 
  Newspaper, 
  Calendar, 
  Users, 
  Images, 
  FileText, 
  Settings, 
  ExternalLink, 
  LogOut,
  Basketball
} from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function AdminIcon({ name, size = 20, className = '' }: IconProps) {
  const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    'dashboard': LayoutDashboard,
    'newspaper': Newspaper,
    'calendar': Calendar,
    'users': Users,
    'images': Images,
    'file-text': FileText,
    'settings': Settings,
    'external-link': ExternalLink,
    'log-out': LogOut,
    'basketball': Basketball,
  };

  const IconComponent = icons[name];
  if (!IconComponent) return null;

  return <IconComponent size={size} className={className} />;
}

