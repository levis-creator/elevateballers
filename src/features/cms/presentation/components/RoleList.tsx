import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import RoleEditor from './RoleEditor';

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function RoleList() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSystemRoles, setFilterSystemRoles] = useState<'all' | 'system' | 'custom'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Shield?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
    Users?: ComponentType<any>;
    Key?: ComponentType<any>;
    Filter?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Shield: mod.Shield,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        Users: mod.Users,
        Key: mod.Key,
        Filter: mod.Filter,
      });
    });
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/roles');

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const data = await response.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      const response = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete role');
      }

      await fetchRoles();
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (err) {
      console.error('Error deleting role:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const openDeleteDialog = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const openEditor = (roleId?: string) => {
    setSelectedRole(roleId || null);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setSelectedRole(null);
  };

  const handleSaveSuccess = () => {
    closeEditor();
    fetchRoles();
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterSystemRoles === 'all' ||
                         (filterSystemRoles === 'system' && role.isSystem) ||
                         (filterSystemRoles === 'custom' && !role.isSystem);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const ShieldIcon = icons.Shield;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const UsersIcon = icons.Users;
  const KeyIcon = icons.Key;
  const FilterIcon = icons.Filter;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">Manage roles and their permissions</p>
        </div>
        <Button onClick={() => openEditor()}>
          {PlusIcon && <PlusIcon className="h-4 w-4 mr-2" />}
          Create Role
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              {AlertCircleIcon && <AlertCircleIcon className="h-5 w-5" />}
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRoles}
                className="ml-auto"
              >
                {RefreshCwIcon && <RefreshCwIcon className="h-4 w-4 mr-2" />}
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {SearchIcon && <SearchIcon className="h-4 w-4 text-muted-foreground" />}
          </div>
          <Input
            type="search"
            placeholder="Search roles by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search roles by name or description"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterSystemRoles === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterSystemRoles('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterSystemRoles === 'system' ? 'default' : 'outline'}
            onClick={() => setFilterSystemRoles('system')}
            size="sm"
          >
            {ShieldIcon && <ShieldIcon className="h-4 w-4 mr-2" />}
            System
          </Button>
          <Button
            variant={filterSystemRoles === 'custom' ? 'default' : 'outline'}
            onClick={() => setFilterSystemRoles('custom')}
            size="sm"
          >
            Custom
          </Button>
        </div>
      </div>

      {/* Roles Table */}
      <Card>
        <CardContent className="p-0">
          {filteredRoles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || filterSystemRoles !== 'all' ? (
                <p>No roles found matching your criteria</p>
              ) : (
                <p>No roles yet. Create your first role to get started.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-center">
                    {UsersIcon && <UsersIcon className="h-4 w-4 inline mr-1" />}
                    Users
                  </TableHead>
                  <TableHead className="text-center">
                    {KeyIcon && <KeyIcon className="h-4 w-4 inline mr-1" />}
                    Permissions
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            {ShieldIcon && <ShieldIcon className="h-3 w-3 mr-1" />}
                            System
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {role.description || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{role.userCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{role.permissionCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {MoreVerticalIcon && <MoreVerticalIcon className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditor(role.id)}>
                            {EditIcon && <EditIcon className="h-4 w-4 mr-2" />}
                            Edit
                          </DropdownMenuItem>
                          {!role.isSystem && (
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(role)}
                              className="text-destructive"
                              disabled={role.userCount > 0}
                            >
                              {Trash2Icon && <Trash2Icon className="h-4 w-4 mr-2" />}
                              Delete
                              {role.userCount > 0 && ' (has users)'}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Editor Modal */}
      {isEditorOpen && (
        <RoleEditor
          roleId={selectedRole}
          onClose={closeEditor}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
