import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PermissionSelector from './PermissionSelector';

interface RoleEditorProps {
  roleId: string | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface RoleData {
  name: string;
  description: string;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  category: string | null;
}

export default function RoleEditor({ roleId, onClose, onSaveSuccess }: RoleEditorProps) {
  const [formData, setFormData] = useState<RoleData>({
    name: '',
    description: '',
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRole, setFetchingRole] = useState(false);
  const [error, setError] = useState('');
  const [icons, setIcons] = useState<{
    Save?: ComponentType<any>;
    Loader2?: ComponentType<any>;
    X?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Save: mod.Save,
        Loader2: mod.Loader2,
        X: mod.X,
      });
    });
  }, []);

  useEffect(() => {
    if (roleId) {
      fetchRole();
    }
  }, [roleId]);

  const fetchRole = async () => {
    if (!roleId) return;

    try {
      setFetchingRole(true);
      const response = await fetch(`/api/roles/${roleId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch role');
      }

      const data = await response.json();
      setFormData({
        name: data.role.name,
        description: data.role.description || '',
      });
      setSelectedPermissionIds(data.role.permissions.map((p: Permission) => p.id));
    } catch (err) {
      console.error('Error fetching role:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch role');
    } finally {
      setFetchingRole(false);
    }
  };

  const handleChange = (field: keyof RoleData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }

    if (selectedPermissionIds.length === 0) {
      setError('Please select at least one permission');
      return;
    }

    try {
      setLoading(true);

      // Create or update role
      const roleResponse = await fetch(
        roleId ? `/api/roles/${roleId}` : '/api/roles',
        {
          method: roleId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
          }),
        }
      );

      if (!roleResponse.ok) {
        const data = await roleResponse.json();
        throw new Error(data.error || 'Failed to save role');
      }

      const roleData = await roleResponse.json();
      const savedRoleId = roleId || roleData.role.id;

      // Update permissions
      const permissionsResponse = await fetch(
        `/api/roles/${savedRoleId}/permissions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissionIds: selectedPermissionIds }),
        }
      );

      if (!permissionsResponse.ok) {
        throw new Error('Failed to update permissions');
      }

      onSaveSuccess();
    } catch (err) {
      console.error('Error saving role:', err);
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const SaveIcon = icons.Save;
  const Loader2Icon = icons.Loader2;
  const XIcon = icons.X;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{roleId ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {roleId
              ? 'Update role details and manage permissions'
              : 'Create a new role with specific permissions'}
          </DialogDescription>
        </DialogHeader>

        {fetchingRole ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Role Details</TabsTrigger>
                <TabsTrigger value="permissions">
                  Permissions ({selectedPermissionIds.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Role Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Content Manager"
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique name for this role
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe what this role is for..."
                    disabled={loading}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional description to help identify the role's purpose
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="mt-4">
                <PermissionSelector
                  selectedPermissionIds={selectedPermissionIds}
                  onChange={setSelectedPermissionIds}
                />
              </TabsContent>
            </Tabs>

            {error && (
              <div className="mt-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                {XIcon && <XIcon className="h-4 w-4 mr-2" />}
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    {Loader2Icon && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
                    Saving...
                  </>
                ) : (
                  <>
                    {SaveIcon && <SaveIcon className="h-4 w-4 mr-2" />}
                    {roleId ? 'Update Role' : 'Create Role'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
