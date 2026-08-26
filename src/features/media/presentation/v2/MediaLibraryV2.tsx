import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Copy,
  Download,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  FolderPlus,
  Grid2X2,
  HardDrive,
  ImagePlus,
  Link2,
  Layers,
  List,
  Lock,
  MoreVertical,
  Database,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { MEDIA_FOLDERS } from '../../domain/entities/mediaFolders';
import type { MediaLibraryRow, MediaStats } from '../../domain/entities';
import type { MediaFolderRow, MediaPageResponse } from './mediaLibraryTypes';
import './MediaLibraryV2.css';

type ViewMode = 'grid' | 'list';
type TypeFilter = 'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
type StorageFilter = 'all' | 'r2' | 'supabase';
type SortKey = 'createdAt' | 'name' | 'size' | 'type';

function formatBytes(value: number | null | undefined) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let number = value;
  let index = 0;
  while (number >= 1024 && index < units.length - 1) {
    number /= 1024;
    index += 1;
  }
  return `${number >= 100 || index === 0 ? Math.round(number) : number.toFixed(1)} ${units[index]}`;
}

function typeIcon(type: string, size = 18) {
  if (type === 'VIDEO') return <FileVideo size={size} />;
  if (type === 'AUDIO') return <FileAudio size={size} />;
  if (type === 'DOCUMENT') return <FileText size={size} />;
  return <FileImage size={size} />;
}

function typeColor(type: string) {
  if (type === 'VIDEO') return '#7c5cff';
  if (type === 'AUDIO') return '#d98324';
  if (type === 'DOCUMENT') return '#1f9d55';
  return '#2a6fdb';
}

function useRouteState() {
  const defaultState = {
    folder: '',
    type: 'ALL' as TypeFilter,
    storage: 'all' as StorageFilter,
    q: '',
    sort: 'createdAt' as SortKey,
    dir: 'desc' as 'asc' | 'desc',
    view: 'grid' as ViewMode,
    page: 1,
  };
  const read = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      folder: params.get('folder') || '',
      type: (params.get('type') || 'ALL') as TypeFilter,
      storage: (params.get('storage') || 'all') as StorageFilter,
      q: params.get('q') || '',
      sort: (params.get('sort') || 'createdAt') as SortKey,
      dir: (params.get('dir') || 'desc') as 'asc' | 'desc',
      view: (params.get('view') || 'grid') as ViewMode,
      page: Number(params.get('page') || 1),
    };
  }, []);
  const [state, setState] = useState(defaultState);
  const update = useCallback(
    (next: Partial<ReturnType<typeof read>>) => {
      const merged = { ...read(), ...next };
      const params = new URLSearchParams();
      Object.entries(merged).forEach(([key, value]) => {
        const defaults: Record<string, string | number> = {
          type: 'ALL',
          storage: 'all',
          sort: 'createdAt',
          dir: 'desc',
          view: 'grid',
          page: 1,
          folder: '',
          q: '',
        };
        if (value !== defaults[key] && value !== '') params.set(key, String(value));
      });
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${params.toString() ? `?${params}` : ''}`
      );
      setState(merged);
    },
    [read]
  );
  useEffect(() => {
    setState(read());
    const handler = () => setState(read());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [read]);
  return { state, update };
}

export default function MediaLibraryV2() {
  const { addToast } = useToast();
  const { state: route, update: updateRoute } = useRouteState();
  const [folders, setFolders] = useState<MediaFolderRow[]>([]);
  const [page, setPage] = useState<MediaPageResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 24,
    totalPages: 1,
  });
  const [stats, setStats] = useState<MediaStats>({
    count: 0,
    bytes: 0,
    legacyCount: 0,
    legacyBytes: 0,
    untagged: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<MediaLibraryRow | null>(null);
  const [uploads, setUploads] = useState<Array<{ name: string; progress: number; error?: string }>>(
    []
  );
  const [folderDialog, setFolderDialog] = useState<{
    mode: 'create' | 'edit';
    folder?: MediaFolderRow;
  } | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderPrivate, setFolderPrivate] = useState(false);
  const [urlDialog, setUrlDialog] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(route.page),
        limit: '24',
        sort: route.sort,
        dir: route.dir,
      });
      if (route.folder) query.set('folderId', route.folder);
      if (route.type !== 'ALL') query.set('type', route.type);
      if (route.storage !== 'all') query.set('storage', route.storage);
      if (route.q) query.set('q', route.q);
      const statsQuery = new URLSearchParams(query);
      statsQuery.delete('page');
      statsQuery.delete('limit');
      statsQuery.delete('sort');
      statsQuery.delete('dir');
      const [folderResponse, mediaResponse, statsResponse] = await Promise.all([
        fetch('/api/folders?includePrivate=true'),
        fetch(`/api/media?${query}`),
        fetch(`/api/media/stats?${statsQuery}`),
      ]);
      if (!folderResponse.ok || !mediaResponse.ok) throw new Error('Unable to load media library');
      setFolders(await folderResponse.json());
      setPage(await mediaResponse.json());
      if (statsResponse.ok) setStats(await statsResponse.json());
      setSelected(new Set());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load media library');
    } finally {
      setLoading(false);
    }
  }, [route]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentFolder = folders.find((folder) => folder.id === route.folder);
  const uploadPrefix = `${currentFolder?.isPrivate ? 'private' : 'public'}/${currentFolder?.name || 'general'}/`;
  const selectedBytes = useMemo(
    () =>
      page.items
        .filter((item) => selected.has(item.id))
        .reduce((total, item) => total + (item.size || 0), 0),
    [page.items, selected]
  );

  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    setUploads(files.map((file) => ({ name: file.name, progress: 0 })));
    for (const [index, file] of files.entries()) {
      try {
        const body = new FormData();
        body.append('files', file);
        body.append('folder', currentFolder?.name || MEDIA_FOLDERS.general);
        body.append('isPrivate', currentFolder?.isPrivate ? 'true' : 'false');
        setUploads((items) =>
          items.map((item, itemIndex) => (itemIndex === index ? { ...item, progress: 25 } : item))
        );
        const response = await fetch('/api/media/batch-upload', { method: 'POST', body });
        const data = await response.json();
        if (!response.ok || data.failed)
          throw new Error(data.results?.[0]?.error || data.error || 'Upload failed');
        setUploads((items) =>
          items.map((item, itemIndex) => (itemIndex === index ? { ...item, progress: 100 } : item))
        );
      } catch (cause) {
        setUploads((items) =>
          items.map((item, itemIndex) =>
            itemIndex === index
              ? { ...item, error: cause instanceof Error ? cause.message : 'Upload failed' }
              : item
          )
        );
      }
    }
    await load();
    addToast({ description: `Upload completed to ${uploadPrefix}`, variant: 'success' });
  };

  const saveFolder = async () => {
    if (!folderName.trim()) return;
    const edit = folderDialog?.mode === 'edit';
    const id = folderDialog?.folder?.id;
    const response = await fetch(edit ? `/api/folders/${id}` : '/api/folders', {
      method: edit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: folderName.trim(), isPrivate: folderPrivate }),
    });
    addToast({
      description: response.ok
        ? edit
          ? 'Folder updated and storage synchronized'
          : 'Folder created'
        : 'Folder operation failed',
      variant: response.ok ? 'success' : 'error',
    });
    if (response.ok) {
      setFolderDialog(null);
      await load();
    }
  };

  const removeFolder = async (folder: MediaFolderRow) => {
    if ((folder._count?.media || 0) > 0) {
      addToast({ description: 'Folders containing media cannot be deleted', variant: 'error' });
      return;
    }
    if (!window.confirm(`Delete ${folder.name}? This removes its empty storage prefix.`)) return;
    const response = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
    addToast({
      description: response.ok ? 'Folder deleted' : 'Folder could not be deleted',
      variant: response.ok ? 'success' : 'error',
    });
    await load();
  };

  const addUrl = async () => {
    const response = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: urlTitle || urlValue.split('/').pop(),
        url: urlValue,
        type: 'IMAGE',
        thumbnail: urlValue,
        folderId: route.folder || undefined,
      }),
    });
    addToast({
      description: response.ok ? 'URL added to the media library' : 'Could not add URL',
      variant: response.ok ? 'success' : 'error',
    });
    if (response.ok) {
      setUrlDialog(false);
      setUrlValue('');
      setUrlTitle('');
      await load();
    }
  };

  const bulk = async (action: string, extra: Record<string, unknown> = {}) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const response = await fetch('/api/media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action, ...extra }),
    });
    if (response.ok) {
      setSelected(new Set());
      await load();
    }
    addToast({
      description: response.ok ? `${ids.length} media item(s) updated` : 'Bulk operation failed',
      variant: response.ok ? 'success' : 'error',
    });
  };

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => fetch(`/api/media/${id}`, { method: 'DELETE' })));
    setSelected(new Set());
    await load();
    addToast({ description: 'Selected media deleted', variant: 'success' });
  };

  const toggleSelected = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = page.items.length > 0 && page.items.every((item) => selected.has(item.id));

  return (
    <div
      className="eb-root min-h-[calc(100vh-57px)] font-archivo text-txd"
      data-media-theme="dark"
      aria-label="Media Library"
    >
      <div className="eb-scroll flex-1 overflow-y-auto px-6 py-6 max-[600px]:px-4">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[320px] flex-1">
              <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-soft">
                Assets
              </p>
              <h1 className="font-anton text-[34px] uppercase leading-none text-tx">
                Media Library
              </h1>
              <p className="mt-2 max-w-[660px] text-[13.5px] text-txm">
                Every image, video, audio file and document in the app, grouped by the folder its
                media row points at. New uploads go to Cloudflare R2; older files keep serving from
                Supabase until they are replaced.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="media-btn secondary"
                onClick={() => setFolderDialog({ mode: 'create' })}
              >
                <FolderPlus size={14} /> New Folder
              </button>
              <button className="media-btn secondary" onClick={() => setUrlDialog(true)}>
                <Link2 size={14} /> Add From URL
              </button>
              <button className="media-btn primary" onClick={() => fileInput.current?.click()}>
                <Upload size={15} /> Upload Files
              </button>
              <input
                ref={fileInput}
                hidden
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf"
                onChange={(event) => event.target.files && void uploadFiles(event.target.files)}
              />
            </div>
          </header>
          <div className="mb-5 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
            <Kpi
              label="Files In Library"
              value={String(stats.count)}
              icon={<Layers />}
              iconColor="#2a6fdb"
              iconBg="rgba(42,111,219,0.14)"
              sub={`across ${folders.length} folders`}
              action="Browse"
              onAction={() => updateRoute({ folder: '', type: 'ALL', storage: 'all', page: 1 })}
            />
            <Kpi
              label="Stored Across Folders"
              value={formatBytes(stats.bytes)}
              icon={<HardDrive />}
              iconColor="#9b86ff"
              iconBg="rgba(124,92,255,0.14)"
              sub={`${formatBytes(stats.bytes - stats.legacyBytes)} of it on R2`}
              action="On R2"
              onAction={() => updateRoute({ folder: '', storage: 'r2', page: 1 })}
            />
            <Kpi
              label="Still On Supabase"
              value={String(stats.legacyCount)}
              icon={<Database />}
              iconColor="#e5a35c"
              iconBg="rgba(217,131,36,0.14)"
              sub={`${stats.bytes ? Math.round((stats.legacyBytes / stats.bytes) * 100) : 0}% of bytes · ${formatBytes(stats.legacyBytes)} left`}
              action="Legacy"
              onAction={() => updateRoute({ folder: '', storage: 'supabase', page: 1 })}
            />
            <Kpi
              label="Untagged Files"
              value={String(stats.untagged)}
              icon={<Search />}
              iconColor="var(--brand)"
              iconBg="rgb(var(--site-brand-rgb) / 0.14)"
              sub="harder to find in pickers"
              action={stats.untagged > 0 ? 'Tag them' : undefined}
              onAction={() => updateRoute({ q: '', page: 1 })}
            />
          </div>
          <main className="flex gap-4 max-[1000px]:flex-col">
            <FolderRail
              folders={folders}
              current={route.folder}
              total={stats.count}
              onSelect={(folder) => updateRoute({ folder, page: 1 })}
              onCreate={() => {
                setFolderName('');
                setFolderPrivate(false);
                setFolderDialog({ mode: 'create' });
              }}
              onEdit={(folder) => {
                setFolderName(folder.name);
                setFolderPrivate(folder.isPrivate);
                setFolderDialog({ mode: 'edit', folder });
              }}
              onCopy={(folder) =>
                navigator.clipboard
                  .writeText(`${folder.path}/`)
                  .then(() =>
                    addToast({ description: 'Storage prefix copied', variant: 'success' })
                  )
              }
              onDelete={(folder) => void removeFolder(folder)}
            />
            <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-bord bg-surf">
              <Toolbar route={route} onRoute={updateRoute} items={page.items} total={page.total} />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-bord2 bg-surf2 px-4 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                  Upload target
                </span>
                <code className="rounded-md border border-bord bg-surf px-2 py-1 font-mono text-[11px] text-tx">
                  {uploadPrefix}
                </code>
                <span className="font-mono text-[10px] text-txm">
                  {currentFolder?.isPrivate ? 'private — signed reads only' : 'public bucket read'}
                </span>
                <button
                  className="ml-auto media-scope-btn"
                  onClick={() => fileInput.current?.click()}
                >
                  Drop files or browse…
                </button>
              </div>
              {uploads.length > 0 && (
                <UploadTray
                  uploads={uploads}
                  prefix={uploadPrefix}
                  onClose={() => setUploads([])}
                />
              )}
              {selected.size > 0 && (
                <BulkBar
                  count={selected.size}
                  size={selectedBytes}
                  onFeature={() => void bulk('feature', { featured: true })}
                  onTag={() =>
                    void bulk('tag', {
                      tags:
                        window
                          .prompt('Tags, comma separated')
                          ?.split(',')
                          .map((tag) => tag.trim())
                          .filter(Boolean) || [],
                    })
                  }
                  onMove={() =>
                    void bulk('move', { folderId: window.prompt('Target folder ID') || null })
                  }
                  onDownload={() =>
                    addToast({ description: `Preparing ${selected.size} files for download` })
                  }
                  onDelete={() => void deleteSelected()}
                  onClear={() => setSelected(new Set())}
                />
              )}
              {error ? (
                <ErrorState message={error} onRetry={() => void load()} />
              ) : loading ? (
                <LoadingState />
              ) : page.items.length === 0 ? (
                <EmptyState
                  onClear={() => updateRoute({ q: '', type: 'ALL', storage: 'all', page: 1 })}
                  onUpload={() => fileInput.current?.click()}
                />
              ) : route.view === 'grid' ? (
                <div
                  className="grid gap-3 p-4"
                  style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))' }}
                >
                  {page.items.map((item) => (
                    <GridTile
                      key={item.id}
                      item={item}
                      checked={selected.has(item.id)}
                      onCheck={() => toggleSelected(item.id)}
                      onOpen={() => setActive(item)}
                      onCopy={() =>
                        navigator.clipboard
                          .writeText(item.url)
                          .then(() => addToast({ description: 'URL copied', variant: 'success' }))
                      }
                    />
                  ))}
                </div>
              ) : (
                <ListView
                  items={page.items}
                  selected={selected}
                  allSelected={allSelected}
                  onAll={() =>
                    setSelected(
                      allSelected ? new Set() : new Set(page.items.map((item) => item.id))
                    )
                  }
                  onCheck={toggleSelected}
                  onOpen={setActive}
                />
              )}
              <Pagination
                page={page.page}
                totalPages={page.totalPages}
                total={page.total}
                limit={page.limit}
                totalSize={formatBytes(page.items.reduce((sum, item) => sum + (item.size || 0), 0))}
                onPage={(value) => updateRoute({ page: value })}
              />
            </section>
          </main>
        </div>
      </div>
      {active && (
        <DetailsDrawer
          item={active}
          onClose={() => setActive(null)}
          onRefresh={load}
          onToast={(message) => addToast({ description: message, variant: 'success' })}
        />
      )}
      {folderDialog && (
        <FolderDialog
          mode={folderDialog.mode}
          name={folderName}
          privateFolder={folderPrivate}
          onName={setFolderName}
          onPrivate={setFolderPrivate}
          onClose={() => setFolderDialog(null)}
          onSave={() => void saveFolder()}
        />
      )}
      {urlDialog && (
        <UrlDialog
          title={urlTitle}
          url={urlValue}
          onTitle={setUrlTitle}
          onUrl={setUrlValue}
          onClose={() => setUrlDialog(false)}
          onSave={() => void addUrl()}
        />
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  iconColor,
  iconBg,
  sub,
  action,
  onAction,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  iconColor: string;
  iconBg: string;
  sub: string;
  action?: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-bord bg-surf px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <strong className="font-anton text-[26px] leading-none text-tx">{value}</strong>
          <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-txm">
            {label}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-bord2 pt-2.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[9.5px] text-faint" title={sub}>
          {sub}
        </span>
        {action && (
          <button className="kpi-action" onClick={onAction}>
            {action} →
          </button>
        )}
      </div>
    </div>
  );
}

function FolderRail({
  folders,
  current,
  total,
  onSelect,
  onCreate,
  onEdit,
  onCopy,
  onDelete,
}: {
  folders: MediaFolderRow[];
  current: string;
  total: number;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (folder: MediaFolderRow) => void;
  onCopy: (folder: MediaFolderRow) => void;
  onDelete: (folder: MediaFolderRow) => void;
}) {
  const [folderQuery, setFolderQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<{
    folder: MediaFolderRow;
    top: number;
    left: number;
  } | null>(null);
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(folderQuery.trim().toLowerCase())
  );

  return (
    <>
      <div className="folder-rail-wrap">
        <aside className="folder-rail">
          <div className="folder-rail-head">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
              Folders <strong>{folders.length}</strong>
            </span>
            <button className="folder-add" onClick={onCreate} title="Create folder">
              <FolderPlus size={12} />
            </button>
          </div>

          {folders.length > 6 && (
            <label className="folder-search">
              <Search size={13} />
              <input
                value={folderQuery}
                onChange={(event) => setFolderQuery(event.target.value)}
                placeholder="Filter folders…"
              />
            </label>
          )}

          <div className="eb-scroll folder-list">
            {(filteredFolders.length > 0 || folderQuery) && (
              <div className="folder-item">
                <button
                  className={`folder-row all ${!current ? 'active' : ''}`}
                  onClick={() => onSelect('')}
                >
                  <Folder size={15} />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate">All files</span>
                    <small>every prefix</small>
                  </span>
                  <span>{total}</span>
                </button>
              </div>
            )}

            {filteredFolders.map((folder) => (
              <div className="folder-item" key={folder.id}>
                <button
                  className={`folder-row ${current === folder.id ? 'active' : ''}`}
                  onClick={() => onSelect(folder.id)}
                >
                  {folder.isPrivate ? <Lock size={15} /> : <Folder size={15} />}
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate">{folder.name}</span>
                    <small>{folder.path}/</small>
                  </span>
                  <span>{folder._count?.media || 0}</span>
                </button>
                <button
                  className="folder-menu-trigger"
                  aria-label={`Options for ${folder.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    const rect = event.currentTarget.getBoundingClientRect();
                    setOpenMenu((value) =>
                      value?.folder.id === folder.id
                        ? null
                        : {
                            folder,
                            top: Math.min(rect.bottom + 6, window.innerHeight - 200),
                            left: Math.min(rect.right - 236, window.innerWidth - 248),
                          }
                    );
                  }}
                >
                  <MoreVertical size={13} />
                </button>
              </div>
            ))}

            {folders.length === 0 && (
              <div className="folder-empty">
                <span>
                  <Folder size={18} />
                </span>
                <b>No folders yet</b>
                <small>Uploads create one on demand, or add the module folders now.</small>
                <button onClick={onCreate}>New folder</button>
              </div>
            )}

            {folders.length > 0 && filteredFolders.length === 0 && (
              <div className="folder-query-empty">No folder matches “{folderQuery}”</div>
            )}
          </div>

          <div className="folder-rail-foot">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              Writing new files to
            </div>
            <div className="mt-1.5 flex items-center gap-2 font-bold text-tx">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d55]" />
              Cloudflare R2
            </div>
            <div className="mt-1 font-mono text-[9.5px] text-txm">bucket · elevateballers</div>
          </div>
        </aside>
      </div>

      {openMenu && (
        <>
          <button
            className="folder-menu-overlay"
            aria-label="Close folder menu"
            onClick={() => setOpenMenu(null)}
          />
          <div className="folder-menu" style={{ top: openMenu.top, left: openMenu.left }}>
            <button
              onClick={() => {
                onEdit(openMenu.folder);
                setOpenMenu(null);
              }}
            >
              Rename folder…
            </button>
            <button
              onClick={() => {
                onEdit(openMenu.folder);
                setOpenMenu(null);
              }}
            >
              {openMenu.folder.isPrivate ? 'Make public' : 'Make private'}
            </button>
            <button
              onClick={() => {
                onCopy(openMenu.folder);
                setOpenMenu(null);
              }}
            >
              Copy prefix path
            </button>
            <button
              className="danger"
              disabled={(openMenu.folder._count?.media || 0) > 0}
              title={
                (openMenu.folder._count?.media || 0) > 0
                  ? 'A folder holding media cannot be deleted'
                  : 'Removes the empty R2 prefix'
              }
              onClick={() => {
                onDelete(openMenu.folder);
                setOpenMenu(null);
              }}
            >
              {(openMenu.folder._count?.media || 0) > 0
                ? `Delete — ${openMenu.folder._count?.media || 0} files inside`
                : 'Delete folder'}
            </button>
          </div>
        </>
      )}
    </>
  );
}

function Toolbar({
  route,
  onRoute,
  items,
  total,
}: {
  route: {
    q: string;
    type: TypeFilter;
    storage: StorageFilter;
    sort: SortKey;
    dir: 'asc' | 'desc';
    view: ViewMode;
  };
  onRoute: (next: Partial<typeof route> & { page?: number }) => void;
  items: MediaLibraryRow[];
  total: number;
}) {
  const choices: Array<{ key: TypeFilter; label: string }> = [
    { key: 'ALL', label: 'All' },
    { key: 'IMAGE', label: 'Image' },
    { key: 'VIDEO', label: 'Video' },
    { key: 'AUDIO', label: 'Audio' },
    { key: 'DOCUMENT', label: 'Doc' },
  ];
  return (
    <div className="media-toolbar flex flex-wrap items-center gap-2.5 border-b border-bord2 px-4 py-3">
      <div className="media-search flex min-w-[200px] flex-1 items-center gap-2.5 px-3 py-2">
        <Search className="flex-shrink-0 text-txm" size={15} />
        <input
          className="w-full border-none bg-transparent text-[13px] text-tx outline-none placeholder:text-faint"
          value={route.q}
          placeholder="File name, title or tag…"
          onChange={(event) => onRoute({ q: event.target.value, page: 1 })}
        />
      </div>
      <div className="asset-type-filters flex gap-1.5 max-[1280px]:hidden">
        {choices.map((choice) => {
          const color = choice.key === 'ALL' ? 'var(--brand)' : typeColor(choice.key);
          return (
            <button
              key={choice.key}
              className={`type-segment ${route.type === choice.key ? 'selected' : ''}`}
              style={{ '--type-color': color } as CSSProperties}
              onClick={() => onRoute({ type: choice.key, page: 1 })}
            >
              {choice.key === 'ALL' ? <Layers size={13} /> : typeIcon(choice.key, 13)}
              {choice.label}
              <span>
                {choice.key === 'ALL'
                  ? total
                  : items.filter((item) => item.type === choice.key).length}
              </span>
            </button>
          );
        })}
      </div>
      <label className="asset-select-wrap min-[1281px]:hidden">
        <select
          className="asset-select"
          value={route.type}
          aria-label="Media type"
          onChange={(event) => onRoute({ type: event.target.value as TypeFilter, page: 1 })}
        >
          <option value="ALL">All</option>
          <option value="IMAGE">IMAGE</option>
          <option value="VIDEO">VIDEO</option>
          <option value="AUDIO">AUDIO</option>
          <option value="DOCUMENT">DOCUMENT</option>
        </select>
        <span aria-hidden="true">▾</span>
      </label>
      <label className="asset-select-wrap">
        <select
          className="asset-select"
          value={route.storage}
          aria-label="Storage"
          onChange={(event) => onRoute({ storage: event.target.value as StorageFilter, page: 1 })}
        >
          <option value="all">All storage</option>
          <option value="r2">Cloudflare R2</option>
          <option value="supabase">Supabase (legacy)</option>
        </select>
        <span aria-hidden="true">▾</span>
      </label>
      <label className="asset-select-wrap">
        <select
          className="asset-select"
          value={`${route.sort}:${route.dir}`}
          aria-label="Sort media"
          onChange={(event) => {
            const [sort, dir] = event.target.value.split(':') as [SortKey, 'asc' | 'desc'];
            onRoute({ sort, dir, page: 1 });
          }}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="size:desc">Largest first</option>
          <option value="name:asc">Name A–Z</option>
        </select>
        <span aria-hidden="true">▾</span>
      </label>
      <div className="ml-auto flex gap-1.5">
        <button
          className={`view-btn ${route.view === 'grid' ? 'selected' : ''}`}
          aria-label="Grid view"
          onClick={() => onRoute({ view: 'grid' })}
        >
          <Grid2X2 size={15} />
        </button>
        <button
          className={`view-btn ${route.view === 'list' ? 'selected' : ''}`}
          aria-label="List view"
          onClick={() => onRoute({ view: 'list' })}
        >
          <List size={15} />
        </button>
      </div>
    </div>
  );
}

function UploadTray({
  uploads,
  prefix,
  onClose,
}: {
  uploads: Array<{ name: string; progress: number; error?: string }>;
  prefix: string;
  onClose: () => void;
}) {
  return (
    <section className="border-b border-bord2 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold text-tx">
          Uploading {uploads.length} files → {prefix}
        </h2>
        <button className="text-[11px] font-bold text-txm hover:text-brand-red" onClick={onClose}>
          Hide
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        {uploads.map((item) => (
          <div className="flex items-center gap-3" key={item.name}>
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-bord2 bg-surf2 text-txm">
              <Upload size={13} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] text-tx">{item.name}</span>
              <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-[var(--track)]">
                <span
                  className={`block h-full rounded-full ${item.error ? 'bg-red-600' : 'bg-[#2a6fdb]'}`}
                  style={{ width: `${item.progress}%` }}
                />
              </span>
            </span>
            <span
              className={`rounded px-1.5 py-[3px] font-mono text-[9px] font-bold uppercase tracking-[0.08em] ${item.error ? 'text-red-600' : 'text-txm'}`}
            >
              {item.error || (item.progress >= 100 ? 'Stored' : 'Uploading')}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BulkBar({
  count,
  size,
  onFeature,
  onTag,
  onMove,
  onDownload,
  onDelete,
  onClear,
}: {
  count: number;
  size: number;
  onFeature: () => void;
  onTag: () => void;
  onMove: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div className="bulk-row">
      <span className="bulk-count">
        {count} selected · {formatBytes(size)}
      </span>
      <button onClick={onMove}>Move to folder…</button>
      <button onClick={onTag}>Add tags…</button>
      <button onClick={onDownload}>Download</button>
      <button onClick={onFeature}>Feature</button>
      <button className="danger" onClick={onDelete}>
        Delete
      </button>
      <button className="clear" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}

function GridTile({
  item,
  checked,
  onCheck,
  onOpen,
  onCopy,
}: {
  item: MediaLibraryRow;
  checked: boolean;
  onCheck: () => void;
  onOpen: () => void;
  onCopy: () => void;
}) {
  const color = typeColor(item.type);
  return (
    <article
      className={`eb-card overflow-hidden rounded-xl border bg-surf2 transition-colors ${checked ? 'asset-selected' : ''}`}
    >
      <button className="asset-preview" style={{ backgroundColor: `${color}1f` }} onClick={onOpen}>
        {item.type === 'IMAGE' ? (
          <img
            src={item.thumbUrl || item.url}
            loading="lazy"
            className="h-full w-full object-cover"
            alt={item.title}
          />
        ) : (
          <span style={{ color }}>{typeIcon(item.type, 34)}</span>
        )}
        {item.dimensions && <span className="asset-dimensions">{item.dimensions}</span>}
        <span className="asset-type-chip" style={{ background: `${color}2e` }}>
          {typeIcon(item.type, 11)} {item.type === 'DOCUMENT' ? 'DOC' : item.type}
        </span>
        {item.folderPrivate && (
          <span className="asset-private">
            <Lock size={10} /> Private
          </span>
        )}
        {item.featured && <span className="asset-featured">★</span>}
      </button>
      <div className="asset-card-foot">
        <button
          className={`asset-check ${checked ? 'selected' : ''}`}
          aria-label="Select file"
          onClick={onCheck}
        >
          ✓
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={onOpen}>
          <span className="asset-title" title={item.title}>
            {item.title}
          </span>
          <span className="asset-meta">
            <span>{formatBytes(item.size)}</span>
            <span>·</span>
            <span className={item.storage}>{item.storage === 'r2' ? 'R2' : 'Supabase'}</span>
          </span>
        </button>
        <button className="eb-hover asset-copy" title="Copy public URL" onClick={onCopy}>
          <Copy size={12} />
        </button>
      </div>
    </article>
  );
}

function ListView({
  items,
  selected,
  allSelected,
  onAll,
  onCheck,
  onOpen,
}: {
  items: MediaLibraryRow[];
  selected: Set<string>;
  allSelected: boolean;
  onAll: () => void;
  onCheck: (id: string) => void;
  onOpen: (item: MediaLibraryRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-bord bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-bord bg-surf2 font-mono text-[10px] uppercase tracking-widest text-txm">
          <tr>
            <th className="p-3">
              <input type="checkbox" checked={allSelected} onChange={onAll} />
            </th>
            <th className="p-3">Asset</th>
            <th className="p-3">Path / MIME</th>
            <th className="p-3">Size</th>
            <th className="p-3">Storage</th>
            <th className="p-3">Uploader</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr className="border-b border-bord2 last:border-0 hover:bg-surf" key={item.id}>
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => onCheck(item.id)}
                />
              </td>
              <td className="p-3">
                <button className="flex items-center gap-3 text-left" onClick={() => onOpen(item)}>
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-surf2 text-brand-red">
                    {item.type === 'IMAGE' ? (
                      <img
                        src={item.thumbUrl || item.url}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        alt=""
                      />
                    ) : (
                      typeIcon(item.type)
                    )}
                  </span>
                  <span>
                    <b className="block truncate">{item.title}</b>
                    <small className="text-txm">{item.fileName}</small>
                  </span>
                </button>
              </td>
              <td className="p-3 font-mono text-xs text-txm">
                <div>{item.filePath || '—'}</div>
                <div>{item.mime || 'unknown'}</div>
              </td>
              <td className="p-3 text-xs">
                {formatBytes(item.size)}
                {item.originalSize && item.originalSize > (item.size || 0) && (
                  <small className="block text-emerald-600">
                    −{Math.round((1 - (item.size || 0) / item.originalSize) * 100)}%
                  </small>
                )}
              </td>
              <td className="p-3">
                <span className={`storage-pill ${item.storage}`}>
                  {item.storage === 'r2' ? 'Cloudflare R2' : 'Supabase legacy'}
                </span>
              </td>
              <td className="p-3 text-xs text-txm">{item.uploaderName || 'System'}</td>
              <td className="p-3">
                <MoreVertical size={16} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailsDrawer({
  item,
  onClose,
  onRefresh,
  onToast,
}: {
  item: MediaLibraryRow;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onToast: (message: string) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [tags, setTags] = useState(item.tags.join(', '));
  const save = async () => {
    const response = await fetch(`/api/media/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });
    if (response.ok) {
      onToast('Media details updated');
      await onRefresh();
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <aside className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-brand-red">
              Media details
            </p>
            <h2 className="font-anton text-3xl uppercase">{item.type}</h2>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="mt-6 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-surf2">
          {item.type === 'IMAGE' ? (
            <img src={item.url} className="h-full w-full object-contain" alt={item.title} />
          ) : (
            <span className="text-brand-red">{typeIcon(item.type, 54)}</span>
          )}
        </div>
        <label className="mt-5 block text-xs font-bold uppercase text-txm">
          Title
          <input
            className="media-input mt-1 w-full"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="mt-4 block text-xs font-bold uppercase text-txm">
          Tags
          <input
            className="media-input mt-1 w-full"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </label>
        <div className="mt-5 grid grid-cols-[100px_1fr] gap-y-3 text-xs">
          <b>URL</b>
          <span className="break-all text-txm">{item.url}</span>
          <b>Path</b>
          <span className="break-all font-mono text-txm">{item.filePath || '—'}</span>
          <b>MIME</b>
          <span>{item.mime || '—'}</span>
          <b>Size</b>
          <span>
            {formatBytes(item.size)}
            {item.originalSize ? ` / original ${formatBytes(item.originalSize)}` : ''}
          </span>
          <b>Storage</b>
          <span>{item.storage === 'r2' ? 'Cloudflare R2' : 'Supabase (legacy)'}</span>
          <b>Folder</b>
          <span>
            {item.folderName || '—'} {item.folderPrivate ? '· private' : ''}
          </span>
          <b>Uploader</b>
          <span>{item.uploaderName || 'System'}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="media-btn primary" onClick={() => void save()}>
            Save changes
          </button>
          <button
            className="media-btn secondary"
            onClick={() =>
              navigator.clipboard.writeText(item.url).then(() => onToast('URL copied'))
            }
          >
            <Copy size={15} /> Copy URL
          </button>
          <a className="media-btn secondary" href={item.url} download={item.fileName}>
            <Download size={15} /> Download
          </a>
        </div>
        <p className="mt-8 border-t border-bord pt-5 text-xs text-txm">
          Storage side effect:{' '}
          {item.storage === 'supabase'
            ? 'legacy object remains in Supabase.'
            : 'R2 object is managed with the media row.'}
        </p>
      </aside>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  limit,
  totalSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  totalSize: string;
  onPage: (page: number) => void;
}) {
  return (
    <div className="media-pagination">
      <span>
        Showing <b>{total === 0 ? 0 : (page - 1) * limit + 1}</b> of <b>{total}</b> files ·{' '}
        {totalSize}
      </span>
      <span className="flex items-center gap-1.5">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </button>
        <span className="media-page-number">
          {page} / {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </span>
    </div>
  );
}
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
      <p className="font-semibold">{message}</p>
      <button className="mt-3 underline" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="h-64 animate-pulse rounded-xl bg-surf2" key={index} />
      ))}
    </div>
  );
}
function EmptyState({ onClear, onUpload }: { onClear: () => void; onUpload: () => void }) {
  return (
    <div className="media-empty-state">
      <span className="media-empty-icon">
        <ImagePlus size={22} />
      </span>
      <div className="font-anton text-xl uppercase text-tx">Nothing in this view</div>
      <p>This folder has no files matching the current type, storage or search filters.</p>
      <div className="mt-1 flex gap-2">
        <button className="media-empty-clear" onClick={onClear}>
          Clear filters
        </button>
        <button className="media-btn primary" onClick={onUpload}>
          Upload here
        </button>
      </div>
    </div>
  );
}
function FolderDialog({
  mode,
  name,
  privateFolder,
  onName,
  onPrivate,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  name: string;
  privateFolder: boolean;
  onName: (value: string) => void;
  onPrivate: (value: boolean) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal title={mode === 'create' ? 'New folder' : 'Folder settings'} onClose={onClose}>
      <label className="block text-xs font-bold uppercase text-txm">
        Name
        <input
          className="media-input mt-1 w-full"
          value={name}
          onChange={(event) => onName(event.target.value)}
        />
      </label>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={privateFolder}
          onChange={(event) => onPrivate(event.target.checked)}
        />{' '}
        Private folder
      </label>
      <p className="mt-4 rounded bg-surf2 p-3 font-mono text-xs">
        {privateFolder ? 'private' : 'public'}/{name || 'folder-name'}/
      </p>
      {mode === 'edit' && (
        <p className="mt-3 text-xs text-txm">
          R2 objects are re-keyed on rename/privacy change. Legacy Supabase objects stay in
          Supabase.
        </p>
      )}
      <ModalActions onClose={onClose} onSave={onSave} />
    </Modal>
  );
}
function UrlDialog({
  title,
  url,
  onTitle,
  onUrl,
  onClose,
  onSave,
}: {
  title: string;
  url: string;
  onTitle: (value: string) => void;
  onUrl: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal title="Add from URL" onClose={onClose}>
      <input
        className="media-input mt-1 w-full"
        placeholder="https://…"
        value={url}
        onChange={(event) => onUrl(event.target.value)}
      />
      <input
        className="media-input mt-3 w-full"
        placeholder="Title (optional)"
        value={title}
        onChange={(event) => onTitle(event.target.value)}
      />
      <ModalActions onClose={onClose} onSave={onSave} />
    </Modal>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="flex items-center justify-between">
          <h2 className="font-anton text-2xl uppercase">{title}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
function ModalActions({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button className="media-btn secondary" onClick={onClose}>
        Cancel
      </button>
      <button className="media-btn primary" onClick={onSave}>
        Save
      </button>
    </div>
  );
}
