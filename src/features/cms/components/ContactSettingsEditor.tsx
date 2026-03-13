import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [contactRes, socialRes] = await Promise.all([
        fetch('/api/settings?category=contact'),
        fetch('/api/settings?category=social'),
      ]);

      const contactData: SiteSetting[] = contactRes.ok ? await contactRes.json() : [];
      const socialData: SiteSetting[] = socialRes.ok ? await socialRes.json() : [];

      const data = [...contactData, ...socialData];
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

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-2 font-heading text-gray-900">Contact & Social</h2>
      <p className="text-sm text-gray-500 mb-6 border-b pb-4">
        Update the public contact info and social links used across the site.
      </p>

      {!canManage && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access to site settings. Contact an admin to make changes.
        </div>
      )}

      <div className="space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Contact Info</h3>

          <div className="space-y-2">
            <Label htmlFor="contact-address">Address</Label>
            <Textarea
              id="contact-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!canManage}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!canManage}
                placeholder="e.g. +1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-fax">Fax / Secondary Phone</Label>
              <Input
                id="contact-fax"
                value={fax}
                onChange={(e) => setFax(e.target.value)}
                disabled={!canManage}
                placeholder="e.g. +1 (555) 000-0001"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!canManage}
                placeholder="info@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-hours">Hours</Label>
              <Input
                id="contact-hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                disabled={!canManage}
                placeholder="e.g. Mon-Fri 9am - 5pm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>

          <div className="space-y-2">
            <Label htmlFor="social-facebook">Facebook</Label>
            <Input
              id="social-facebook"
              type="url"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              disabled={!canManage}
              placeholder="https://facebook.com/yourpage"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social-instagram">Instagram</Label>
            <Input
              id="social-instagram"
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              disabled={!canManage}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social-twitter">Twitter/X</Label>
            <Input
              id="social-twitter"
              type="url"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              disabled={!canManage}
              placeholder="https://twitter.com/yourhandle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social-youtube">YouTube</Label>
            <Input
              id="social-youtube"
              type="url"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              disabled={!canManage}
              placeholder="https://youtube.com/yourchannel"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !canManage}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Contact Settings'}
        </Button>
      </div>
    </div>
  );
}
