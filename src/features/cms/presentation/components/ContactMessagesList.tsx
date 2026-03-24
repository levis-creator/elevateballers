import { useEffect, useMemo, useState, type ComponentType } from 'react';
import type { ContactMessage } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ToastProvider, useToast } from '@/components/ui/toast';

function ContactMessagesContent() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addToast } = useToast();
  const [icons, setIcons] = useState<{
    RefreshCw?: ComponentType<any>;
    Mail?: ComponentType<any>;
    Filter?: ComponentType<any>;
    MessageSquare?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        RefreshCw: mod.RefreshCw,
        Mail: mod.Mail,
        Filter: mod.Filter,
        MessageSquare: mod.MessageSquare,
      });
    });
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [unreadOnly]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const url = unreadOnly ? '/api/contact-messages?unread=true' : '/api/contact-messages';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch contact messages');
      const data = await response.json();
      setMessages(Array.isArray(data.data) ? data.data : []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const filteredMessages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return messages;
    return messages.filter((message) =>
      message.name.toLowerCase().includes(term) ||
      message.email.toLowerCase().includes(term) ||
      message.subject.toLowerCase().includes(term) ||
      message.message.toLowerCase().includes(term)
    );
  }, [messages, searchTerm]);

  const handleToggleRead = async (id: string, read: boolean, toastMessage?: string) => {
    setUpdating((prev) => new Set(prev).add(id));
    try {
      const response = await fetch('/api/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read }),
      });
      if (!response.ok) throw new Error('Failed to update message');
      const updated = await response.json();
      setMessages((prev) => prev.map((msg) => (msg.id === id ? updated : msg)));
      if (toastMessage) {
        addToast({ variant: 'success', title: 'Success', description: toastMessage });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update message');
      setTimeout(() => setError(''), 4000);
      addToast({ variant: 'error', title: 'Error', description: err.message || 'Failed to update message' });
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setExpandedId((prev) => (prev === message.id ? null : message.id));
    if (!message.read) {
      await handleToggleRead(message.id, true, 'Message marked as read');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');
    if (!targetId) return;
    const target = messages.find((msg) => msg.id === targetId);
    if (target) {
      handleViewMessage(target);
    }
  }, [messages]);

  const RefreshIcon = icons.RefreshCw;
  const MailIcon = icons.Mail;
  const FilterIcon = icons.Filter;
  const MessageIcon = icons.MessageSquare;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">Contact Messages</h1>
          <p className="text-sm text-muted-foreground">
            Manage messages submitted through the public contact form.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={unreadOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUnreadOnly((prev) => !prev)}
            className="gap-2"
          >
            {FilterIcon ? <FilterIcon size={16} /> : null}
            {unreadOnly ? 'Showing unread' : 'All messages'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMessages} className="gap-2">
            {RefreshIcon ? <RefreshIcon size={16} /> : null}
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Input
                placeholder="Search name, email, subject, or message"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredMessages.length} message{filteredMessages.length === 1 ? '' : 's'}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Sender</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[160px]">Received</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Loading messages...
                  </TableCell>
                </TableRow>
              ) : filteredMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No contact messages found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMessages.map((message) => (
                  <>
                  <TableRow key={message.id} className={cn(!message.read && 'bg-muted/40')}>
                    <TableCell>
                      <div className="font-medium text-foreground">{message.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {MailIcon ? <MailIcon size={12} /> : null}
                        <a className="hover:underline" href={`mailto:${message.email}`}>
                          {message.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {MessageIcon ? <MessageIcon size={16} className="mt-0.5 text-muted-foreground" /> : null}
                        <div>
                          <div className="font-medium text-foreground">{message.subject}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {message.message.length > 160
                              ? `${message.message.slice(0, 160)}...`
                              : message.message}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={message.read ? 'secondary' : 'default'}>
                        {message.read ? 'Read' : 'Unread'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMessage(message)}
                        className="mr-2"
                      >
                        {expandedId === message.id ? 'Hide' : 'View'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updating.has(message.id)}
                        onClick={() =>
                          handleToggleRead(
                            message.id,
                            !message.read,
                            message.read ? 'Message marked as unread' : 'Message marked as read'
                          )
                        }
                      >
                        {message.read ? 'Mark unread' : 'Mark read'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedId === message.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-background">
                        <div className="rounded-lg border border-border p-4 text-sm text-foreground">
                          {message.message}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ContactMessagesList() {
  return (
    <ToastProvider>
      <ContactMessagesContent />
    </ToastProvider>
  );
}
