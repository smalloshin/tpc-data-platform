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
  categoryId: string;
  onConceptSelect: (concept: Concept) => void;
}

const ConceptExplorer = ({ categoryId, onConceptSelect }: ConceptExplorerProps) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 同時載入知識圖譜和匹配結果
    Promise.all([
      fetch(`/data/${categoryId}_knowledge_graph.json`).then(r => r.json()),
      fetch(`/data/${categoryId}_matching_results.json`).then(r => r.json())
    ])
      .then(([kgData, matchingData]) => {
        const conceptNodes = kgData.nodes.filter((n: any) => n.type === "concept");
        
        // 支援 edges 或 links 作為連線陣列的屬性名稱
        const links = kgData.edges || kgData.links || [];
        console.log(`載入了 ${links.length} 個連接關係`);
        
        // 輔助函數：計算相關性分數
        const calculateRelevance = (records: any[]) => {
          let score = 0;
          const weights = {
            '第一階段': 1.0,
            '第二階段': 0.85,
            '第三階段': 0.7
          };
          
          records.forEach(r => {
            const stage = r.匹配階段 || '第三階段';
            const stageWeight = weights[stage as keyof typeof weights] || 0.6;
            const relevanceScore = (r.相關性分數 || 5) / 10;
            score += stageWeight * relevanceScore;
          });
          
          return Math.min(score / records.length, 1);
        };

        // 輔助函數：根據關鍵字搜尋資料集（threshold = 0.5）
        const hasValidDatasets = (keyword: string): boolean => {
          const matchRecords = matchingData.matching_results.filter(
            (r: any) => r.關鍵字 === keyword
          );

          if (matchRecords.length === 0) return false;

          const datasetGroups: { [key: string]: any[] } = {};
          matchRecords.forEach((record: any) => {
            const datasetName = record.資料集名稱;
            if (!datasetGroups[datasetName]) {
              datasetGroups[datasetName] = [];
            }
            datasetGroups[datasetName].push(record);
          });

          // 檢查是否至少有一個資料集的相關性 >= 0.3（提高門檻確保品質）
          return Object.values(datasetGroups).some(records => {
            const relevance = calculateRelevance(records);
            return relevance >= 0.3;
          });
        };
        
        // 過濾出真正能找到資料集（relevance >= 0.3）的概念
        const conceptsWithDatasets = conceptNodes.filter((concept: any) => {
          // 支援多種連線格式：
          // 1. type === 'belongs_to' 或 'keyword_to_concept' (如 generation, distribution)
          // 2. relationship === '屬於' (如 transmission)
          const keywordLinks = links.filter((link: any) => {
            const isKeywordToConcept = 
              link.type === 'belongs_to' || 
              link.type === 'keyword_to_concept' ||
              link.relationship === '屬於';
            const targetMatchesId = link.target === concept.id;
            const targetMatchesLabel = link.target === concept.label;
            return isKeywordToConcept && (targetMatchesId || targetMatchesLabel);
          });
          
          if (keywordLinks.length === 0) {
            console.log(`概念 ${concept.label} 沒有關鍵字連接`);
            return false;
          }
          
          // 檢查是否至少有一個關鍵字能找到有效資料集
          const hasValidKeyword = keywordLinks.some((link: any) => {
            const keywordName = link.source.replace('keyword_', '');
            const hasDatasets = hasValidDatasets(keywordName);
            if (hasDatasets) {
              console.log(`概念 ${concept.label} 透過關鍵字 ${keywordName} 找到資料集`);
            }
            return hasDatasets;
          });
          
          return hasValidKeyword;
        });
        
        console.log(`總共 ${conceptNodes.length} 個概念，其中 ${conceptsWithDatasets.length} 個有連接到有效的資料集（relevance >= 0.3）`);
        setConcepts(conceptsWithDatasets);
      })
      .catch((err) => console.error("載入概念失敗:", err));
  }, [categoryId]);

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

  // 類別圖示映射（按發電領域優化）
  const categoryIcons: Record<string, string> = {
    "再生能源": "🌱",
    "傳統能源": "⚡",
    "能源類型": "🔋",
    "發電設施": "🏭",
    "發電技術": "💡",
    "發電資源": "⛽",
    "運作管理": "📊",
    "發電": "⚡",
    "統計": "📊",
    "管理": "📋",
    "價格": "💰",
    "市場": "🏪",
    "機制": "⚙️",
    "銷售": "💼",
    "費率": "💵",
    "服務": "🤝",
    "設施類型": "🏗️",
    "設備": "⚙️",
    "系統": "🔌",
    "技術": "💡",
    "技術參數": "⚙️",
    "設施": "🏢",
    "電力統計": "📊",
    "用戶服務": "👥",
    "費率管理": "💰",
    "市場機制": "🏪",
    "銷售業務": "🔌",
    "供應鏈": "🏢",
    "計價機制": "💰",
    "市場運作": "📈",
    "變電設施": "🏗️",
    "線路設施": "🔌",
    "開關保護設備": "🛡️",
    "系統運作": "📊",
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedConcepts)
        .filter(([_, categoryConcepts]) => categoryConcepts.length > 0)
        .map(([category, categoryConcepts]) => {
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
