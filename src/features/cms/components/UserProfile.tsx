import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { UserRole } from '../types';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [icons, setIcons] = useState<{
    User?: ComponentType<any>;
    Mail?: ComponentType<any>;
    Shield?: ComponentType<any>;
    Key?: ComponentType<any>;
    Save?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    AlertTriangle?: ComponentType<any>;
    Settings?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        User: mod.User,
        Mail: mod.Mail,
        Shield: mod.Shield,
        Key: mod.Key,
        Save: mod.Save,
        Trash2: mod.Trash2,
        AlertTriangle: mod.AlertTriangle,
        Settings: mod.Settings,
      });
    });

    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
          password: '',
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('An error occurred while loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully');
        const data = await response.json();
        setUser(data.user);
        setFormData((prev) => ({ ...prev, password: '' })); // Clear password
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/auth/me', {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.href = '/admin/login';
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete account');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('An error occurred while deleting account');
      setDeleting(false);
    }
  };

  const UserIcon = icons.User;
  const MailIcon = icons.Mail;
  const ShieldIcon = icons.Shield;
  const KeyIcon = icons.Key;
  const SaveIcon = icons.Save;
  const Trash2Icon = icons.Trash2;
  const AlertTriangleIcon = icons.AlertTriangle;
  const SettingsIcon = icons.Settings;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          {SettingsIcon ? <SettingsIcon size={14} /> : null}
          Settings
        </div>
        <h1 className="text-3xl font-bold font-heading">My Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium flex items-center gap-2">
                {AlertTriangleIcon && <AlertTriangleIcon size={16} />}
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/15 text-green-600 p-3 rounded-md text-sm font-medium">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                {UserIcon && <UserIcon size={16} />}
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                {MailIcon && <MailIcon size={16} />}
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
              />
            </div>

             <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                {ShieldIcon && <ShieldIcon size={16} />}
                Role
              </Label>
              <div className="px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm font-medium uppercase">
                {user?.role}
              </div>
              <p className="text-xs text-muted-foreground">
                Your role is managed by system administrators.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                {KeyIcon && <KeyIcon size={16} />}
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
              />
              <PasswordStrengthMeter password={formData.password} />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 p-6 flex justify-end">
             <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (
                <>
                  {SaveIcon && <SaveIcon size={16} className="mr-2" />}
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription className="text-destructive/80">
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting your account will permanently remove all your data from the system. This action cannot be undone.
          </p>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : (
              <>
                {Trash2Icon && <Trash2Icon size={16} className="mr-2" />}
                Delete Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
