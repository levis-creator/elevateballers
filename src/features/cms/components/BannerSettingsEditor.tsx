import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { ImageIcon, X } from 'lucide-react';
import { usePermissions } from '@/features/rbac/usePermissions';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description: string | null;
  category: string | null;
}

export default function BannerSettingsEditor() {
  const { can } = usePermissions();
  const canManageSettings = can('site_settings:manage');

  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [isActive, setIsActive] = useState(false);
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#dd3333');
  const [textColor, setTextColor] = useState('#ffffff');
  const [imageUrl, setImageUrl] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  
  // UI state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'topbar' | 'header'>('topbar');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data: SiteSetting[] = await res.json();
        const settingsMap: Record<string, SiteSetting> = {};
        
        let foundActive = false;
        
        data.forEach(s => {
          settingsMap[s.key] = s;
          if (s.key === 'topbar_banner_active') {
            setIsActive(s.value === 'true');
            foundActive = true;
          }
          if (s.key === 'topbar_banner_text') setText(s.value);
          if (s.key === 'topbar_banner_link') setLink(s.value);
          if (s.key === 'topbar_banner_bg_color') setBackgroundColor(s.value);
          if (s.key === 'topbar_banner_text_color') setTextColor(s.value);
          if (s.key === 'topbar_banner_image_url') setImageUrl(s.value);
          if (s.key === 'header_banner_image_url') setHeaderImageUrl(s.value);
        });

        if (!foundActive && data.length > 0) {
          // It's possible the settings don't exist yet
        }
        
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string, label: string, type: string = 'text') => {
    const existing = settings[key];
    
    if (existing) {
      await fetch(`/api/settings/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
    } else {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value,
          label,
          type,
          category: 'appearance'
        })
      });
    }
  };

  const handleSave = async () => {
    if (!canManageSettings) {
      alert('You do not have permission to manage site settings.');
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        saveSetting('topbar_banner_active', isActive ? 'true' : 'false', 'Topbar Banner Active', 'boolean'),
        saveSetting('topbar_banner_text', text, 'Topbar Banner Text', 'text'),
        saveSetting('topbar_banner_link', link, 'Topbar Banner Link', 'text'),
        saveSetting('topbar_banner_bg_color', backgroundColor, 'Topbar Banner Background Color', 'color'),
        saveSetting('topbar_banner_text_color', textColor, 'Topbar Banner Text Color', 'color'),
        saveSetting('topbar_banner_image_url', imageUrl, 'Topbar Banner Background Image URL', 'text'),
        saveSetting('header_banner_image_url', headerImageUrl, 'Header Background Image URL', 'text'),
      ]);
      alert('Settings saved successfully!');
      fetchSettings(); // Refresh settings with IDs if newly created
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 font-heading text-gray-900 border-b pb-4">Top Banner Settings</h2>

      {!canManageSettings && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access to site settings. Contact an admin to make changes.
        </div>
      )}
      
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-md border border-gray-100">
          <Switch 
            id="banner-active" 
            checked={isActive} 
            onCheckedChange={setIsActive} 
            disabled={!canManageSettings}
          />
          <Label htmlFor="banner-active" className="text-base font-medium cursor-pointer">
            Enable Top Banner
          </Label>
        </div>

        {isActive && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="banner-text">Banner Text Message</Label>
              <Input 
                id="banner-text" 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                disabled={!canManageSettings}
                placeholder="e.g. Registration for Summer League is now open!" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-link">Optional Link URL (Leave empty for no link)</Label>
              <Input 
                id="banner-link" 
                value={link} 
                onChange={(e) => setLink(e.target.value)} 
                disabled={!canManageSettings}
                placeholder="e.g. /registration or https://example.com" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banner-bg">Background Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    id="banner-bg" 
                    value={backgroundColor} 
                    onChange={(e) => setBackgroundColor(e.target.value)} 
                    disabled={!canManageSettings}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    type="text" 
                    value={backgroundColor} 
                    onChange={(e) => setBackgroundColor(e.target.value)} 
                    disabled={!canManageSettings}
                    className="flex-1 uppercase"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="banner-text-color">Text Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    id="banner-text-color" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)} 
                    disabled={!canManageSettings}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    type="text" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)} 
                    disabled={!canManageSettings}
                    className="flex-1 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Image</Label>
              <div className="flex flex-col gap-4">
                {imageUrl ? (
                  <div className="relative w-full max-w-sm aspect-video rounded-lg border overflow-hidden group">
                    <img src={imageUrl} alt="Banner Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (!canManageSettings) return;
                          setMediaTarget('topbar');
                          setIsMediaPickerOpen(true);
                        }}
                        disabled={!canManageSettings}
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setImageUrl('')}
                        disabled={!canManageSettings}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-24 border-dashed"
                      onClick={() => {
                        if (!canManageSettings) return;
                        setMediaTarget('topbar');
                        setIsMediaPickerOpen(true);
                      }}
                      disabled={!canManageSettings}
                    >
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                        <span>Select Image</span>
                      </div>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      If no image is selected, the banner will use the local <code>/images/basketball-game-concept-scaled.jpg</code> as a fallback.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Label className="mb-2 block text-gray-500">Live Preview:</Label>
              <div 
                className="w-full py-2 px-4 text-center text-sm font-bold flex justify-center items-center rounded-sm relative overflow-hidden min-h-[40px]"
                style={{ backgroundColor, color: textColor }}
              >
                {/* Background Image Layer */}
                <div 
                  className="absolute inset-0 z-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url('${imageUrl || '/images/basketball-game-concept-scaled.jpg'}')`,
                    opacity: 0.3 // adjust opacity so text is readable
                  }}
                />
                <span className="truncate relative z-10">
                  {text || 'Banner text will appear here'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Background</h3>
          <div className="space-y-2">
            <Label>Header Background Image</Label>
            <div className="flex flex-col gap-4">
              {headerImageUrl ? (
                <div className="relative w-full max-w-sm aspect-video rounded-lg border overflow-hidden group">
                  <img src={headerImageUrl} alt="Header Background" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (!canManageSettings) return;
                        setMediaTarget('header');
                        setIsMediaPickerOpen(true);
                      }}
                      disabled={!canManageSettings}
                    >
                      Change
                    </Button>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setHeaderImageUrl('')}
                      disabled={!canManageSettings}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed"
                    onClick={() => {
                      if (!canManageSettings) return;
                      setMediaTarget('header');
                      setIsMediaPickerOpen(true);
                    }}
                    disabled={!canManageSettings}
                  >
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <span>Select Image</span>
                    </div>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    If no image is selected, the header will use the local <code>/images/Elevate_Patreon_Banner.png</code> as a fallback.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || !canManageSettings}
          className="w-full mt-6"
        >
          {saving ? 'Saving...' : 'Save Banner Settings'}
        </Button>
      </div>

      <MediaLibraryPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(url) => {
          if (mediaTarget === 'topbar') {
            setImageUrl(url);
          } else {
            setHeaderImageUrl(url);
          }
        }}
        title="Select Background Image"
      />
    </div>
  );
}
