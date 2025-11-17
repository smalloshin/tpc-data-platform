import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Filter } from "lucide-react";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (value: { start: string; end: string }) => void;
  region: string;
  setRegion: (value: string) => void;
}

const SearchFilters = ({
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  region,
  setRegion,
}: SearchFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">搜尋與篩選</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋用戶編號、地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          placeholder="開始日期"
        />
        
        <Input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          placeholder="結束日期"
        />
        
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger>
            <SelectValue placeholder="選擇地區" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部地區</SelectItem>
            <SelectItem value="north">北部地區</SelectItem>
            <SelectItem value="central">中部地區</SelectItem>
            <SelectItem value="south">南部地區</SelectItem>
            <SelectItem value="east">東部地區</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        <Button className="gap-2">
          <Search className="h-4 w-4" />
          查詢
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          匯出資料
        </Button>
      </div>
    </div>
  );
};

export default SearchFilters;
