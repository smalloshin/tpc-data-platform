import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { getAllScenarios, type OtherSystem } from "@/utils/otherSystemsLoader";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SituationExplorerProps {
  onSystemSelect: (system: OtherSystem) => void;
}

const SituationExplorer = ({ onSystemSelect }: SituationExplorerProps) => {
  const [scenarios, setScenarios] = useState<{ scenario: string; systems: OtherSystem[] }[]>([]);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getAllScenarios();
    setScenarios(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        以下是常見的使用情境，點選展開可查看相關系統：
      </p>
      {scenarios.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <div
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-start"
            onClick={() => setExpandedScenario(expandedScenario === item.scenario ? null : item.scenario)}
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <p className="text-sm font-medium">{item.scenario}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.systems.length} 個相關系統
              </p>
            </div>
            {expandedScenario === item.scenario ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          
          {expandedScenario === item.scenario && (
            <div className="border-t bg-muted/30 p-4 space-y-2 animate-fade-in">
              {item.systems.map(system => (
                <div
                  key={system.id}
                  className="p-3 bg-background rounded-lg cursor-pointer hover:shadow-sm transition-shadow hover:border-primary/50 border"
                  onClick={() => onSystemSelect(system)}
                >
                  <h5 className="font-medium text-primary text-sm">{system.name}</h5>
                  <p className="text-xs text-muted-foreground mt-1">{system.unit}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default SituationExplorer;
