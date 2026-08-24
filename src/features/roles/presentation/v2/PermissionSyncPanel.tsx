import { useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { usePermissions } from '@/features/rbac/usePermissions';
import { rolesApi } from '../../data/datasources/roles-api';

type Preview = Awaited<ReturnType<typeof rolesApi.permissionSyncPreview>>;

export default function PermissionSyncPanel() {
	const { isAdmin, loading: permissionsLoading } = usePermissions();
	const [preview, setPreview] = useState<Preview | null>(null);
	const [busy, setBusy] = useState(false);
	const [confirmed, setConfirmed] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	if (permissionsLoading || !isAdmin) return null;

	const loadPreview = async () => {
		setBusy(true);
		setMessage(null);
		setConfirmed(false);
		try {
			setPreview(await rolesApi.permissionSyncPreview());
		} catch (error) {
			setMessage(error instanceof Error ? error.message : 'Unable to preview permission sync.');
		} finally {
			setBusy(false);
		}
	};

	const apply = async () => {
		if (!confirmed) return;
		setBusy(true);
		setMessage(null);
		try {
			const result = await rolesApi.applyPermissionSync();
			setMessage(result.createdCount === 0 ? 'Permissions are already up to date.' : `${result.createdCount} canonical permission${result.createdCount === 1 ? '' : 's'} restored.`);
			setPreview(await rolesApi.permissionSyncPreview());
			setConfirmed(false);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : 'Unable to apply permission sync.');
		} finally {
			setBusy(false);
		}
	};

	return (
		<section className="eb-permission-sync" aria-labelledby="permission-sync-title">
			<div className="eb-permission-sync-heading">
				<div>
					<div className="eb-kicker">System maintenance</div>
					<h2 id="permission-sync-title">Permission catalogue</h2>
					<p>Preview and restore missing canonical permissions from the project catalogue. Existing permissions and user role assignments are never removed or changed.</p>
				</div>
				<button className="eb-detail-small-button" onClick={loadPreview} disabled={busy}>
					<RefreshCw size={13} /> {busy ? 'Checking…' : 'Preview sync'}
				</button>
			</div>

			{preview && (
				<div className="eb-permission-sync-preview">
					<div className="eb-permission-sync-summary"><ShieldCheck size={16} /><strong>{preview.missingCount} missing</strong><span>of {preview.canonicalCount} canonical permissions</span></div>
					{preview.permissions.length > 0 ? (
						<ul>{preview.permissions.map((permission) => <li key={`${permission.resource}:${permission.action}`}><code>{permission.resource}:{permission.action}</code><span>{permission.description || 'No description'}</span></li>)}</ul>
					) : <p className="eb-permission-sync-empty">The database already contains every canonical permission.</p>}
					{preview.canApply && <label className="eb-permission-sync-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> I reviewed the preview and want to restore only these missing permissions.</label>}
					{preview.canApply && <button className="eb-primary-button" onClick={apply} disabled={!confirmed || busy}>Apply additive sync</button>}
				</div>
			)}
			{message && <p className="eb-permission-sync-message" role="status">{message}</p>}
		</section>
	);
}
