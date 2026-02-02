import { useState, useEffect, type ComponentType } from 'react';
import type { User, CreateUserInput, UpdateUserInput, UserRole } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface UserEditorProps {
  userId?: string;
}

export default function UserEditor({ userId }: UserEditorProps) {
  const isNew = !userId;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    email: '',
    role: 'EDITOR',
    password: '',
  });
  const [icons, setIcons] = useState<{
    ArrowLeft?: ComponentType<any>;
    Save?: ComponentType<any>;
    User?: ComponentType<any>;
    Mail?: ComponentType<any>;
    Shield?: ComponentType<any>;
    Key?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        ArrowLeft: mod.ArrowLeft,
        Save: mod.Save,
        User: mod.User,
        Mail: mod.Mail,
        Shield: mod.Shield,
        Key: mod.Key,
      });
    });
  }, []);

  useEffect(() => {
    if (!isNew && userId) {
      fetchUser(userId);
    }
  }, [userId, isNew]);

  const fetchUser = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setFormData({
        name: data.name,
        email: data.email,
        role: data.role,
        password: '', // Password is not returned
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateUserInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = isNew ? '/api/users' : `/api/users/${userId}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save user');
      }

      // Redirect back to list
      window.location.href = '/admin/users';
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const ArrowLeftIcon = icons.ArrowLeft;
  const SaveIcon = icons.Save;
  const UserIcon = icons.User;
  const MailIcon = icons.Mail;
  const ShieldIcon = icons.Shield;
  const KeyIcon = icons.Key;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading user...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <a href="/admin/users">
            {ArrowLeftIcon ? <ArrowLeftIcon size={20} /> : null}
          </a>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-heading">
            {isNew ? 'Create User' : 'Edit User'}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? 'Add a new user to the system' : 'Update existing user details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                {UserIcon ? <UserIcon size={16} /> : null}
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                {MailIcon ? <MailIcon size={16} /> : null}
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                {ShieldIcon ? <ShieldIcon size={16} /> : null}
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Admins have full access. Editors can manage content but not system settings.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                {KeyIcon ? <KeyIcon size={16} /> : null}
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={isNew ? 'Enter password' : 'Leave blank to keep unchanged'}
                required={isNew}
              />
              {!isNew && (
                <p className="text-xs text-muted-foreground">
                  Only enter a value if you want to change the password.
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
               <Button type="button" variant="outline" asChild>
                <a href="/admin/users">Cancel</a>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    {SaveIcon ? <SaveIcon size={16} className="mr-2" /> : null}
                    Save User
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
