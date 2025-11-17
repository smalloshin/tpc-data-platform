import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DatasetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetName: string;
  description?: string;
  sampleData?: string;
  type: 'detail' | 'sample';
}

const DatasetDetailDialog = ({
  open,
  onOpenChange,
  datasetName,
  description,
  sampleData,
  type
}: DatasetDetailDialogProps) => {
  const renderSampleData = () => {
    if (!sampleData) return <p className="text-muted-foreground">暫無範例資料</p>;
    
    try {
      const data = JSON.parse(sampleData);
      if (Array.isArray(data) && data.length > 0) {
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">顯示前 5 筆資料：</p>
            {data.slice(0, 5).map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">第 {idx + 1} 筆</Badge>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(item).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="font-medium text-sm min-w-[120px]">{key}:</span>
                      <span className="text-sm text-muted-foreground flex-1">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {data.length > 5 && (
              <p className="text-sm text-muted-foreground italic">
                共 {data.length} 筆資料，僅顯示前 5 筆
              </p>
            )}
          </div>
        );
      }
    } catch (e) {
      console.error('解析範例資料失敗:', e);
    }
    
    return <pre className="text-sm whitespace-pre-wrap">{sampleData}</pre>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {type === 'detail' ? '資料集詳細說明' : '資料集範例資料'}
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            {datasetName}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {type === 'detail' ? (
            <div className="prose prose-sm max-w-none">
              {description || <p className="text-muted-foreground">暫無詳細說明</p>}
            </div>
          ) : (
            renderSampleData()
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DatasetDetailDialog;
