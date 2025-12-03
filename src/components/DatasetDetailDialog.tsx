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

interface DatasetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetName: string;
  description?: string;
  sampleData?: string;
  summary?: string;
  type: 'detail' | 'sample' | 'summary';
}

const DatasetDetailDialog = ({
  open,
  onOpenChange,
  datasetName,
  description,
  sampleData,
  summary,
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

  const getTitle = () => {
    switch (type) {
      case 'detail': return '資料集詳細說明';
      case 'sample': return '資料集範例資料';
      case 'summary': return '資料集總結';
      default: return '資料集資訊';
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
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {summary || <p className="text-muted-foreground">暫無資料集總結</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            {datasetName}
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
