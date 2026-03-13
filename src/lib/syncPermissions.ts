import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

interface PermissionRow {
  resource: string;
  action: string;
  description: string | null;
  category: string | null;
}

function loadPermissionsFromCsv(): PermissionRow[] | null {
  const csvPath = process.env.PERMISSIONS_CSV
    ? path.resolve(process.env.PERMISSIONS_CSV)
    : path.join(process.cwd(), 'scripts/data/permissions.csv');

  if (!fs.existsSync(csvPath)) return null;

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && inQuotes && next === '"') { current += '"'; i++; continue; }
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { values.push(current); current = ''; continue; }
      current += char;
    }
    values.push(current);
    return values.map((v) => v.trim());
  };

  const headers = parseLine(lines[0]);
  const col = (name: string) => headers.indexOf(name);
  const resourceIdx = col('resource');
  const actionIdx = col('action');
  const descIdx = col('description');
  const catIdx = col('category');

  if (resourceIdx === -1 || actionIdx === -1) return null;

  const rows: PermissionRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const resource = values[resourceIdx];
    const action = values[actionIdx];
    if (!resource || !action) continue;
    rows.push({
      resource,
      action,
      description: descIdx !== -1 ? values[descIdx] || null : null,
      category: catIdx !== -1 ? values[catIdx] || null : null,
    });
  }

  return rows;
}

export async function syncPermissions(): Promise<void> {
  const rows = loadPermissionsFromCsv();

  if (!rows || rows.length === 0) {
    console.warn('[permissions] CSV not found or empty — skipping auto-sync.');
    return;
  }

  // Load existing resource+action pairs in one query
  const existing = await prisma.permission.findMany({
    select: { resource: true, action: true },
  });
  const existingSet = new Set(existing.map((p) => `${p.resource}:${p.action}`));

  // Only insert rows that don't exist yet
  const toCreate = rows.filter((r) => !existingSet.has(`${r.resource}:${r.action}`));

  if (toCreate.length === 0) return;

  await prisma.permission.createMany({ data: toCreate, skipDuplicates: true });

  console.log(`[permissions] Auto-synced ${toCreate.length} new permission(s) from CSV.`);
}
