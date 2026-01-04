import { useMemo } from 'react';
import type { Team, TeamWithPlayerCount } from '../types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeamSelectProps {
  id: string;
  label: string;
  value: string;
  teams: (Team | TeamWithPlayerCount)[];
  loading: boolean;
  saving: boolean;
  error?: string;
  onSelect: (teamId: string) => void;
  customName: string;
  customLogo: string;
  onCustomNameChange: (name: string) => void;
  onCustomLogoChange: (logo: string) => void;
}

export default function TeamSelect({
  id,
  label,
  value,
  teams,
  loading,
  saving,
  error,
  onSelect,
  customName,
  customLogo,
  onCustomNameChange,
  onCustomLogoChange,
}: TeamSelectProps) {
  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === value),
    [teams, value]
  );

  const displayValue = selectedTeam ? selectedTeam.name : '';

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <Select
        value={value || "__custom"}
        onValueChange={(val) => onSelect(val === "__custom" ? "" : val)}
        disabled={saving || loading}
      >
        <SelectTrigger id={id} className="flex items-center gap-2">
          <SelectValue
            placeholder={
              loading
                ? 'Loading teams...'
                : teams.length > 0
                  ? 'Select a team from database...'
                  : 'No teams available - enter custom'
            }
          >
            {displayValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__custom">Custom Team</SelectItem>
          {teams.length === 0 && !loading && (
            <SelectItem value="__empty" disabled>
              No teams in database
            </SelectItem>
          )}
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center gap-2">
                {team.logo && (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-5 h-5 object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span>{team.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!value && (
        <div className="space-y-2 mt-2">
          <Input
            id={`${id}Name`}
            type="text"
            placeholder={`${label} Name`}
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            required={!value}
            disabled={saving}
          />
          <Input
            id={`${id}Logo`}
            type="url"
            placeholder={`${label} Logo URL`}
            value={customLogo}
            onChange={(e) => onCustomLogoChange(e.target.value)}
            disabled={saving}
          />
        </div>
      )}
      {loading && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading teams from database...
        </p>
      )}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {teams.length > 0
            ? `${teams.length} team${teams.length !== 1 ? 's' : ''} available from database`
            : 'No teams in database. You can enter a custom team name or create a team first.'}
        </p>
      )}
      {error && error.includes('teams') && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
          ⚠️ Unable to load teams from database. You can still enter custom team names below.
        </p>
      )}
    </div>
  );
}

