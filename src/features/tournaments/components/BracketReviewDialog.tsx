/**
 * Bracket Review Dialog
 * Allows users to review and edit matches before saving to database
 */

import React, { useState } from 'react';
import type { GeneratedMatch } from '../lib/bracket-generator';
import type { MatchStage } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, X, Edit2, Save, XCircle, Calendar, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BracketReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (matches: GeneratedMatch[]) => void;
  matches: GeneratedMatch[];
  teams: Array<{ id: string; name: string }>;
  bracketType?: 'single' | 'double';
}

const MATCH_STAGES: MatchStage[] = [
  'REGULAR_SEASON',
  'PRESEASON',
  'EXHIBITION',
  'PLAYOFF',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'CHAMPIONSHIP',
  'QUALIFIER',
  'OTHER',
];

export default function BracketReviewDialog({
  isOpen,
  onClose,
  onApprove,
  matches: initialMatches,
  teams,
  bracketType = 'single',
}: BracketReviewDialogProps) {
  const [matches, setMatches] = useState<GeneratedMatch[]>(initialMatches);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Reset matches when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setMatches(initialMatches);
      setEditingIndex(null);
      setError('');
    }
  }, [isOpen, initialMatches]);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setError('');
  };

  const handleSaveEdit = (index: number) => {
    const match = matches[index];
    
    // Validate
    if (match.team1Id && match.team2Id && match.team1Id === match.team2Id) {
      setError('A team cannot be matched against itself');
      return;
    }

    setEditingIndex(null);
    setError('');
  };

  const handleCancelEdit = () => {
    // Reset only the match being edited to its original state
    if (editingIndex !== null) {
      const updated = [...matches];
      updated[editingIndex] = { ...initialMatches[editingIndex] };
      setMatches(updated);
    }
    setEditingIndex(null);
    setError('');
  };

  const handleMatchChange = (index: number, field: keyof GeneratedMatch, value: any) => {
    const updated = [...matches];
    updated[index] = { ...updated[index], [field]: value };
    
    // Update team name when team ID changes
    if (field === 'team1Id') {
      if (value) {
        const team = teams.find(t => t.id === value);
        updated[index].team1Name = team?.name || null;
      } else {
        updated[index].team1Name = 'TBD';
      }
    } else if (field === 'team2Id') {
      if (value) {
        const team = teams.find(t => t.id === value);
        updated[index].team2Name = team?.name || null;
      } else {
        updated[index].team2Name = 'TBD';
      }
    }
    
    setMatches(updated);
  };

  const handleDateChange = (index: number, dateValue: string, timeValue: string) => {
    const date = new Date(dateValue);
    const [hours, minutes] = timeValue.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    handleMatchChange(index, 'date', date);
  };

  const handleApprove = () => {
    // Final validation
    const invalidMatches = matches.filter(m => 
      m.team1Id && m.team2Id && m.team1Id === m.team2Id
    );
    
    if (invalidMatches.length > 0) {
      setError(`${invalidMatches.length} match(es) have a team playing against itself. Please fix before approving.`);
      return;
    }

    onApprove(matches);
  };

  const getStageBadge = (stage: MatchStage) => {
    const stageLabels: Record<MatchStage, string> = {
      CHAMPIONSHIP: 'Championship',
      SEMI_FINALS: 'Semi-Finals',
      QUARTER_FINALS: 'Quarter-Finals',
      PLAYOFF: 'Playoff',
      REGULAR_SEASON: 'Regular Season',
      PRESEASON: 'Preseason',
      EXHIBITION: 'Exhibition',
      QUALIFIER: 'Qualifier',
      OTHER: 'Other',
    };

    const colors: Record<MatchStage, string> = {
      CHAMPIONSHIP: 'bg-yellow-500',
      SEMI_FINALS: 'bg-blue-500',
      QUARTER_FINALS: 'bg-purple-500',
      PLAYOFF: 'bg-orange-500',
      REGULAR_SEASON: 'bg-green-500',
      PRESEASON: 'bg-gray-500',
      EXHIBITION: 'bg-gray-400',
      QUALIFIER: 'bg-indigo-500',
      OTHER: 'bg-gray-300',
    };

    return (
      <Badge variant="outline" className={`${colors[stage]} text-white border-0`}>
        {stageLabels[stage]}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Review Bracket Matches
            {bracketType === 'double' && (
              <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Double Elimination
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Review and edit the generated matches before saving. Click edit on any match to modify it.
            {bracketType === 'double' && (
              <span className="block mt-1 text-xs">
                Matches are organized into upper and lower brackets. Winners advance in upper bracket, losers drop to lower bracket.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match #</TableHead>
                  {bracketType === 'double' && <TableHead>Bracket</TableHead>}
                  <TableHead>Stage</TableHead>
                  <TableHead>Team 1</TableHead>
                  <TableHead>Team 2</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match, index) => {
                  const isEditing = editingIndex === index;
                  const matchDate = typeof match.date === 'string' ? new Date(match.date) : match.date;
                  const dateStr = matchDate.toISOString().split('T')[0];
                  const timeStr = `${String(matchDate.getHours()).padStart(2, '0')}:${String(matchDate.getMinutes()).padStart(2, '0')}`;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{match.matchNumber}</TableCell>
                      {bracketType === 'double' && (
                        <TableCell>
                          <Badge variant="outline" className={
                            match.bracketType === 'upper' ? 'bg-blue-100 text-blue-800' :
                            match.bracketType === 'lower' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {match.bracketType === 'upper' ? 'Upper' :
                             match.bracketType === 'lower' ? 'Lower' :
                             'Grand Final'}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={match.stage}
                            onValueChange={(value) => handleMatchChange(index, 'stage', value as MatchStage)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MATCH_STAGES.map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                  {stage.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          getStageBadge(match.stage)
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={match.team1Id || ''}
                            onValueChange={(value) => handleMatchChange(index, 'team1Id', value || null)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select Team 1" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">TBD</SelectItem>
                              {teams
                                .filter(team => team.id !== match.team2Id) // Don't show team2 in team1 dropdown
                                .map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={!match.team1Id ? 'text-muted-foreground italic' : ''}>
                            {match.team1Name || 'TBD'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={match.team2Id || ''}
                            onValueChange={(value) => handleMatchChange(index, 'team2Id', value || null)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select Team 2" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">TBD</SelectItem>
                              {teams
                                .filter(team => team.id !== match.team1Id) // Don't show team1 in team2 dropdown
                                .map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={!match.team2Id ? 'text-muted-foreground italic' : ''}>
                            {match.team2Name || 'TBD'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={dateStr}
                            onChange={(e) => handleDateChange(index, e.target.value, timeStr)}
                            className="w-40"
                          />
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(matchDate)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="time"
                            value={timeStr}
                            onChange={(e) => handleDateChange(index, dateStr, e.target.value)}
                            className="w-32"
                          />
                        ) : (
                          formatTime(matchDate)
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveEdit(index)}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(index)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div><strong>Total Matches:</strong> {matches.length}</div>
                <div className="text-sm text-muted-foreground">
                  Review all matches above. You can edit any match before approving. Once approved, matches will be saved to the database.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="button" onClick={handleApprove}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve & Create Matches
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
