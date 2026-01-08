import { useState, useEffect, type ComponentType } from 'react';
import type { ReportType, ReportFormat } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReportGeneratorProps {
  onGenerate?: (reportGenerationId: string) => void;
}

const REPORT_TYPES: ReportType[] = [
  'GAME_STATISTICS',
  'KEY_GAME_STATISTICS',
  'PLAYER_STATISTICS',
  'TEAM_STATISTICS',
  'PLAY_BY_PLAY',
  'SHOT_CHART',
  'TURNOVER_TYPES',
  'FOUL_TYPES',
];

const REPORT_FORMATS: ReportFormat[] = ['PDF', 'CSV'];

export default function ReportGenerator({ onGenerate }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [icons, setIcons] = useState<{
    FileText?: ComponentType<any>;
    Download?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    CheckCircle?: ComponentType<any>;
  }>({});

  const [formData, setFormData] = useState({
    reportType: '' as ReportType | '',
    format: 'CSV' as ReportFormat,
    matchId: '',
    playerId: '',
    teamId: '',
    seasonId: '',
  });

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        FileText: mod.FileText,
        Download: mod.Download,
        AlertCircle: mod.AlertCircle,
        CheckCircle: mod.CheckCircle,
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const parameters: Record<string, any> = {};
      if (formData.matchId) parameters.matchId = formData.matchId;
      if (formData.playerId) parameters.playerId = formData.playerId;
      if (formData.teamId) parameters.teamId = formData.teamId;
      if (formData.seasonId) parameters.seasonId = formData.seasonId;

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: formData.reportType,
          format: formData.format,
          parameters,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate report');
      }

      const data = await response.json();
      setSuccess(`Report generated successfully! ID: ${data.reportGenerationId}`);
      
      if (onGenerate) {
        onGenerate(data.reportGenerationId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const FileTextIcon = icons.FileText;
  const DownloadIcon = icons.Download;
  const AlertCircleIcon = icons.AlertCircle;
  const CheckCircleIcon = icons.CheckCircle;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          {AlertCircleIcon ? <AlertCircleIcon className="h-4 w-4" /> : null}
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          {CheckCircleIcon ? <CheckCircleIcon className="h-4 w-4" /> : null}
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type *</Label>
              <Select
                value={formData.reportType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, reportType: value as ReportType }))
                }
                required
              >
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format *</Label>
              <Select
                value={formData.format}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, format: value as ReportFormat }))
                }
                required
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
          <CardDescription>Specify data filters for the report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matchId">Match ID</Label>
              <Input
                id="matchId"
                value={formData.matchId}
                onChange={(e) => setFormData((prev) => ({ ...prev, matchId: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerId">Player ID</Label>
              <Input
                id="playerId"
                value={formData.playerId}
                onChange={(e) => setFormData((prev) => ({ ...prev, playerId: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamId">Team ID</Label>
              <Input
                id="teamId"
                value={formData.teamId}
                onChange={(e) => setFormData((prev) => ({ ...prev, teamId: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seasonId">Season ID</Label>
              <Input
                id="seasonId"
                value={formData.seasonId}
                onChange={(e) => setFormData((prev) => ({ ...prev, seasonId: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading}>
          {DownloadIcon ? <DownloadIcon size={18} className="mr-2" /> : null}
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>
    </form>
  );
}
