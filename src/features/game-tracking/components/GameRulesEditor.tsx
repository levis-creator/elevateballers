import { useState, useEffect, type ComponentType } from 'react';
import type { GameRules } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface GameRulesEditorProps {
  rulesId?: string;
  onSave?: (rules: GameRules) => void;
}

export default function GameRulesEditor({ rulesId, onSave }: GameRulesEditorProps) {
  const [loading, setLoading] = useState(!!rulesId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [icons, setIcons] = useState<{
    Save?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
  }>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    numberOfPeriods: 4,
    minutesPerPeriod: 10,
    overtimeLength: 5,
    halftimePeriod: 2,
    halftimeDurationMinutes: 15,
    timeouts60Second: 6,
    timeouts30Second: 2,
    timeoutsPerOvertime: 2,
    resetTimeoutsPerPeriod: false,
    foulsForBonus: 5,
    foulsForDoubleBonus: 10,
    enableThreePointShots: true,
    foulsToFoulOut: 5,
    displayGameClock: true,
    trackTurnoverTypes: false,
    trackFoulTypes: false,
    trackPlayingTime: false,
    recordShotLocations: false,
  });

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Save: mod.Save,
        AlertCircle: mod.AlertCircle,
      });
    });
  }, []);

  useEffect(() => {
    if (rulesId) {
      fetchRules();
    }
  }, [rulesId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/game-rules?id=${rulesId}`);
      if (!response.ok) throw new Error('Failed to fetch game rules');
      const data = await response.json();
      setFormData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load game rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = rulesId ? `/api/game-rules/${rulesId}` : '/api/game-rules';
      const method = rulesId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save game rules');

      const data = await response.json();
      if (onSave) {
        onSave(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save game rules');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const SaveIcon = icons.Save;
  const AlertCircleIcon = icons.AlertCircle;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              {AlertCircleIcon ? <AlertCircleIcon size={20} /> : null}
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>General rules configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Period Configuration</CardTitle>
          <CardDescription>Game structure settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numberOfPeriods">Number of Periods</Label>
              <Input
                id="numberOfPeriods"
                type="number"
                value={formData.numberOfPeriods}
                onChange={(e) => handleChange('numberOfPeriods', parseInt(e.target.value))}
                min={1}
              />
            </div>
            <div>
              <Label htmlFor="minutesPerPeriod">Minutes per Period</Label>
              <Input
                id="minutesPerPeriod"
                type="number"
                value={formData.minutesPerPeriod}
                onChange={(e) => handleChange('minutesPerPeriod', parseInt(e.target.value))}
                min={1}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="overtimeLength">Overtime Length (minutes)</Label>
              <Input
                id="overtimeLength"
                type="number"
                value={formData.overtimeLength}
                onChange={(e) => handleChange('overtimeLength', parseInt(e.target.value))}
                min={1}
              />
            </div>
            <div>
              <Label htmlFor="halftimePeriod">Halftime Period</Label>
              <Input
                id="halftimePeriod"
                type="number"
                value={formData.halftimePeriod}
                onChange={(e) => handleChange('halftimePeriod', parseInt(e.target.value))}
                min={1}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="halftimeDurationMinutes">Halftime Duration (minutes)</Label>
            <Input
              id="halftimeDurationMinutes"
              type="number"
              value={formData.halftimeDurationMinutes}
              onChange={(e) => handleChange('halftimeDurationMinutes', parseInt(e.target.value))}
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeout Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="timeouts60Second">60 Second Timeouts</Label>
              <Input
                id="timeouts60Second"
                type="number"
                value={formData.timeouts60Second}
                onChange={(e) => handleChange('timeouts60Second', parseInt(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="timeouts30Second">30 Second Timeouts</Label>
              <Input
                id="timeouts30Second"
                type="number"
                value={formData.timeouts30Second}
                onChange={(e) => handleChange('timeouts30Second', parseInt(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="timeoutsPerOvertime">Per Overtime</Label>
              <Input
                id="timeoutsPerOvertime"
                type="number"
                value={formData.timeoutsPerOvertime}
                onChange={(e) => handleChange('timeoutsPerOvertime', parseInt(e.target.value))}
                min={0}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="resetTimeoutsPerPeriod"
              checked={formData.resetTimeoutsPerPeriod}
              onCheckedChange={(checked) => handleChange('resetTimeoutsPerPeriod', checked)}
            />
            <Label htmlFor="resetTimeoutsPerPeriod">Reset timeouts per period</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foul Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="foulsForBonus">Fouls for Bonus</Label>
              <Input
                id="foulsForBonus"
                type="number"
                value={formData.foulsForBonus}
                onChange={(e) => handleChange('foulsForBonus', parseInt(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="foulsForDoubleBonus">Fouls for Double Bonus</Label>
              <Input
                id="foulsForDoubleBonus"
                type="number"
                value={formData.foulsForDoubleBonus}
                onChange={(e) => handleChange('foulsForDoubleBonus', parseInt(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="foulsToFoulOut">Fouls to Foul Out</Label>
              <Input
                id="foulsToFoulOut"
                type="number"
                value={formData.foulsToFoulOut}
                onChange={(e) => handleChange('foulsToFoulOut', parseInt(e.target.value))}
                min={0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Enable or disable tracking features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableThreePointShots">Enable Three-Point Shots</Label>
            <Switch
              id="enableThreePointShots"
              checked={formData.enableThreePointShots}
              onCheckedChange={(checked) => handleChange('enableThreePointShots', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="displayGameClock">Display Game Clock</Label>
            <Switch
              id="displayGameClock"
              checked={formData.displayGameClock}
              onCheckedChange={(checked) => handleChange('displayGameClock', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="trackTurnoverTypes">Track Turnover Types</Label>
            <Switch
              id="trackTurnoverTypes"
              checked={formData.trackTurnoverTypes}
              onCheckedChange={(checked) => handleChange('trackTurnoverTypes', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="trackFoulTypes">Track Foul Types</Label>
            <Switch
              id="trackFoulTypes"
              checked={formData.trackFoulTypes}
              onCheckedChange={(checked) => handleChange('trackFoulTypes', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="trackPlayingTime">Track Playing Time</Label>
            <Switch
              id="trackPlayingTime"
              checked={formData.trackPlayingTime}
              onCheckedChange={(checked) => handleChange('trackPlayingTime', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="recordShotLocations">Record Shot Locations</Label>
            <Switch
              id="recordShotLocations"
              checked={formData.recordShotLocations}
              onCheckedChange={(checked) => handleChange('recordShotLocations', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={saving}>
          {SaveIcon ? <SaveIcon size={18} className="mr-2" /> : null}
          {saving ? 'Saving...' : 'Save Rules'}
        </Button>
      </div>
    </form>
  );
}
