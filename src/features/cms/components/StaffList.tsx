import { useState, useEffect, type ComponentType } from 'react';
import type { Staff } from '../types';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    List?: ComponentType<any>;
    Grid?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Briefcase?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
    User?: ComponentType<any>;
    Mail?: ComponentType<any>;
    Phone?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        List: mod.List,
        Grid: mod.Grid,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Briefcase: mod.Briefcase,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        User: mod.User,
        Mail: mod.Mail,
        Phone: mod.Phone,
      });
    });
  }, []);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      const data = await response.json();
      setStaff(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this staff member?\n\nThis action cannot be undone. Team assignments will be removed.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete staff');
      
      setError('');
      fetchStaff();
    } catch (err: any) {
      setError('Error deleting staff: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'COACH': 'bg-primary',
      'ASSISTANT_COACH': 'bg-blue-500',
      'MANAGER': 'bg-red-500',
      'ASSISTANT_MANAGER': 'bg-green-500',
      'PHYSIOTHERAPIST': 'bg-pink-500',
      'TRAINER': 'bg-yellow-500',
      'ANALYST': 'bg-cyan-500',
      'OTHER': 'bg-slate-500',
    };
    return colors[role] || 'bg-slate-500';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'COACH': 'Coach',
      'ASSISTANT_COACH': 'Assistant Coach',
      'MANAGER': 'Manager',
      'ASSISTANT_MANAGER': 'Assistant Manager',
      'PHYSIOTHERAPIST': 'Physiotherapist',
      'TRAINER': 'Trainer',
      'ANALYST': 'Analyst',
      'OTHER': 'Other',
    };
    return labels[role] || role;
  };

  const filteredStaff = staff.filter(
    (member) =>
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.phone && member.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const BriefcaseIcon = icons.Briefcase;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const UserIcon = icons.User;
  const MailIcon = icons.Mail;
  const PhoneIcon = icons.Phone;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            {AlertCircleIcon ? <AlertCircleIcon size={24} className="text-destructive" /> : null}
            <div>
              <p className="font-semibold mb-2">Error Loading Staff</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchStaff} variant="default">
              {RefreshCwIcon ? <RefreshCwIcon size={18} className="mr-2" /> : null}
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2">
            {BriefcaseIcon ? <BriefcaseIcon size={28} /> : null}
            Staff Members
          </h1>
          <p className="text-muted-foreground">Manage coaches, managers, and team staff</p>
        </div>
        <Button asChild>
          <a href="/admin/staff/new" data-astro-prefetch>
            {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
            Create Staff
          </a>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <label htmlFor="staff-search" className="sr-only">Search staff</label>
          {SearchIcon ? (
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          ) : null}
          <Input
            id="staff-search"
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search staff by name, email, phone, or role"
          />
        </div>
        <div className="flex gap-2 bg-background p-1 rounded-lg border">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('table')}
            title="Table View"
            aria-label="Switch to table view"
            aria-pressed={viewMode === 'table'}
          >
            {ListIcon ? <ListIcon size={16} /> : null}
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            title="Grid View"
            aria-label="Switch to grid view"
            aria-pressed={viewMode === 'grid'}
          >
            {GridIcon ? <GridIcon size={16} /> : null}
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredStaff.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {searchTerm ? (
                  SearchIcon ? <SearchIcon size={64} /> : null
                ) : (
                  BriefcaseIcon ? <BriefcaseIcon size={64} /> : null
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? 'No staff found' : 'No staff yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Create your first staff member to get started'}
                </p>
              </div>
              {!searchTerm && (
                <Button asChild>
                  <a href="/admin/staff/new" data-astro-prefetch>
                    {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
                    Create Staff
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {UserIcon ? <UserIcon size={16} /> : null}
                    Name
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {BriefcaseIcon ? <BriefcaseIcon size={16} /> : null}
                    Role
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {MailIcon ? <MailIcon size={16} /> : null}
                    Email
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {PhoneIcon ? <PhoneIcon size={16} /> : null}
                    Phone
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder-staff.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {UserIcon ? <UserIcon size={20} className="text-muted-foreground" /> : null}
                        </div>
                      )}
                      <strong className="font-semibold text-foreground">
                        {member.firstName} {member.lastName}
                      </strong>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('text-white border-0', getRoleColor(member.role))}
                    >
                      {getRoleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.email ? (
                      <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                        {member.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.phone ? (
                      <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                        {member.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          {MoreVerticalIcon ? <MoreVerticalIcon size={18} /> : null}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/admin/staff/${member.id}`} data-astro-prefetch>
                            {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(member.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full h-64 bg-muted overflow-hidden">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-staff.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {UserIcon ? <UserIcon size={64} className="text-muted-foreground" /> : null}
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {member.firstName} {member.lastName}
                </h3>
                <Badge
                  variant="outline"
                  className={cn('mb-4 text-white border-0', getRoleColor(member.role))}
                >
                  {getRoleLabel(member.role)}
                </Badge>
                <div className="space-y-2 mb-4 text-sm">
                  {member.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {MailIcon ? <MailIcon size={16} /> : null}
                      <a href={`mailto:${member.email}`} className="hover:underline">
                        {member.email}
                      </a>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {PhoneIcon ? <PhoneIcon size={16} /> : null}
                      <a href={`tel:${member.phone}`} className="hover:underline">
                        {member.phone}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {MoreVerticalIcon ? <MoreVerticalIcon size={16} /> : null}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/admin/staff/${member.id}`} data-astro-prefetch>
                          {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                          Edit
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(member.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
