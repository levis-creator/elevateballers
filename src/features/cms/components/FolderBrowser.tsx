import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FolderModal from './FolderModal';
import { cn } from '@/lib/utils';
import { isPredefinedFolderName } from '@/lib/folder-constants';

interface Folder {
  id: string;
  name: string;
  path: string;
  description?: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    media: number;
  };
}

interface FolderBrowserProps {
  selectedFolderId?: string | null;
  onFolderSelect?: (folderId: string | null) => void;
  showCreateButton?: boolean;
  onFolderDragOver?: (e: React.DragEvent, folderId: string) => void;
  onFolderDrop?: (e: React.DragEvent, folderId: string) => void;
  dragOverFolderId?: string | null;
}

export default function FolderBrowser({
  selectedFolderId,
  onFolderSelect,
  showCreateButton = true,
  onFolderDragOver,
  onFolderDrop,
  dragOverFolderId,
}: FolderBrowserProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [icons, setIcons] = useState<{
    Folder?: ComponentType<any>;
    FolderOpen?: ComponentType<any>;
    Plus?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Lock?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Folder: mod.Folder,
        FolderOpen: mod.FolderOpen,
        Plus: mod.Plus,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Lock: mod.Lock,
        MoreVertical: mod.MoreVertical,
      });
    });
  }, []);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/folders?includePrivate=true');
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setFolders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFolder(null);
    setModalOpen(true);
  };

  const handleEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this folder?\n\nMedia files in this folder will remain but will no longer be organized in a folder.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete folder');
      
      setError('');
      fetchFolders();
      // If deleted folder was selected, clear selection
      if (selectedFolderId === id && onFolderSelect) {
        onFolderSelect(null);
      }
    } catch (err: any) {
      setError('Error deleting folder: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Check if a folder is a predefined/system folder
  const isPredefined = (folderName: string): boolean => {
    return isPredefinedFolderName(folderName);
  };

  const FolderIcon = icons.Folder;
  const FolderOpenIcon = icons.FolderOpen;
  const PlusIcon = icons.Plus;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const LockIcon = icons.Lock;
  const MoreVerticalIcon = icons.MoreVertical;

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error && !folders.length) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Folders</h3>
        {showCreateButton && (
          <Button size="sm" onClick={handleCreate}>
            {PlusIcon && <PlusIcon size={16} className="mr-2" />}
            New Folder
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {/* All Media Option */}
        <Card
          className={cn(
            'cursor-pointer transition-colors',
            !selectedFolderId && 'border-primary bg-primary/5',
            selectedFolderId && 'hover:bg-muted'
          )}
          onClick={() => onFolderSelect?.(null)}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {FolderOpenIcon && <FolderOpenIcon size={20} className="text-muted-foreground" />}
              <span className="font-medium">All Media</span>
            </div>
            <Badge variant="secondary">{folders.reduce((sum, f) => sum + (f._count?.media || 0), 0)}</Badge>
          </CardContent>
        </Card>

        {/* Folder List */}
        {folders.map((folder) => {
          const isSystemFolder = isPredefined(folder.name);
          return (
            <Card
              key={folder.id}
              className={cn(
                'cursor-pointer transition-colors',
                selectedFolderId === folder.id && 'border-primary bg-primary/5',
                selectedFolderId !== folder.id && 'hover:bg-muted',
                dragOverFolderId === folder.id && 'ring-2 ring-primary ring-offset-2 bg-primary/10'
              )}
              onClick={() => onFolderSelect?.(folder.id)}
              onDragOver={onFolderDragOver ? (e) => onFolderDragOver(e, folder.id) : undefined}
              onDrop={onFolderDrop ? (e) => onFolderDrop(e, folder.id) : undefined}
              onDragLeave={(e) => {
                if (onFolderDragOver && dragOverFolderId === folder.id) {
                  // Only clear if we're leaving the folder area
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const x = e.clientX;
                  const y = e.clientY;
                  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                    // Actually leaving
                  }
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedFolderId === folder.id && FolderOpenIcon ? (
                      <FolderOpenIcon size={20} className="text-primary flex-shrink-0" />
                    ) : FolderIcon ? (
                      <FolderIcon size={20} className="text-muted-foreground flex-shrink-0" />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{folder.name}</span>
                        {folder.isPrivate && LockIcon && (
                          <LockIcon size={14} className="text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      {folder.description && (
                        <p className="text-xs text-muted-foreground truncate">{folder.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary">{folder._count?.media || 0}</Badge>
                    {isSystemFolder ? (
                      // Show lock icon for predefined folders (cannot be edited/deleted)
                      <div className="h-8 w-8 flex items-center justify-center" title="System folder - cannot be modified">
                        {LockIcon ? <LockIcon size={16} className="text-muted-foreground" /> : null}
                      </div>
                    ) : (
                      // Show dropdown menu for custom folders
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {MoreVerticalIcon && <MoreVerticalIcon size={16} />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(folder); }}>
                            {EditIcon && <EditIcon size={16} className="mr-2" />}
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(folder.id);
                            }}
                            className="text-destructive"
                          >
                            {Trash2Icon && <Trash2Icon size={16} className="mr-2" />}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {folders.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No folders yet</p>
              {showCreateButton && (
                <Button size="sm" variant="outline" onClick={handleCreate}>
                  {PlusIcon && <PlusIcon size={16} className="mr-2" />}
                  Create First Folder
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <FolderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        folder={editingFolder}
        onSuccess={fetchFolders}
      />
    </div>
  );
}
