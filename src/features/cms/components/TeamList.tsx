import { useState, useEffect, type ComponentType } from 'react';
import type { TeamWithPlayerCount } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function TeamList() {
  const [teams, setTeams] = useState<TeamWithPlayerCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Users?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    Shield?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
    FileText?: ComponentType<any>;
    Eye?: ComponentType<any>;
    Briefcase?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Users: mod.Users,
        AlertCircle: mod.AlertCircle,
        Shield: mod.Shield,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        FileText: mod.FileText,
        Eye: mod.Eye,
        Briefcase: mod.Briefcase,
      });
    });
  }, []);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this team?\n\nThis action cannot be undone. Players associated with this team will have their team reference removed.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete team');
      
      setError('');
      fetchTeams();
    } catch (err: any) {
      setError('Error deleting team: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const UsersIcon = icons.Users;
  const AlertCircleIcon = icons.AlertCircle;
  const ShieldIcon = icons.Shield;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const FileTextIcon = icons.FileText;
  const EyeIcon = icons.Eye;
  const BriefcaseIcon = icons.Briefcase;

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
              <p className="font-semibold mb-2">Error Loading Teams</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchTeams} variant="default">
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
            {UsersIcon ? <UsersIcon size={28} /> : null}
            Teams
          </h1>
          <p className="text-muted-foreground">Manage teams and their information</p>
        </div>
        <Button asChild>
          <a href="/admin/teams/new" data-astro-prefetch>
            {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
            Create Team
          </a>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <label htmlFor="team-search" className="sr-only">Search teams</label>
          {SearchIcon ? (
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          ) : null}
          <Input
            id="team-search"
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search teams by name or description"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {searchTerm ? (
                  SearchIcon ? <SearchIcon size={64} /> : null
                ) : (
                  UsersIcon ? <UsersIcon size={64} /> : null
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? 'No teams found' : 'No teams yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Create your first team to get started'}
                </p>
              </div>
              {!searchTerm && (
                <Button asChild>
                  <a href="/admin/teams/new" data-astro-prefetch>
                    {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
                    Create Team
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {ShieldIcon ? <ShieldIcon size={16} /> : null}
                    Team
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {UsersIcon ? <UsersIcon size={16} /> : null}
                    Players
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {FileTextIcon ? <FileTextIcon size={16} /> : null}
                    Description
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder-team.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border-2 border-border">
                          {ShieldIcon ? <ShieldIcon size={24} className="text-muted-foreground" /> : null}
                        </div>
                      )}
                      <strong className="font-semibold text-foreground">{team.name}</strong>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {UsersIcon ? <UsersIcon size={14} /> : null}
                      <span>{team._count?.players || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.description ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {team.description.length > 100
                          ? `${team.description.substring(0, 100)}...`
                          : team.description}
                      </span>
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
                          <a href={`/admin/teams/view/${team.id}`} data-astro-prefetch>
                            {EyeIcon ? <EyeIcon size={16} className="mr-2" /> : null}
                            View
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/admin/teams/${team.id}`} data-astro-prefetch>
                            {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/admin/teams/view/${team.id}#staff`} data-astro-prefetch>
                            {BriefcaseIcon ? <BriefcaseIcon size={16} className="mr-2" /> : null}
                            Add Staff
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(team.id)}
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
      )}
    </div>
  );
}
