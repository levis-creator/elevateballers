import { Badge } from '@/components/ui/badge';
import { isStringArray } from '../../domain/usecases/mediaUtils';

interface MediaTagsProps {
  tags: unknown;
  limit?: number;
  className?: string;
}

export default function MediaTags({ tags, limit = 3, className = '' }: MediaTagsProps) {
  if (!isStringArray(tags) || tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.slice(0, limit).map((tag, index) => (
        <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
      {tags.length > limit && (
        <Badge variant="outline" className="text-xs">
          +{tags.length - limit}
        </Badge>
      )}
    </div>
  );
}
