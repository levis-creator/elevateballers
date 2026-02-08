import * as React from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PlayerWithTeam } from '../types';

interface PlayerSelectorProps {
  players: PlayerWithTeam[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function PlayerSelector({ players, selectedId, onSelect, className }: PlayerSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const selectedPlayer = players.find((p) => p.id === selectedId);

  const filteredPlayers = players.filter((p) => {
    const searchStr = `${p.firstName} ${p.lastName} ${p.team?.name || ''}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  // Handle click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus search input when opened
  React.useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {/* Trigger */}
      <div
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/50 transition-colors',
          isOpen && 'ring-2 ring-ring ring-offset-2 border-transparent'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn('truncate', !selectedPlayer && 'text-muted-foreground')}>
          {selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : 'Select a player...'}
        </span>
        <div className="flex items-center gap-1">
          {selectedId && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity"
              onClick={handleClear}
            />
          )}
          <div className="h-4 w-px bg-border mx-1" />
          <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
        </div>
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[300px] rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 border-none focus-visible:ring-0 shadow-none bg-muted/50"
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-auto p-1 custom-scrollbar">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                    selectedId === player.id && 'bg-accent/50'
                  )}
                  onClick={() => {
                    onSelect(player.id);
                    setIsOpen(false);
                  }}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {selectedId === player.id && <Check className="h-4 w-4" />}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium">{player.firstName} {player.lastName}</span>
                    <span className="text-xs text-muted-foreground">{player.team?.name || 'Free Agent'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No players found mapping "{searchTerm}"
              </div>
            )}
          </div>

          <div className="mt-1 border-t flex items-center h-10">
             <button 
              type="button"
              className="flex-1 text-sm h-full hover:bg-accent transition-colors"
              onClick={() => {
                onSelect('');
                setIsOpen(false);
              }}
            >
              Clear
            </button>
            <div className="w-px h-6 bg-border" />
            <button 
              type="button"
              className="flex-1 text-sm h-full hover:bg-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
