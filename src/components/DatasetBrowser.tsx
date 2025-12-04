import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { loadDatasetDetails, DatasetDetail } from "@/utils/datasetLoader";
import DatasetDetailDialog from "./DatasetDetailDialog";

interface DatasetBrowserProps {
  onBack: () => void;
}

type SortField = "department" | "id" | "name";
type SortDirection = "asc" | "desc";

const DatasetBrowser = ({ onBack }: DatasetBrowserProps) => {
  const [datasets, setDatasets] = useState<DatasetDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("department");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedDataset, setSelectedDataset] = useState<DatasetDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const dataMap = await loadDatasetDetails();
      const dataArray = Array.from(dataMap.values());
      setDatasets(dataArray);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedDatasets = useMemo(() => {
    let result = [...datasets];

    // 搜尋過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.department.toLowerCase().includes(query) ||
          d.id.toLowerCase().includes(query) ||
          d.description.toLowerCase().includes(query)
      );
    }

    // 排序
    result.sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";
      const comparison = aValue.localeCompare(bValue, "zh-TW");
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [datasets, searchQuery, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const handleRowClick = (dataset: DatasetDetail) => {
    setSelectedDataset(dataset);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">載入資料中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回首頁
        </Button>
        <h2 className="text-2xl font-bold text-foreground">瀏覽資料集</h2>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋資料集名稱、部門、ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        共 {filteredAndSortedDatasets.length} 筆資料集
        {searchQuery && ` (篩選自 ${datasets.length} 筆)`}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow className="bg-muted/50">
              <TableHead
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("department")}
              >
                <div className="flex items-center">
                  部門
                  <SortIcon field="department" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center">
                  資料集 ID
                  <SortIcon field="id" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  資料集名稱
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">詳細說明</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedDatasets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  找不到符合條件的資料集
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedDatasets.map((dataset, index) => (
                <TableRow
                  key={`${dataset.id}-${index}`}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${!dataset.sampleData ? 'opacity-70' : ''}`}
                  onClick={() => handleRowClick(dataset)}
                >
                  <TableCell className="font-medium">{dataset.department}</TableCell>
                  <TableCell>{dataset.id}</TableCell>
                  <TableCell className="text-primary font-medium">
                    <div className="flex items-center gap-2">
                      {dataset.name}
                      {dataset.sampleData && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          有範例
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-md text-muted-foreground">
                    {dataset.description ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate cursor-help">
                            {dataset.description}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-sm whitespace-normal">
                          <p>{dataset.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sample Data Dialog */}
      {selectedDataset && (
        <DatasetDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          datasetName={selectedDataset.name}
          description={selectedDataset.description}
          sampleData={selectedDataset.sampleData}
          summary={selectedDataset.summary}
          type="sample"
        />
      )}
    </div>
  );
};

export default DatasetBrowser;
