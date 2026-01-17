/**
 * Bracket Generator Dialog
 * Allows users to select teams and automatically generate tournament brackets
 * Supports both single and double elimination
 * Users only need to schedule days
 */

import React, { useState, useEffect } from 'react';
import type { Team } from '../../cms/types';
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
import { AlertCircle, Calendar, Trophy, Loader2, Users, Info, X, Plus, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { calculateBracketStats } from '../lib/bracket-stats';
import type { GeneratedMatch } from '../lib/bracket-generator';
import BracketReviewDialog from './BracketReviewDialog';
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

interface BracketGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  seasonId: string;
  leagueId?: string;
}

export default function BracketGeneratorDialog({
  isOpen,
  onClose,
  onSuccess,
  seasonId,
  leagueId,
}: BracketGeneratorDialogProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [tournamentDays, setTournamentDays] = useState<string[]>(['']);
  const [bracketType, setBracketType] = useState<'single' | 'double'>('single');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [previewMatches, setPreviewMatches] = useState<GeneratedMatch[]>([]);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
      fetchSeason();
      // Set default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setTournamentDays([tomorrow.toISOString().split('T')[0]]);
    } else {
      setSelectedTeamIds(new Set());
      setError('');
      setBracketType('single');
      setTournamentDays(['']);
      setWarnings([]);
    }
  }, [isOpen, seasonId]);

  const fetchSeason = async () => {
    if (!seasonId) return;
    try {
      const response = await fetch(`/api/seasons/${seasonId}`);
      if (response.ok) {
        const season = await response.json();
        // Use season's bracketType if set, otherwise default to 'single'
        if (season.bracketType && (season.bracketType === 'single' || season.bracketType === 'double')) {
          setBracketType(season.bracketType);
        }
      }
    } catch (err) {
      console.error('Failed to fetch season:', err);
    }
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = (await response.json()) as Team[];
        setTeams(data);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamId: string) => {
    const newSelected = new Set(selectedTeamIds);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeamIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTeamIds.size === teams.length) {
      setSelectedTeamIds(new Set());
    } else {
      setSelectedTeamIds(new Set(teams.map(t => t.id)));
    }
  };

  const handleAddDay = () => {
    setTournamentDays([...tournamentDays, '']);
  };

  const handleRemoveDay = (index: number) => {
    if (tournamentDays.length > 1) {
      setTournamentDays(tournamentDays.filter((_, i) => i !== index));
    }
  };

  const handleDayChange = (index: number, value: string) => {
    const newDays = [...tournamentDays];
    newDays[index] = value;
    setTournamentDays(newDays);
  };

  const validateDays = (): { valid: boolean; error?: string } => {
    const validDays = tournamentDays.filter(day => day.trim() !== '');
    if (validDays.length === 0) {
      return { valid: false, error: 'Please select at least one tournament day' };
    }

    // Check for duplicate days
    const uniqueDays = new Set(validDays);
    if (uniqueDays.size !== validDays.length) {
      return { valid: false, error: 'Please remove duplicate tournament days' };
    }

    // Check if days are in chronological order (optional, just a warning)
    const sortedDays = [...validDays].sort();
    if (JSON.stringify(validDays) !== JSON.stringify(sortedDays)) {
      // Days are not in order, but we'll allow it and just sort them
    }

    return { valid: true };
  };

  const handleGenerateClick = () => {
    if (selectedTeamIds.size < 2) {
      setError('Please select at least 2 teams');
      return;
    }

    // Check for duplicate team IDs (shouldn't happen with Set, but double-check)
    const uniqueTeamIds = Array.from(selectedTeamIds);
    if (uniqueTeamIds.length !== selectedTeamIds.size) {
      setError('Duplicate teams detected. Please ensure each team is only selected once.');
      return;
    }

    const validation = validateDays();
    if (!validation.valid) {
      setError(validation.error || 'Invalid tournament days');
      return;
    }

    setError('');
    setShowConfirmDialog(true);
  };

  const handleConfirmGenerate = async () => {
    setShowConfirmDialog(false);
    setGenerating(true);
    setError('');

    try {
      const validDays = tournamentDays.filter(day => day.trim() !== '').sort();
      const dayDates = validDays.map(day => new Date(day));

      // Preview bracket first (generate without saving)
      const previewResponse = await fetch('/api/tournaments/preview-bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamIds: Array.from(selectedTeamIds),
          seasonId,
          leagueId,
          tournamentDays: dayDates.map(d => d.toISOString()),
          bracketType,
        }),
      });

      if (!previewResponse.ok) {
        const errorData = await previewResponse.json();
        throw new Error(errorData.error || 'Failed to preview bracket');
      }

      const previewResult = await previewResponse.json();
      
      // Show warnings if any
      if (previewResult.warnings && previewResult.warnings.length > 0) {
        setWarnings(previewResult.warnings);
      }

      // Convert date strings back to Date objects
      const matchesWithDates: GeneratedMatch[] = previewResult.matches.map((match: any) => ({
        ...match,
        date: new Date(match.date),
      }));

      setPreviewMatches(matchesWithDates);
      setShowReviewDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to preview bracket');
    } finally {
      setGenerating(false);
      setGenerationProgress(null);
    }
  };

  const handleApproveMatches = async (approvedMatches: GeneratedMatch[]) => {
    setShowReviewDialog(false);
    setGenerating(true);
    setError('');

    try {
      const validDays = tournamentDays.filter(day => day.trim() !== '').sort();
      const dayDates = validDays.map(day => new Date(day));
      
      // Estimate total matches for progress
      setGenerationProgress({ current: 0, total: approvedMatches.length });

      // Now create the matches with the approved/edited matches
      const response = await fetch('/api/tournaments/generate-bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamIds: Array.from(selectedTeamIds),
          seasonId,
          leagueId,
          tournamentDays: dayDates.map(d => d.toISOString()),
          bracketType,
          matches: approvedMatches.map(m => ({
            ...m,
            date: m.date.toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create matches');
      }

      const result = await response.json();
      setGenerationProgress({ current: result.created, total: result.expected || result.created });
      
      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      }
      
      // Show errors if partial success
      if (result.errors && result.errors.length > 0) {
        setError(`Some matches failed to create: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`);
      }
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Only close if fully successful
      if (result.success !== false) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create matches');
      setGenerationProgress(null);
    } finally {
      setGenerating(false);
      setGenerationProgress(null);
    }
  };

  const selectedCount = selectedTeamIds.size;
  const stats = selectedCount >= 2 
    ? calculateBracketStats(selectedCount, bracketType)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Tournament Bracket</DialogTitle>
          <DialogDescription>
            Select teams, bracket type, and tournament days
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Warnings:</strong>
                <ul className="list-disc list-inside text-sm">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Bracket Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="bracketType">Bracket Type</Label>
            <Select
              value={bracketType}
              onValueChange={(value) => setBracketType(value as 'single' | 'double')}
              disabled={generating}
            >
              <SelectTrigger id="bracketType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Elimination</SelectItem>
                <SelectItem value="double">Double Elimination</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                {bracketType === 'single' ? (
                  <span>Teams are eliminated after one loss. Fastest tournament format.</span>
                ) : (
                  <span>Teams must lose twice to be eliminated. More matches, more competitive.</span>
                )}
              </div>
            </div>
          </div>

          {/* Team Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                <Users className="inline h-4 w-4 mr-2" />
                Select Teams ({selectedCount} selected)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedTeamIds.size === teams.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                    >
                      <Checkbox
                        checked={selectedTeamIds.has(team.id)}
                        onCheckedChange={() => handleTeamToggle(team.id)}
                      />
                      <span className="flex-1">{team.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tournament Days */}
          <div className="space-y-2">
            <Label>
              <Calendar className="inline h-4 w-4 mr-2" />
              Tournament Days
            </Label>
            <div className="space-y-2">
              {tournamentDays.map((day, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="date"
                    value={day}
                    onChange={(e) => handleDayChange(index, e.target.value)}
                    className="flex-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {tournamentDays.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveDay(index)}
                      disabled={generating}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDay}
                className="w-full"
                disabled={generating}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Day
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Matches will be automatically scheduled across these days. Early rounds first, finals on the last day.
              </p>
              {tournamentDays.filter(d => d.trim() !== '').length > 1 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Days will be sorted chronologically if not in order
                </p>
              )}
            </div>
          </div>

          {/* Bracket Preview */}
          {stats && (
            <Alert className="bg-muted/50">
              <Trophy className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-semibold">Total Matches:</span> {stats.totalMatches}
                    </div>
                    <div>
                      <span className="font-semibold">Rounds:</span> {stats.rounds}
                    </div>
                  </div>
                  {stats.byes > 0 && (
                    <div className="text-sm text-muted-foreground border-t pt-2">
                      <Info className="inline h-3 w-3 mr-1" />
                      {stats.byes} bye(s) will be added to round up to {Math.pow(2, stats.rounds)} teams
                    </div>
                  )}
                  {bracketType === 'double' && stats.upperMatches && stats.lowerMatches && (
                    <div className="text-sm space-y-1 border-t pt-2">
                      <div className="font-semibold mb-1">Bracket Breakdown:</div>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div>Upper Bracket: ~{stats.upperMatches} matches</div>
                        <div>Lower Bracket: ~{stats.lowerMatches} matches</div>
                        <div className="col-span-2">Grand Final: 1-2 matches</div>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Generation Progress */}
          {generationProgress && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Generating matches...</span>
                    <span>{generationProgress.current} / {generationProgress.total}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(generationProgress.current / generationProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerateClick}
            disabled={generating || selectedCount < 2 || tournamentDays.every(d => !d.trim())}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                Generate Bracket
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Review Dialog */}
      <BracketReviewDialog
        isOpen={showReviewDialog}
        onClose={() => {
          setShowReviewDialog(false);
          setPreviewMatches([]);
        }}
        onApprove={handleApproveMatches}
        matches={previewMatches}
        teams={teams.filter(t => selectedTeamIds.has(t.id))}
        bracketType={bracketType}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bracket Generation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to generate a <strong>{bracketType === 'single' ? 'single' : 'double'}</strong> elimination bracket with{' '}
              <strong>{selectedCount}</strong> teams, <strong>{stats?.totalMatches || 0}</strong> total matches, and{' '}
              <strong>{tournamentDays.filter(d => d.trim() !== '').length}</strong> tournament day(s). This will create all matches automatically. You can edit them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmGenerate} disabled={generating}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Generate Bracket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
