import { useState, useEffect } from 'react';
import type { Season } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2, Trophy } from 'lucide-react';

interface CreateSeasonDialogProps {
  leagueId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the newly created season so the caller can select it. */
  onCreated: (season: Season) => void;
}

const EMPTY = { name: '', startDate: '', endDate: '', bracketType: '' };

/**
 * Inline "create season" modal, in the spirit of Laravel Filament's
 * createOptionForm: lets an admin add a season without leaving the form they're
 * on. Requires a league (a season always belongs to one). On success it hands
 * the created season back to the caller to select.
 */
export default function CreateSeasonDialog({
  leagueId,
  open,
  onOpenChange,
  onCreated,
}: CreateSeasonDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset each time the dialog opens so it never shows stale input.
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Season name is required');
    if (!form.startDate) return setError('Start date is required');
    if (!form.endDate) return setError('End date is required');
    if (form.endDate < form.startDate) return setError('End date must be on or after the start date');
    if (!leagueId) return setError('Select a league first');

    try {
      setSaving(true);
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          leagueId,
          bracketType: form.bracketType || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Failed to create season');
      }

      const season = (await response.json()) as Season;
      onCreated(season);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create season');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New season</DialogTitle>
          <DialogDescription>Create a season in the selected league.</DialogDescription>
        </DialogHeader>

        {/* Not a nested <form> — this dialog is rendered inside the match form,
            so we submit via the button's onClick to avoid nested-form issues. */}
        <div className="space-y-4">
          {!leagueId && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select a league on the match form first — a season belongs to a league.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-season-name">
              Season Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-season-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., 2025-2026"
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-season-start">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-season-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-season-end">
                End Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-season-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-season-bracket" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Tournament Bracket Type
            </Label>
            <Select
              value={form.bracketType || 'none'}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, bracketType: v === 'none' ? '' : v }))
              }
              disabled={saving}
            >
              <SelectTrigger id="new-season-bracket">
                <SelectValue placeholder="Select bracket type (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                <SelectItem value="single">Single Elimination</SelectItem>
                <SelectItem value="double">Double Elimination</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !leagueId}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create season'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
