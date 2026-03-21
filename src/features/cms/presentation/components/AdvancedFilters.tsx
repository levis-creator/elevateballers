import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMediaGalleryStore } from '../../stores/mediaGalleryStore';

export default function AdvancedFilters() {
  const {
    filterSizeMin,
    filterSizeMax,
    filterDateFrom,
    filterDateTo,
    filterUploader,
    setFilterSizeMin,
    setFilterSizeMax,
    setFilterDateFrom,
    setFilterDateTo,
    setFilterUploader,
    clearFilters,
  } = useMediaGalleryStore();

  return (
    <Card className="animate-in slide-in-from-top-2 fade-in-0 duration-200">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">File Size (KB)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filterSizeMin}
                onChange={(e) => setFilterSizeMin(e.target.value)}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filterSizeMax}
                onChange={(e) => setFilterSizeMax(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Date</label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full"
              />
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Uploader Email</label>
            <Input
              type="text"
              placeholder="Filter by uploader..."
              value={filterUploader}
              onChange={(e) => setFilterUploader(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
