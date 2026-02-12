import { useState, useEffect, type ComponentType } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  resource: string;
  action: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface PermissionSelectorProps {
  selectedPermissionIds: string[];
  onChange: (permissionIds: string[]) => void;
}

export default function PermissionSelector({
  selectedPermissionIds,
  onChange,
}: PermissionSelectorProps) {
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [icons, setIcons] = useState<{
    Search?: ComponentType<any>;
    ChevronDown?: ComponentType<any>;
    ChevronRight?: ComponentType<any>;
    Check?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Search: mod.Search,
        ChevronDown: mod.ChevronDown,
        ChevronRight: mod.ChevronRight,
        Check: mod.Check,
      });
    });
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/permissions?groupBy=category');

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      setPermissions(data.permissions || {});

      // Expand all categories by default
      setExpandedCategories(new Set(Object.keys(data.permissions || {})));
    } catch (err) {
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermission = (permissionId: string) => {
    const newSelected = selectedPermissionIds.includes(permissionId)
      ? selectedPermissionIds.filter(id => id !== permissionId)
      : [...selectedPermissionIds, permissionId];

    onChange(newSelected);
  };

  const toggleCategoryPermissions = (category: string) => {
    const categoryPermissions = permissions[category] || [];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);

    const allSelected = categoryPermissionIds.every(id =>
      selectedPermissionIds.includes(id)
    );

    if (allSelected) {
      // Deselect all in category
      onChange(
        selectedPermissionIds.filter(id => !categoryPermissionIds.includes(id))
      );
    } else {
      // Select all in category
      const newSelected = [
        ...selectedPermissionIds.filter(id => !categoryPermissionIds.includes(id)),
        ...categoryPermissionIds,
      ];
      onChange(newSelected);
    }
  };

  const getFilteredCategories = () => {
    if (!searchTerm) return permissions;

    const filtered: Record<string, Permission[]> = {};
    Object.entries(permissions).forEach(([category, perms]) => {
      const matchingPerms = perms.filter(
        perm =>
          perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (perm.description && perm.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      if (matchingPerms.length > 0) {
        filtered[category] = matchingPerms;
      }
    });

    return filtered;
  };

  const filteredPermissions = getFilteredCategories();
  const totalPermissions = Object.values(permissions).flat().length;
  const selectedCount = selectedPermissionIds.length;

  const SearchIcon = icons.Search;
  const ChevronDownIcon = icons.ChevronDown;
  const ChevronRightIcon = icons.ChevronRight;
  const CheckIcon = icons.Check;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="permission-search">Search Permissions</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {SearchIcon && <SearchIcon className="h-4 w-4 text-muted-foreground" />}
          </div>
          <Input
            id="permission-search"
            type="search"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Selected Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {selectedCount} of {totalPermissions} permissions selected
        </span>
        {selectedCount > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto border rounded-md p-2">
        {Object.keys(filteredPermissions).length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No permissions found matching your search
          </p>
        ) : (
          Object.entries(filteredPermissions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, perms]) => {
              const categoryPermissionIds = perms.map(p => p.id);
              const allSelected = categoryPermissionIds.every(id =>
                selectedPermissionIds.includes(id)
              );
              const someSelected = categoryPermissionIds.some(id =>
                selectedPermissionIds.includes(id)
              );
              const isExpanded = expandedCategories.has(category);

              return (
                <Card key={category} className="overflow-hidden">
                  <CardHeader
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          ChevronDownIcon && <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          ChevronRightIcon && <ChevronRightIcon className="h-4 w-4" />
                        )}
                        <CardTitle className="text-sm font-medium">
                          {category}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {perms.length}
                        </Badge>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryPermissions(category);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {allSelected ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="p-3 pt-0 space-y-2">
                      {perms.map((perm) => {
                        const isChecked = selectedPermissionIds.includes(perm.id);

                        return (
                          <div
                            key={perm.id}
                            className="flex items-start gap-3 p-2 rounded hover:bg-accent transition-colors"
                          >
                            <Checkbox
                              id={`perm-${perm.id}`}
                              checked={isChecked}
                              onCheckedChange={() => togglePermission(perm.id)}
                              className="mt-1"
                            />
                            <label
                              htmlFor={`perm-${perm.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-medium text-sm">{perm.name}</div>
                              {perm.description && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {perm.description}
                                </div>
                              )}
                            </label>
                            {isChecked && CheckIcon && (
                              <CheckIcon className="h-4 w-4 text-primary mt-1" />
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}
