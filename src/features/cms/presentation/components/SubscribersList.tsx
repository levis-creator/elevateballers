import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToastProvider, useToast } from '@/components/ui/toast';

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  createdAt: string;
};

function SubscribersContent() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const { addToast } = useToast();

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscribers?active=${activeOnly}`);
      if (!res.ok) throw new Error('Failed to load');
      setSubscribers(await res.json());
    } catch {
      addToast({ title: 'Error', description: 'Failed to load subscribers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscribers(); }, [activeOnly]);

  const filtered = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscribers</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} subscriber{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant={activeOnly ? 'default' : 'outline'}
          onClick={() => setActiveOnly(!activeOnly)}
          size="sm"
        >
          {activeOnly ? 'Active only' : 'All subscribers'}
        </Button>
        <Button variant="outline" size="sm" onClick={fetchSubscribers}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No subscribers found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.email}</TableCell>
                <TableCell>{s.name || '—'}</TableCell>
                <TableCell>
                  <Badge variant={s.active ? 'default' : 'secondary'}>
                    {s.active ? 'Active' : 'Unsubscribed'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(s.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function SubscribersList() {
  return (
    <ToastProvider>
      <SubscribersContent />
    </ToastProvider>
  );
}
