import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Tag } from "lucide-react";
import type { BigDataDataset } from "@/utils/bigDataLoader";

interface DatasetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetName: string;
  description?: string;
  sampleData?: string;
  summary?: string;
  bigDataDataset?: BigDataDataset | null;
  type: 'detail' | 'sample' | 'summary' | 'tags' | 'rewrite';
}

const DatasetDetailDialog = ({
  open,
  onOpenChange,
  datasetName,
  description,
  sampleData,
  summary,
  bigDataDataset,
  type
}: DatasetDetailDialogProps) => {
  const renderSampleData = () => {
    if (!sampleData) return <p className="text-muted-foreground">暫無範例資料</p>;
    
    try {
      const data = JSON.parse(sampleData);
      if (Array.isArray(data) && data.length > 0) {
        const displayData = data.slice(0, 5);
        const columns = Object.keys(displayData[0]);
        
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              顯示前 5 筆資料{data.length > 5 ? `（共 ${data.length} 筆）` : ''}
            </p>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col} className="font-medium">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((item, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => {
                        const value = item[col];
                        const displayValue = value === null || value === undefined || 
                                           String(value).toLowerCase() === 'nan' ? '' : String(value);
                        return (
                          <TableCell key={col} className="text-sm">
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      }
    } catch (e) {
      console.error('解析範例資料失敗:', e);
    }
    
    return <pre className="text-sm whitespace-pre-wrap">{sampleData}</pre>;
  };

  const renderTags = () => {
    if (!bigDataDataset || !bigDataDataset.tags || bigDataDataset.tags.length === 0) {
      return <p className="text-muted-foreground">暫無標籤資訊</p>;
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          此資料集的分類標籤：
        </p>
        <div className="flex flex-wrap gap-2">
          {bigDataDataset.tags.map((tag, idx) => (
            <Badge 
              key={idx} 
              variant="secondary"
              className="text-sm py-1 px-3 bg-orange-100 text-orange-700 border border-orange-300"
            >
              {tag}
            </Badge>
          ))}
        </div>
        {bigDataDataset.category && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">所屬類別：</span>{bigDataDataset.category}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderRewrite = () => {
    if (!bigDataDataset || !bigDataDataset.rewrittenDescription) {
      return <p className="text-muted-foreground">暫無重寫敘述</p>;
    }

    return (
      <div className="prose prose-sm max-w-none">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-100">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {bigDataDataset.rewrittenDescription}
          </p>
        </div>
      </div>
    );
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'detail': return '資料集詳細說明';
      case 'sample': return '資料集範例資料';
      case 'summary': return (
        <span className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI 資料集解釋
        </span>
      );
      case 'tags': return (
        <span className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-orange-500" />
          資料集標籤
        </span>
      );
      case 'rewrite': return (
        <span className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          AI 資料集解釋
        </span>
      );
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'detail':
        return (
          <div className="prose prose-sm max-w-none">
            {description || <p className="text-muted-foreground">暫無詳細說明</p>}
          </div>
        );
      case 'sample':
        return renderSampleData();
      case 'summary':
        return (
          <div className="prose prose-sm max-w-none">
            {summary ? (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-100">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">暫無 AI 資料集解釋</p>
            )}
          </div>
        );
      case 'tags':
        return renderTags();
      case 'rewrite':
        return renderRewrite();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            {bigDataDataset?.name || datasetName}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DatasetDetailDialog;
