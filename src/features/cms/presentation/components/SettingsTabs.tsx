import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, PhoneIcon, InfoIcon, BookOpenIcon, TrophyIcon, HomeIcon, SearchIcon } from 'lucide-react';
import { PermissionProvider } from '@/features/rbac/usePermissions';
import BannerSettingsEditor from './BannerSettingsEditor';
import ContactSettingsEditor from './ContactSettingsEditor';
import AboutPageEditor from './AboutPageEditor';
import HomepageIntroEditor from './HomepageIntroEditor';
import SeoSettingsEditor from './SeoSettingsEditor';
import RulesSettingsEditor from './RulesSettingsEditor';
import MatchSettingsEditor from './MatchSettingsEditor';

type Tab = 'header' | 'contact' | 'homepage' | 'seo' | 'about' | 'rules' | 'matches';

const NAV_ITEMS: { value: Tab; label: string; Icon: React.ElementType }[] = [
  { value: 'header',   label: 'Header',           Icon: ImageIcon    },
  { value: 'contact',  label: 'Contact & Social', Icon: PhoneIcon    },
  { value: 'homepage', label: 'Homepage Intro',   Icon: HomeIcon     },
  { value: 'seo',      label: 'SEO',              Icon: SearchIcon   },
  { value: 'about',    label: 'About Page',       Icon: InfoIcon     },
  { value: 'rules',    label: 'Rules Page',       Icon: BookOpenIcon },
  { value: 'matches',  label: 'Matches',          Icon: TrophyIcon   },
];

export default function SettingsTabs() {
  const [active, setActive] = useState<Tab>('header');

  return (
    // Single PermissionProvider shared by all editors — one /api/auth/me request total
    <PermissionProvider>
      {/* Mobile: horizontal scrollable strip. lg+: vertical sidebar beside content */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-start">
        <nav className="flex overflow-x-auto gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1.5 lg:flex-col lg:w-48 lg:shrink-0 lg:overflow-x-visible">
          {NAV_ITEMS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActive(value)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                'lg:w-full lg:justify-start',
                active === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content panel — only the active editor is mounted */}
        <div className="flex-1 min-w-0">
          {active === 'header'   && <BannerSettingsEditor />}
          {active === 'contact'  && <ContactSettingsEditor />}
          {active === 'homepage' && <HomepageIntroEditor />}
          {active === 'seo'      && <SeoSettingsEditor />}
          {active === 'about'    && <AboutPageEditor />}
          {active === 'rules'    && <RulesSettingsEditor />}
          {active === 'matches'  && <MatchSettingsEditor />}
        </div>
      </div>
    </PermissionProvider>
  );
}
