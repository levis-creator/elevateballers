import type { MediaType } from '../types';
import type { ComponentType } from 'react';

export function getMediaTypeColor(type: MediaType): string {
  const colors: Record<MediaType, string> = {
    IMAGE: 'bg-primary',
    VIDEO: 'bg-red-500',
    AUDIO: 'bg-green-500',
    DOCUMENT: 'bg-amber-500',
  };
  return colors[type] || 'bg-slate-500';
}

export function getMediaIcon(
  type: MediaType,
  icons: {
    Image?: ComponentType<any>;
    Video?: ComponentType<any>;
    Music?: ComponentType<any>;
    FileText?: ComponentType<any>;
  }
): ComponentType<any> | null {
  if (type === 'IMAGE') return icons.Image || null;
  if (type === 'VIDEO') return icons.Video || null;
  if (type === 'AUDIO') return icons.Music || null;
  if (type === 'DOCUMENT') return icons.FileText || null;
  return null;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
