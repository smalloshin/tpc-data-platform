import { useState, useEffect, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { loadDatasetDetails, DatasetDetail } from "@/utils/datasetLoader";
import { loadBigDataDatasets, BigDataDataset } from "@/utils/bigDataLoader";
import DatasetDetailDialog from "./DatasetDetailDialog";

interface DatasetBrowserProps {
  onBack: () => void;
}

type SortField = "department" | "id" | "name";
type BigDataSortField = "name" | "category";
type SortDirection = "asc" | "desc";

const DatasetBrowser = ({ onBack }: DatasetBrowserProps) => {
  const [datasets, setDatasets] = useState<DatasetDetail[]>([]);
  const [bigDataDatasets, setBigDataDatasets] = useState<BigDataDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bigDataSearchQuery, setBigDataSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("department");
  const [bigDataSortField, setBigDataSortField] = useState<BigDataSortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [bigDataSortDirection, setBigDataSortDirection] = useState<SortDirection>("asc");
  const [selectedDataset, setSelectedDataset] = useState<DatasetDetail | null>(null);
  const [selectedBigDataDataset, setSelectedBigDataDataset] = useState<BigDataDataset | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("open");

  useEffect(() => {
    const loadData = async () => {
      const [dataMap, bigDataMap] = await Promise.all([
        loadDatasetDetails(),
        loadBigDataDatasets()
      ]);
      const dataArray = Array.from(dataMap.values());
      const bigDataArray = Array.from(bigDataMap.values());
      setDatasets(dataArray);
      setBigDataDatasets(bigDataArray);
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

  const handleBigDataSort = (field: BigDataSortField) => {
    if (bigDataSortField === field) {
      setBigDataSortDirection(bigDataSortDirection === "asc" ? "desc" : "asc");
    } else {
      setBigDataSortField(field);
      setBigDataSortDirection("asc");
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

  const filteredAndSortedBigDataDatasets = useMemo(() => {
    let result = [...bigDataDatasets];

    // 搜尋過濾
    if (bigDataSearchQuery.trim()) {
      const query = bigDataSearchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.category.toLowerCase().includes(query) ||
          d.tags.some(t => t.toLowerCase().includes(query)) ||
          d.rewrittenDescription.toLowerCase().includes(query)
      );
    }

    // 排序
    result.sort((a, b) => {
      const aValue = a[bigDataSortField] || "";
      const bValue = b[bigDataSortField] || "";
      const comparison = aValue.localeCompare(bValue, "zh-TW");
      return bigDataSortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [bigDataDatasets, bigDataSearchQuery, bigDataSortField, bigDataSortDirection]);

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

  const BigDataSortIcon = ({ field }: { field: BigDataSortField }) => {
    if (bigDataSortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return bigDataSortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const handleRowClick = (dataset: DatasetDetail) => {
    setSelectedDataset(dataset);
    setSelectedBigDataDataset(null);
    setDialogOpen(true);
  };

  const handleBigDataRowClick = (dataset: BigDataDataset) => {
    setSelectedBigDataDataset(dataset);
    setSelectedDataset(null);
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
    <div className="bg-white rounded-3xl p-10 shadow-2xl animate-in fade-in duration-500">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-8 bg-gray-100 hover:bg-gray-200"
      >
        ← 返回選擇
      </Button>

      <div className="flex items-center gap-4 mb-10">
        <span className="text-5xl">📊</span>
        <h2 className="text-3xl font-bold">瀏覽資料集</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="open" className="text-base">
            📂 開放資料集
            <Badge variant="secondary" className="ml-2">{datasets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bigdata" className="text-base">
            🗄️ 大數據平台資料集
            <Badge variant="secondary" className="ml-2">{bigDataDatasets.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* 開放資料集 */}
        <TabsContent value="open">
          <Card className="p-6 bg-gray-50 mb-8">
            <h3 className="text-xl font-semibold mb-4">🔍 搜尋開放資料集</h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="搜尋資料集名稱、部門、ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              共 {filteredAndSortedDatasets.length} 筆資料集
              {searchQuery && ` (篩選自 ${datasets.length} 筆)`}
            </div>
          </Card>

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
        </TabsContent>

        {/* 大數據平台資料集 */}
        <TabsContent value="bigdata">
          <Card className="p-6 bg-gray-50 mb-8">
            <h3 className="text-xl font-semibold mb-4">🔍 搜尋大數據平台資料集</h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="搜尋資料集名稱、分類、標籤..."
                  value={bigDataSearchQuery}
                  onChange={(e) => setBigDataSearchQuery(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              共 {filteredAndSortedBigDataDatasets.length} 筆資料集
              {bigDataSearchQuery && ` (篩選自 ${bigDataDatasets.length} 筆)`}
            </div>
          </Card>

          <div className="border rounded-lg overflow-hidden bg-card max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="bg-muted/50">
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleBigDataSort("name")}
                  >
                    <div className="flex items-center">
                      資料集名稱
                      <BigDataSortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleBigDataSort("category")}
                  >
                    <div className="flex items-center">
                      分類
                      <BigDataSortIcon field="category" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">標籤</TableHead>
                  <TableHead className="hidden lg:table-cell">說明</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedBigDataDatasets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      找不到符合條件的資料集
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedBigDataDatasets.map((dataset, index) => (
                    <TableRow
                      key={`${dataset.name}-${index}`}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleBigDataRowClick(dataset)}
                    >
                      <TableCell className="text-primary font-medium">
                        {dataset.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dataset.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {dataset.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {dataset.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{dataset.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-md text-muted-foreground">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate cursor-help">
                              {dataset.rewrittenDescription || "-"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-sm whitespace-normal">
                            <p>{dataset.rewrittenDescription}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sample Data Dialog - 開放資料集 */}
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

      {/* Detail Dialog - 大數據平台資料集 */}
      {selectedBigDataDataset && (
        <DatasetDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          datasetName={selectedBigDataDataset.name}
          description={selectedBigDataDataset.rewrittenDescription}
          bigDataDataset={selectedBigDataDataset}
          type="rewrite"
        />
      )}
    </div>
  );
};

export default DatasetBrowser;
