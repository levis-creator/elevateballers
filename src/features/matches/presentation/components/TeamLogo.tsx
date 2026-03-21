import { useState } from 'react';
import { getTeamInitials } from '../../lib/team-helpers';

interface TeamLogoProps {
  logo: string | null | undefined;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
}

export default function TeamLogo({ logo, name, size = 'md', className = '' }: TeamLogoProps) {
  const [error, setError] = useState(false);
  const initials = getTeamInitials(name);

  const getPlaceholderStyle = () => {
    switch (size) {
      case 'xs': return { width: '20px', height: '20px', fontSize: '0.625rem' };
      case 'sm': return { width: '24px', height: '24px', fontSize: '0.7rem' };
      case 'md': return { width: '40px', height: '40px', fontSize: '0.875rem' };
      case 'lg': return { width: '60px', height: '60px', fontSize: '1.25rem' };
      case 'xl': return { width: '120px', height: '120px', fontSize: '2.5rem' };
      default: return {};
    }
  };

  if (!logo || error) {
    return (
      <div 
        className={`team-logo-placeholder ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          fontWeight: '800',
          borderRadius: '50%',
          border: size === 'xl' ? '4px solid #e2e8f0' : '2px solid #e2e8f0',
          textTransform: 'uppercase',
          flexShrink: 0,
          ...getPlaceholderStyle()
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={name}
      className={className}
      onError={() => setError(true)}
      style={size !== 'custom' ? getPlaceholderStyle() : { objectFit: 'contain' }}
    />
  );
}
