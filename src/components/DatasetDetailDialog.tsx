import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DatasetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetName: string;
  description?: string;
}

const DatasetDetailDialog = ({
  open,
  onOpenChange,
  datasetName,
  description,
}: DatasetDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            資料集總結
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            {datasetName}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {description || <p className="text-muted-foreground">暫無資料集總結</p>}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DatasetDetailDialog;
