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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
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

  const handleDeleteClick = (folder: Folder) => {
    setFolderToDelete(folder);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!folderToDelete) return;

    try {
      const response = await fetch(`/api/folders/${folderToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete folder');
      
      setError('');
      fetchFolders();
      // If deleted folder was selected, clear selection
      if (selectedFolderId === folderToDelete.id && onFolderSelect) {
        onFolderSelect(null);
      }
    } catch (err: any) {
      setError('Error deleting folder: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setFolderToDelete(null);
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
        <h3 className="text-lg font-semibold tracking-tight">Folders</h3>
        {showCreateButton && (
          <Button size="sm" onClick={handleCreate} className="rounded-lg h-8">
            {PlusIcon && <PlusIcon size={14} className="mr-1" />}
            New
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Card
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-xl border-none shadow-sm',
            !selectedFolderId && 'bg-primary text-primary-foreground shadow-primary/20 shadow-md',
            selectedFolderId && 'hover:bg-muted bg-card'
          )}
          onClick={() => onFolderSelect?.(null)}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {FolderOpenIcon && <FolderOpenIcon size={18} className={!selectedFolderId ? 'text-primary-foreground' : 'text-muted-foreground'} />}
              <span className="font-semibold text-sm">All Media</span>
            </div>
            <Badge variant={selectedFolderId ? "secondary" : "outline"} className={!selectedFolderId ? "border-primary-foreground/30 text-primary-foreground" : ""}>
              {folders.reduce((sum, f) => sum + (f._count?.media || 0), 0)}
            </Badge>
          </CardContent>
        </Card>

        {folders.map((folder) => {
          const isSystemFolder = isPredefined(folder.name);
          const isSelected = selectedFolderId === folder.id;
          return (
            <Card
              key={folder.id}
              className={cn(
                'cursor-pointer transition-all duration-200 rounded-xl border-none shadow-sm',
                isSelected && 'bg-primary text-primary-foreground shadow-primary/20 shadow-md',
                !isSelected && 'hover:bg-muted bg-card',
                dragOverFolderId === folder.id && 'ring-2 ring-primary ring-offset-2 bg-primary/10'
              )}
              onClick={() => onFolderSelect?.(folder.id)}
              onDragOver={onFolderDragOver ? (e) => onFolderDragOver(e, folder.id) : undefined}
              onDrop={onFolderDrop ? (e) => onFolderDrop(e, folder.id) : undefined}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isSelected && FolderOpenIcon ? (
                      <FolderOpenIcon size={18} className="text-primary-foreground flex-shrink-0" />
                    ) : FolderIcon ? (
                      <FolderIcon size={18} className="text-muted-foreground flex-shrink-0" />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{folder.name}</span>
                        {folder.isPrivate && LockIcon && (
                          <LockIcon size={12} className={isSelected ? "text-primary-foreground/70" : "text-muted-foreground"} />
                        )}
                      </div>
                      {folder.description && (
                        <p className={cn("text-[11px] truncate", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {folder.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={isSelected ? "outline" : "secondary"} className={isSelected ? "border-primary-foreground/30 text-primary-foreground" : ""}>
                      {folder._count?.media || 0}
                    </Badge>
                    {!isSystemFolder && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className={cn("h-7 w-7", isSelected && "hover:bg-primary-foreground/20 hover:text-primary-foreground")}>
                            {MoreVerticalIcon && <MoreVerticalIcon size={14} className={isSelected ? "text-primary-foreground" : ""} />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(folder); }}>
                            {EditIcon && <EditIcon size={14} className="mr-2" />}
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(folder);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            {Trash2Icon && <Trash2Icon size={14} className="mr-2" />}
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
          <Card className="border-dashed bg-muted/30">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-sm mb-4">No custom folders</p>
              {showCreateButton && (
                <Button size="sm" variant="outline" onClick={handleCreate} className="rounded-lg">
                  {PlusIcon && <PlusIcon size={14} className="mr-1" />}
                  Create First
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{folderToDelete?.name}&quot;? 
              <br /><br />
              Media files inside will NOT be deleted, but they will no longer be organized in this folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
