import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import FAQSection from "@/components/FAQSection";

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface SearchInterfaceProps {
  category: Category;
  onBack: () => void;
}

interface Situation {
  name: string;
  icon: string;
  description: string;
  concepts: string[];
}

interface SearchResult {
  name: string;
  relevance: number;
  stage?: string;
  method?: string;
  keywords?: string[];
  matchReason?: string;
}

const SearchInterface = ({ category, onBack }: SearchInterfaceProps) => {
  const [matchingResults, setMatchingResults] = useState<any>(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [situations, setSituations] = useState<Situation[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 載入資料
    Promise.all([
      fetch("/data/transmission_matching_results.json").then(r => r.json()),
      fetch("/data/transmission_knowledge_graph.json").then(r => r.json()),
      fetch("/data/situations.json").then(r => r.json())
    ]).then(([matching, kg, situationsData]) => {
      setMatchingResults(matching);
      setKnowledgeGraph(kg);
      setSituations(situationsData.situations);
    }).catch(err => console.error("載入資料失敗:", err));
  }, []);


  const calculateRelevance = (records: any[]) => {
    let score = 0;
    const weights = {
      '第一階段': 0.4,
      '第二階段': 0.3,
      '第三階段': 0.2
    };
    
    records.forEach(r => {
      const stage = r.匹配階段 || '第三階段';
      score += (weights[stage as keyof typeof weights] || 0.1);
      score += (r.相關性分數 || 5) / 100;
    });
    
    return Math.min(score / records.length, 1);
  };

  const searchByKeyword = (keyword: string, threshold = 0.6): SearchResult[] => {
    if (!matchingResults) return [];
    
    const results: SearchResult[] = [];
    const matchRecords = matchingResults.matching_results.filter(
      (r: any) => r.關鍵字 === keyword
    );

    const datasetGroups: { [key: string]: any[] } = {};
    matchRecords.forEach((record: any) => {
      const datasetName = record.資料集名稱;
      if (!datasetGroups[datasetName]) {
        datasetGroups[datasetName] = [];
      }
      datasetGroups[datasetName].push(record);
    });

    Object.entries(datasetGroups).forEach(([datasetName, records]) => {
      const relevance = calculateRelevance(records);

      if (relevance >= threshold) {
        const allKeywords = [...new Set(records.map(r => r.關鍵字))];

        results.push({
          name: datasetName,
          relevance: relevance,
          stage: records[0].匹配階段 || '未知',
          method: records[0].匹配方式 || '關鍵字匹配',
          keywords: allKeywords,
          matchReason: records[0].匹配原因 || ''
        });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance);
  };

  const searchBySituation = (situation: Situation): SearchResult[] => {
    if (!knowledgeGraph || !matchingResults) return [];
    
    const results: SearchResult[] = [];
    const processedDatasets = new Set<string>();

    situation.concepts.forEach(conceptName => {
      const conceptNode = knowledgeGraph.nodes.find(
        (n: any) => n.type === 'concept' && n.label === conceptName
      );

      if (!conceptNode) return;

      const keywordLinks = knowledgeGraph.links.filter(
        (l: any) => l.type === 'keyword_to_concept' && l.target === conceptNode.id
      );

      keywordLinks.forEach((link: any) => {
        const keywordName = link.source.replace('keyword_', '');
        const keywordResults = searchByKeyword(keywordName, 0.5);

        keywordResults.forEach(result => {
          if (!processedDatasets.has(result.name)) {
            processedDatasets.add(result.name);
            results.push({
              ...result,
              method: `情境導引: ${situation.name}`,
              matchReason: `透過概念「${conceptName}」`
            });
          }
        });
      });
    });

    return results.sort((a, b) => b.relevance - a.relevance);
  };

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleKeywordSearch = () => {
    if (!keywordInput.trim()) return;
    const results = searchByKeyword(keywordInput.trim());
    setSearchResults(results);
    scrollToResults();
  };

  const handleSituationClick = (situation: Situation) => {
    const results = searchBySituation(situation);
    setSearchResults(results);
    scrollToResults();
  };

  const handleFAQDatasetSelect = (datasets: string[], question: string) => {
    const results: SearchResult[] = [];
    
    datasets.forEach((datasetName: string) => {
      results.push({
        name: datasetName,
        relevance: 1.0,
        method: 'FAQ 推薦',
        matchReason: `相關問題: ${question}`
      });
    });

    setSearchResults(results);
    scrollToResults();
  };

  return (
    <div className="bg-white rounded-3xl p-10 shadow-2xl animate-in fade-in duration-500">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-8 bg-gray-100 hover:bg-gray-200"
      >
        ← 返回選擇
      </Button>

      <div className="flex items-center gap-4 mb-10">
        <span className="text-5xl">{category.icon}</span>
        <h2 className="text-3xl font-bold">{category.name}資料集搜尋</h2>
      </div>

      {/* 關鍵字搜尋區塊 */}
      <Card className="p-6 bg-gray-50 mb-8">
        <h3 className="text-xl font-semibold mb-4">🔍 關鍵字搜尋</h3>
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="例如：變電所、饋線、輸電線路..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleKeywordSearch()}
            className="text-lg"
          />
          <Button onClick={handleKeywordSearch} className="px-8">
            搜尋
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">快速搜尋：</span>
          {['變電所', '饋線', '停電', '再生能源', '電價', '負載'].map((kw) => (
            <Badge
              key={kw}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-white"
              onClick={() => {
                setKeywordInput(kw);
                const results = searchByKeyword(kw);
                setSearchResults(results);
              }}
            >
              {kw}
            </Badge>
          ))}
        </div>
      </Card>

      {/* 常見問題和使用情境並排 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 常見問題 */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">💬 常見問題</h3>
          <FAQSection onDatasetSelect={handleFAQDatasetSelect} />
        </div>

        {/* 使用情境 */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">🎯 使用情境</h3>
          <Card className="p-6 bg-gray-50">
            <h4 className="text-lg font-medium mb-4">根據使用場景尋找資料</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {situations.map((sit) => (
                <button
                  key={sit.name}
                  className="p-6 bg-white rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-md"
                  onClick={() => handleSituationClick(sit)}
                >
                  <div className="text-4xl mb-2">{sit.icon}</div>
                  <div className="font-semibold text-lg mb-1">{sit.name}</div>
                  <div className="text-sm opacity-80">{sit.description}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 搜尋結果 */}
      {searchResults.length > 0 && (
        <div ref={resultsRef} className="mt-8">
          <h3 className="text-2xl font-bold mb-6">
            找到 {searchResults.length} 個相關資料集
          </h3>
          <div className="space-y-4">
            {searchResults.map((result, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {result.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">
                        {result.method || '關鍵字匹配'}
                      </Badge>
                      {result.stage && (
                        <Badge variant="secondary">{result.stage}</Badge>
                      )}
                      <Badge 
                        className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                      >
                        相關度: {(result.relevance * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    {result.matchReason && (
                      <p className="text-sm text-gray-600 mb-2">
                        匹配原因: {result.matchReason}
                      </p>
                    )}
                    {result.keywords && result.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.keywords.slice(0, 5).map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`https://data.gov.tw/`, '_blank')}
                    >
                      查看詳情
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                      onClick={() => window.open(`https://data.gov.tw/`, '_blank')}
                    >
                      下載資料
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInterface;
