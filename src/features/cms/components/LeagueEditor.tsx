import { useState, useEffect } from 'react';
import type { League } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, AlertCircle, Loader2, Save, X } from 'lucide-react';

interface LeagueEditorProps {
  leagueId?: string;
}

export default function LeagueEditor({ leagueId }: LeagueEditorProps) {
  const [loading, setLoading] = useState(!!leagueId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    active: true,
  });

  useEffect(() => {
    if (leagueId) {
      fetchLeague();
    }
  }, [leagueId]);

  const fetchLeague = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leagues/${leagueId}`);
      if (!response.ok) throw new Error('Failed to fetch league');
      const league: League = await response.json();

      setFormData({
        name: league.name,
        slug: league.slug,
        description: league.description || '',
        logo: league.logo || '',
        active: league.active,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load league');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = leagueId ? `/api/leagues/${leagueId}` : '/api/leagues';
      const method = leagueId ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        logo: formData.logo || undefined,
        active: formData.active,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save league');
      }

      window.location.href = '/admin/leagues';
    } catch (err: any) {
      setError(err.message || 'Failed to save league');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground">
            {leagueId ? 'Edit League' : 'Create New League'}
          </h1>
          <p className="text-muted-foreground">
            {leagueId ? 'Update league information' : 'Create a new league'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin/leagues" data-astro-prefetch>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </a>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>League Information</CardTitle>
            <CardDescription>Enter the details for this league</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  League Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={saving}
                  placeholder="League name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="Auto-generated from name"
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to auto-generate from name
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                disabled={saving}
                placeholder="League description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, logo: e.target.value }))}
                  disabled={saving}
                  placeholder="https://example.com/logo.png"
                />
                {formData.logo && (
                  <div className="mt-2">
                    <img
                      src={formData.logo}
                      alt="Logo preview"
                      className="h-16 w-16 object-contain border rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <Select
                  value={formData.active ? 'true' : 'false'}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, active: value === 'true' }))}
                  disabled={saving}
                >
                  <SelectTrigger id="active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {leagueId ? 'Update League' : 'Create League'}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/admin/leagues" data-astro-prefetch>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </a>
          </Button>
        </div>
      </form>
    </div>
  );
}
