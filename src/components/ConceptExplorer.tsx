import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Concept {
  id: string;
  label: string;
  category: string;
}

interface ConceptExplorerProps {
  onConceptSelect: (concept: Concept) => void;
}

const ConceptExplorer = ({ onConceptSelect }: ConceptExplorerProps) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/data/transmission_knowledge_graph.json")
      .then((r) => r.json())
      .then((data) => {
        const conceptNodes = data.nodes.filter((n: any) => n.type === "concept");
        setConcepts(conceptNodes);
      })
      .catch((err) => console.error("載入概念失敗:", err));
  }, []);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // 將概念按類別分組
  const groupedConcepts = concepts.reduce((acc, concept) => {
    const category = concept.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(concept);
    return acc;
  }, {} as Record<string, Concept[]>);

  // 類別圖示映射
  const categoryIcons: Record<string, string> = {
    "設施類型": "🏗️",
    "設備": "⚙️",
    "系統": "🔌",
    "技術": "💡",
    "技術參數": "📊",
    "運作管理": "📋",
    "設施": "🏢",
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedConcepts).map(([category, categoryConcepts]) => {
        const isExpanded = expandedCategories.has(category);
        
        return (
          <Card key={category} className="overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{categoryIcons[category] || "📁"}</span>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{category}</h3>
                  <p className="text-sm text-muted-foreground">
                    {categoryConcepts.length} 個概念
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="p-4 pt-0 space-y-2 border-t">
                {categoryConcepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{concept.label}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {concept.category}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onConceptSelect(concept)}
                        className="ml-4"
                      >
                        查看資料集
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default ConceptExplorer;
