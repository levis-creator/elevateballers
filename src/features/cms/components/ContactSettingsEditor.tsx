import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

const DEFAULT_CONTACT = {
  address: 'Pepo Lane, off Dagoretti Road',
  phone: '0703913923',
  fax: '0729259496',
  email: 'ballers@elevateballers.com',
  hours: 'Sat-Sun 8am - 6pm',
};

const DEFAULT_SOCIAL = {
  facebook: 'https://www.facebook.com/Elevateballers',
  instagram: 'https://www.instagram.com/elevateballers/',
  twitter: 'https://twitter.com/elevateballers/',
  youtube: 'https://www.youtube.com/@elevateballers9389/featured',
};

export default function ContactSettingsEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');

  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [address, setAddress] = useState(DEFAULT_CONTACT.address);
  const [phone, setPhone] = useState(DEFAULT_CONTACT.phone);
  const [fax, setFax] = useState(DEFAULT_CONTACT.fax);
  const [email, setEmail] = useState(DEFAULT_CONTACT.email);
  const [hours, setHours] = useState(DEFAULT_CONTACT.hours);

  const [facebook, setFacebook] = useState(DEFAULT_SOCIAL.facebook);
  const [instagram, setInstagram] = useState(DEFAULT_SOCIAL.instagram);
  const [twitter, setTwitter] = useState(DEFAULT_SOCIAL.twitter);
  const [youtube, setYoutube] = useState(DEFAULT_SOCIAL.youtube);
  const [adminEmailNotificationsEnabled, setAdminEmailNotificationsEnabled] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [contactRes, socialRes, notificationRes] = await Promise.all([
        fetch('/api/settings?category=contact'),
        fetch('/api/settings?category=social'),
        fetch('/api/settings?category=notifications'),
      ]);

      const contactData: SiteSetting[] = contactRes.ok ? await contactRes.json() : [];
      const socialData: SiteSetting[] = socialRes.ok ? await socialRes.json() : [];
      const notificationData: SiteSetting[] = notificationRes.ok ? await notificationRes.json() : [];

      const data = [...contactData, ...socialData, ...notificationData];
      const map: Record<string, SiteSetting> = {};
      data.forEach((s) => {
        map[s.key] = s;
      });
      setSettings(map);

      const getValue = (key: string, fallback: string) =>
        Object.prototype.hasOwnProperty.call(map, key) ? map[key].value : fallback;

      setAddress(getValue('contact_address', DEFAULT_CONTACT.address));
      setPhone(getValue('contact_phone', DEFAULT_CONTACT.phone));
      setFax(getValue('contact_fax', DEFAULT_CONTACT.fax));
      setEmail(getValue('contact_email', DEFAULT_CONTACT.email));
      setHours(getValue('contact_hours', DEFAULT_CONTACT.hours));

      setFacebook(getValue('social_facebook', DEFAULT_SOCIAL.facebook));
      setInstagram(getValue('social_instagram', DEFAULT_SOCIAL.instagram));
      setTwitter(getValue('social_twitter', DEFAULT_SOCIAL.twitter));
      setYoutube(getValue('social_youtube', DEFAULT_SOCIAL.youtube));

      const notificationsEnabledValue = getValue('admin_email_notifications_enabled', 'true').toLowerCase();
      setAdminEmailNotificationsEnabled(notificationsEnabledValue !== 'false');
    } catch (error) {
      console.error('Error fetching contact settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string, label: string, type: string, category: string) => {
    const existing = settings[key];
    if (existing) {
      await fetch(`/api/settings/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } else {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, label, type, category }),
      });
    }
  };

  const handleSave = async () => {
    if (!canManage) {
      alert('You do not have permission to manage site settings.');
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        saveSetting('contact_address', address, 'Address', 'text', 'contact'),
        saveSetting('contact_phone', phone, 'Contact Phone', 'text', 'contact'),
        saveSetting('contact_fax', fax, 'Contact Fax', 'text', 'contact'),
        saveSetting('contact_email', email, 'Contact Email', 'email', 'contact'),
        saveSetting('contact_hours', hours, 'Contact Hours', 'text', 'contact'),
        saveSetting('social_facebook', facebook, 'Facebook URL', 'url', 'social'),
        saveSetting('social_instagram', instagram, 'Instagram URL', 'url', 'social'),
        saveSetting('social_twitter', twitter, 'Twitter/X URL', 'url', 'social'),
        saveSetting('social_youtube', youtube, 'YouTube URL', 'url', 'social'),
        saveSetting(
          'admin_email_notifications_enabled',
          adminEmailNotificationsEnabled ? 'true' : 'false',
          'Admin Email Notifications',
          'boolean',
          'notifications'
        ),
      ]);
      alert('Contact settings saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving contact settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading settings...</div>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">Contact & Social</h2>
          <p className="text-sm text-gray-500 mt-0.5">Public contact info and social links used across the site.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !canManage}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {!canManage && (
        <div className="mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access to site settings. Contact an admin to make changes.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        {/* Left: Contact Info */}
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contact Info</h3>

          <div className="space-y-1.5">
            <Label htmlFor="contact-address">Address</Label>
            <Textarea id="contact-address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={!canManage} rows={3} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input id="contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canManage} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-fax">Fax / Secondary</Label>
              <Input id="contact-fax" value={fax} onChange={(e) => setFax(e.target.value)} disabled={!canManage} placeholder="+1 (555) 000-0001" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canManage} placeholder="info@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-hours">Hours</Label>
              <Input id="contact-hours" value={hours} onChange={(e) => setHours(e.target.value)} disabled={!canManage} placeholder="Mon–Fri 9am–5pm" />
            </div>
          </div>
        </div>

        {/* Right: Social Links + Notifications */}
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Social Links</h3>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <Label htmlFor="social-facebook" className="w-20 shrink-0 text-sm text-gray-600">Facebook</Label>
              <Input id="social-facebook" type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} disabled={!canManage} placeholder="https://facebook.com/yourpage" />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="social-instagram" className="w-20 shrink-0 text-sm text-gray-600">Instagram</Label>
              <Input id="social-instagram" type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} disabled={!canManage} placeholder="https://instagram.com/yourhandle" />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="social-twitter" className="w-20 shrink-0 text-sm text-gray-600">Twitter / X</Label>
              <Input id="social-twitter" type="url" value={twitter} onChange={(e) => setTwitter(e.target.value)} disabled={!canManage} placeholder="https://twitter.com/yourhandle" />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="social-youtube" className="w-20 shrink-0 text-sm text-gray-600">YouTube</Label>
              <Input id="social-youtube" type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} disabled={!canManage} placeholder="https://youtube.com/yourchannel" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Notifications</h3>
            <div className="flex items-start justify-between gap-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <Label htmlFor="admin-email-notifications" className="text-sm font-medium">Admin email notifications</Label>
                <p className="text-xs text-gray-500 mt-0.5">Admins with the <code>notifications:email</code> permission receive email alerts.</p>
              </div>
              <Switch
                id="admin-email-notifications"
                checked={adminEmailNotificationsEnabled}
                onCheckedChange={(value) => setAdminEmailNotificationsEnabled(Boolean(value))}
                disabled={!canManage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
