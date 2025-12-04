import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getSystemsByUnit, type SystemData } from "@/utils/otherSystemsLoader";

interface ResponsibleUnitExplorerProps {
  onSystemSelect?: (system: SystemData) => void;
}

const unitIcons: { [key: string]: string } = {
  '發電處': '⚡',
  '供電處': '🔌',
  '調度處': '📊',
  '業務處': '💼',
  '材料處': '📦',
  '燃料處': '🛢️',
  '營建處': '🏗️',
  '核火工處': '☢️',
  '系統規劃處': '📐',
  '資訊系統處': '💻',
  '會計處': '📒',
  '秘書處': '📝',
  '公眾服務處': '📢',
  '環保處': '🌿',
  '人力資源處': '👥',
  '企劃處': '📋',
  '法務室': '⚖️',
  '台電綜合研究所': '🔬',
  '再生能源處': '🌞',
  '電力開發規劃處': '📈'
};

const ResponsibleUnitExplorer = ({ onSystemSelect }: ResponsibleUnitExplorerProps) => {
  const [unitData, setUnitData] = useState<Map<string, SystemData[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getSystemsByUnit();
      setUnitData(data);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">載入中...</span>
      </div>
    );
  }

  const sortedUnits = Array.from(unitData.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        共 {sortedUnits.length} 個單位，點擊查看各單位轄屬系統
      </p>
      
      <Accordion type="single" collapsible value={expandedUnit || undefined} onValueChange={(val) => setExpandedUnit(val)}>
        {sortedUnits.map(([unit, systems]) => (
          <AccordionItem key={unit} value={unit}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 w-full">
                <span className="text-2xl">{unitIcons[unit] || '🏢'}</span>
                <span className="font-medium text-left flex-1">{unit}</span>
                <Badge variant="secondary" className="ml-2">
                  {systems.length} 個系統
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {systems.map((system, idx) => (
                  <Card 
                    key={idx} 
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onSystemSelect?.(system)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {system.systemName}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {system.purpose}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {system.managementTarget}
                          </Badge>
                          {system.themeL1 && (
                            <Badge variant="secondary" className="text-xs">
                              {system.themeL1}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSystemSelect?.(system);
                        }}
                      >
                        查看詳情
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ResponsibleUnitExplorer;
