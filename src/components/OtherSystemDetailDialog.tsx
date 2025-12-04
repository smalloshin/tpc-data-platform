import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { type SystemData } from "@/utils/otherSystemsLoader";

interface OtherSystemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system: SystemData | null;
}

const OtherSystemDetailDialog = ({ open, onOpenChange, system }: OtherSystemDetailDialogProps) => {
  if (!system) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            {system.systemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 基本資訊 */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{system.responsibleUnit}</Badge>
              {system.themeL1 && (
                <Badge variant="outline">{system.themeL1}</Badge>
              )}
              {system.analysisTaskL2 && (
                <Badge variant="outline" className="bg-blue-50">{system.analysisTaskL2}</Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* 建置目的 */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">📌 建置目的</h4>
            <p className="text-gray-600 leading-relaxed">{system.purpose}</p>
          </div>

          {/* 管理標的 */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">🎯 管理標的</h4>
            <p className="text-gray-600 leading-relaxed">{system.managementTarget}</p>
          </div>

          {/* 功能描述 */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">⚙️ 功能描述</h4>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {system.functionDescription.replace(/<br\s*\/?>/gi, '\n')}
            </p>
          </div>

          <Separator />

          {/* 情境描述 */}
          {system.scenarios && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">💡 適用情境</h4>
              <div className="space-y-2">
                {system.scenarios.split('||').map((scenario, idx) => (
                  <p key={idx} className="text-gray-600 text-sm leading-relaxed pl-4 border-l-2 border-blue-200">
                    {scenario.trim()}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 關鍵字 */}
          {system.keywords && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">🏷️ 關鍵字</h4>
              <div className="flex flex-wrap gap-1">
                {system.keywords.split('；').slice(0, 10).map((kw, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {kw.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OtherSystemDetailDialog;
