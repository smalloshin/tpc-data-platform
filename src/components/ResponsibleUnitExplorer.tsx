import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSystemsByUnit, type UnitGroup, type OtherSystem } from "@/utils/otherSystemsLoader";

interface ResponsibleUnitExplorerProps {
  onSystemSelect: (system: OtherSystem) => void;
}

const unitIcons: Record<string, string> = {
  '發電處': '🔋',
  '供電處': '⚡',
  '調度處': '📊',
  '業務處': '💼',
  '材料處': '📦',
  '燃料處': '⛽',
  '營建處': '🏗️',
  '核火工處': '☢️',
  '系統規劃處': '📐',
  '資訊系統處': '💻',
  '配電處': '🔌',
  '會計處': '📈',
  '秘書處': '📋',
  '公眾服務處': '📞',
  '人力資源處': '👥',
  '環境保護處': '🌿',
  '企劃處': '📝',
  '法務處': '⚖️',
  '稽核處': '🔍',
  '新事業開發室': '🚀',
  '再生能源處': '♻️'
};

const ResponsibleUnitExplorer = ({ onSystemSelect }: ResponsibleUnitExplorerProps) => {
  const [unitGroups, setUnitGroups] = useState<UnitGroup[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const groups = await getSystemsByUnit();
    setUnitGroups(groups);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">載入中...</div>;
  }

  const selectedGroup = unitGroups.find(g => g.unit === selectedUnit);

  return (
    <div className="space-y-6">
      {/* Unit badges */}
      <div className="flex flex-wrap gap-2">
        {unitGroups.map(group => (
          <Badge
            key={group.unit}
            variant={selectedUnit === group.unit ? "default" : "outline"}
            className="cursor-pointer text-sm py-2 px-3 hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => setSelectedUnit(selectedUnit === group.unit ? null : group.unit)}
          >
            <span className="mr-1">{unitIcons[group.unit] || '🏢'}</span>
            {group.unit}
            <span className="ml-1 opacity-70">({group.systems.length})</span>
          </Badge>
        ))}
      </div>

      {/* Selected unit's systems */}
      {selectedGroup && (
        <div className="space-y-3 animate-fade-in">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <span>{unitIcons[selectedGroup.unit] || '🏢'}</span>
            {selectedGroup.unit} - 相關系統
          </h4>
          <div className="grid gap-3">
            {selectedGroup.systems.map(system => (
              <Card
                key={system.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                onClick={() => onSystemSelect(system)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-primary">{system.name}</h5>
                    <p className="text-sm text-muted-foreground mt-1">{system.purpose}</p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">管理標的：</span>{system.target}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!selectedUnit && (
        <p className="text-sm text-muted-foreground text-center">
          點選上方單位標籤以查看該單位負責的系統
        </p>
      )}
    </div>
  );
};

export default ResponsibleUnitExplorer;
