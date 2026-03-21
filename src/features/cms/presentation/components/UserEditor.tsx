import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ToastProvider, useToast } from '@/components/ui/toast';

interface UserEditorProps {
  userId?: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export default function UserEditor({ userId }: UserEditorProps) {
  return (
    <ToastProvider>
      <UserEditorForm userId={userId} />
    </ToastProvider>
  );
}

function UserEditorForm({ userId }: UserEditorProps) {
  const isNew = !userId;
  const { addToast } = useToast();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    active: true,
  });
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [resetSending, setResetSending] = useState(false);
  const [icons, setIcons] = useState<{
    ArrowLeft?: ComponentType<any>;
    Save?: ComponentType<any>;
    User?: ComponentType<any>;
    Mail?: ComponentType<any>;
    Shield?: ComponentType<any>;
    KeyRound?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        ArrowLeft: mod.ArrowLeft,
        Save: mod.Save,
        User: mod.User,
        Mail: mod.Mail,
        Shield: mod.Shield,
        KeyRound: mod.KeyRound,
      });
    });
  }, []);

  useEffect(() => {
    fetchRoles();
    if (!isNew && userId) {
      fetchUser(userId);
    }
  }, [userId, isNew]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setAvailableRoles(data.roles || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchUser = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setFormData({
        name: data.name,
        email: data.email,
        active: data.active ?? true,
      });
      setActivatedAt(data.activatedAt ?? null);

      const rolesResponse = await fetch(`/api/users/${id}/role`);
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setSelectedRoleIds(rolesData.roles.map((r: Role) => r.id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleResetPassword = async () => {
    setResetSending(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Could not send the email. Please try again.');
      }
      addToast({
        variant: 'success',
        title: activatedAt ? 'Reset Email Sent' : 'Invitation Sent',
        description: activatedAt
          ? `A password reset link has been sent to ${formData.email}.`
          : `An invitation email has been resent to ${formData.email}.`,
      });
    } catch (err: any) {
      addToast({
        variant: 'error',
        title: 'Failed to Send',
        description: err.message || 'Could not send the email. Please try again.',
      });
    } finally {
      setResetSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (selectedRoleIds.length === 0) {
      setError('Please select at least one role');
      setSaving(false);
      return;
    }

    try {
      const url = isNew ? '/api/users' : `/api/users/${userId}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload: any = {
        name: formData.name,
        email: formData.email,
        active: formData.active,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save user');
      }

      const userData = await response.json();
      const savedUserId = isNew ? userData.user.id : userId;

      const rolesResponse = await fetch(`/api/users/${savedUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: selectedRoleIds }),
      });

      if (!rolesResponse.ok) {
        throw new Error('Failed to assign roles');
      }

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
  const KeyRoundIcon = icons.KeyRound;

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

            {/* Active toggle — edit mode only */}
            {!isNew && (
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive users cannot log in to the system.
                  </p>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => handleChange('active', checked)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {ShieldIcon ? <ShieldIcon size={16} /> : null}
                Roles
              </Label>
              <div className="space-y-2 border rounded-md p-4">
                {availableRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading roles...</p>
                ) : (
                  availableRoles.map((role) => (
                    <div key={role.id} className="flex items-start gap-3">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{role.name}</span>
                          {role.isSystem && (
                            <Badge variant="secondary" className="text-xs">System</Badge>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {role.description}
                          </p>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Select one or more roles for this user. Multiple roles combine their permissions.
              </p>
            </div>

            {/* Reset Password / Resend Invite — edit mode only */}
            {!isNew && (
              <div className="rounded-md border p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {KeyRoundIcon ? <KeyRoundIcon size={16} /> : null}
                    {activatedAt ? 'Password Reset' : 'Invitation'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activatedAt
                      ? 'Send a password reset link to this user\'s email address.'
                      : 'This user has not accepted their invitation yet. Resend the invite email.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resetSending}
                  onClick={handleResetPassword}
                >
                  {resetSending
                    ? 'Sending...'
                    : activatedAt
                    ? 'Send Password Reset Email'
                    : 'Resend Invitation'}
                </Button>
              </div>
            )}

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
