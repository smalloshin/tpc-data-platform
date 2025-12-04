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
import { getSystemsByScenario, type SystemData, type ScenarioHierarchy } from "@/utils/otherSystemsLoader";

interface OtherSituationExplorerProps {
  onSystemSelect?: (system: SystemData) => void;
}

const themeIcons: { [key: string]: string } = {
  '發電機組與燃料管理': '⚡',
  '輸電與電網運轉': '🔌',
  '配電與供電可靠度': '🏠',
  '用戶與收費／用電行為分析': '👥',
  '再生能源與綠電管理': '🌞',
  '安全監控與風險管理': '🛡️',
  '設備維護與資產管理': '🔧',
  '經營管理與決策支援': '📊',
  '人力資源與內部行政': '👔',
  '物料／採購與倉儲管理': '📦',
  '空間資訊與地理應用': '🗺️',
  '綜合管理與其他支援系統': '🏢'
};

const OtherSituationExplorer = ({ onSystemSelect }: OtherSituationExplorerProps) => {
  const [scenarioData, setScenarioData] = useState<Map<string, ScenarioHierarchy>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedL1, setExpandedL1] = useState<string | null>(null);
  const [expandedL2, setExpandedL2] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getSystemsByScenario();
      setScenarioData(data);
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

  const sortedThemes = Array.from(scenarioData.entries()).sort((a, b) => {
    const countA = Array.from(a[1].l2Tasks.values()).reduce((sum, arr) => sum + arr.length, 0);
    const countB = Array.from(b[1].l2Tasks.values()).reduce((sum, arr) => sum + arr.length, 0);
    return countB - countA;
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        共 {sortedThemes.length} 個主題領域，依情境分類探索系統
      </p>
      
      <Accordion type="single" collapsible value={expandedL1 || undefined} onValueChange={(val) => setExpandedL1(val)}>
        {sortedThemes.map(([l1Theme, hierarchy]) => {
          const totalSystems = Array.from(hierarchy.l2Tasks.values()).reduce((sum, arr) => sum + arr.length, 0);
          
          return (
            <AccordionItem key={l1Theme} value={l1Theme}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <span className="text-2xl">{themeIcons[l1Theme] || '📁'}</span>
                  <span className="font-medium text-left flex-1">{l1Theme}</span>
                  <Badge variant="secondary" className="ml-2">
                    {totalSystems} 個系統
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 pt-2">
                  <Accordion type="single" collapsible value={expandedL2 || undefined} onValueChange={(val) => setExpandedL2(val)}>
                    {Array.from(hierarchy.l2Tasks.entries()).map(([l2Task, systems]) => (
                      <AccordionItem key={l2Task} value={`${l1Theme}-${l2Task}`}>
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3 w-full">
                            <span className="text-lg">📋</span>
                            <span className="text-sm font-medium text-left flex-1">{l2Task}</span>
                            <Badge variant="outline" className="text-xs">
                              {systems.length} 個
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
                                      {system.functionDescription}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      <Badge variant="outline" className="text-xs">
                                        {system.responsibleUnit}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {system.managementTarget}
                                      </Badge>
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default OtherSituationExplorer;
