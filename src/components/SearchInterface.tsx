import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import FAQSection from "@/components/FAQSection";
import ConceptExplorer from "@/components/ConceptExplorer";
import DatasetDetailDialog from "@/components/DatasetDetailDialog";
import KnowledgeGraphD3 from "@/components/KnowledgeGraphD3";
import { toast } from "@/components/ui/use-toast";
import { getDatasetDetail, type DatasetDetail } from "@/utils/datasetLoader";

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
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'detail' | 'sample'>('detail');
  const [selectedDataset, setSelectedDataset] = useState<DatasetDetail | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showConcepts, setShowConcepts] = useState(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);

  useEffect(() => {
    // 根據類別載入對應的資料
    const categoryPrefix = category.id === 'transmission' ? 'transmission' : 
                          category.id === 'distribution' ? 'distribution' : 
                          'transmission'; // 預設為輸電
    
    Promise.all([
      fetch(`/data/${categoryPrefix}_matching_results.json`).then(r => r.json()),
      fetch(`/data/${categoryPrefix}_knowledge_graph.json`).then(r => r.json()),
      fetch(`/data/${categoryPrefix === 'transmission' ? 'situations' : categoryPrefix + '_situations'}.json`).then(r => r.json())
    ]).then(([matching, kg, situationsData]) => {
      setMatchingResults(matching);
      setKnowledgeGraph(kg);
      setSituations(situationsData.situations);
      
      // 提取所有可用的關鍵字
      const keywordSet = new Set<string>(
        matching.matching_results.map((r: any) => String(r.關鍵字)).filter((k: string) => k)
      );
      const keywords = Array.from(keywordSet).sort();
      setAvailableKeywords(keywords);
    }).catch(err => console.error("載入資料失敗:", err));

    // 載入搜尋歷史
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
      console.error("載入搜尋歷史失敗:", e);
      }
    }
  }, [category.id]);

  // 處理關鍵字輸入變化，更新建議列表
  useEffect(() => {
    if (!keywordInput.trim()) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const input = keywordInput.trim().toLowerCase();
    const suggestions = availableKeywords
      .filter(kw => kw.toLowerCase().includes(input))
      .slice(0, 10); // 最多顯示 10 個建議
    
    setFilteredSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [keywordInput, availableKeywords]);


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
      const relevanceScore = (r.相關性分數 || 5) / 10; // 改為除以 10，讓分數範圍在 0-1
      score += stageWeight * relevanceScore;
    });
    
    return Math.min(score / records.length, 1);
  };

  const searchByKeyword = (keyword: string, threshold = 0): SearchResult[] => {
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
    if (!knowledgeGraph || !matchingResults) {
      console.log('知識圖譜或匹配結果未載入');
      return [];
    }
    
    const results: SearchResult[] = [];
    const processedDatasets = new Set<string>();

    situation.concepts.forEach(conceptName => {
      const conceptNode = knowledgeGraph.nodes.find(
        (n: any) => n.type === 'concept' && n.label === conceptName
      );

      if (!conceptNode) {
        console.log(`找不到概念: ${conceptName}`);
        return;
      }

      const keywordLinks = knowledgeGraph.links?.filter(
        (l: any) => l.type === 'keyword_to_concept' && l.target === conceptNode.id
      ) || [];

      console.log(`概念「${conceptName}」找到 ${keywordLinks.length} 個關鍵字連結`);

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

    console.log(`情境「${situation.name}」找到 ${results.length} 筆結果`);
    return results.sort((a, b) => b.relevance - a.relevance);
  };

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const addToSearchHistory = (keyword: string) => {
    const updatedHistory = [
      keyword,
      ...searchHistory.filter(k => k !== keyword)
    ].slice(0, 10); // 保留最近 10 筆
    
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
    toast({ 
      title: "已清除搜尋歷史", 
      description: "所有搜尋記錄已被刪除" 
    });
  };

  const handleKeywordSearch = (keyword?: string) => {
    const searchKeyword = keyword || keywordInput.trim();
    if (!searchKeyword) return;
    
    setShowSuggestions(false);
    const results = searchByKeyword(searchKeyword);
    setSearchResults(results);
    
    if (results.length === 0) {
      toast({ 
        title: "沒有找到相關資料集", 
        description: `關鍵字「${searchKeyword}」暫無對應結果，請嘗試其他關鍵字。` 
      });
      return;
    }

    // 添加到搜尋歷史
    addToSearchHistory(searchKeyword);
    scrollToResults();
  };

  const handleConceptSelect = (concept: any) => {
    if (!knowledgeGraph || !matchingResults) {
      toast({ title: "資料尚未載入", description: "請稍候再試，或改用關鍵字搜尋。" });
      return;
    }

    const results: SearchResult[] = [];
    const processedDatasets = new Set<string>();

    // 找出與此概念相關的關鍵字連結
    const keywordLinks = knowledgeGraph.links?.filter(
      (l: any) => l.type === 'keyword_to_concept' && l.target === concept.id
    ) || [];

    console.log(`概念「${concept.label}」找到 ${keywordLinks.length} 個關鍵字連結`);

    keywordLinks.forEach((link: any) => {
      const keywordName = link.source.replace('keyword_', '');
      const keywordResults = searchByKeyword(keywordName, 0);

      keywordResults.forEach(result => {
        if (!processedDatasets.has(result.name)) {
          processedDatasets.add(result.name);
          results.push({
            ...result,
            method: `概念導引: ${concept.label}`,
            matchReason: `屬於「${concept.category}」類別`
          });
        }
      });
    });

    console.log(`概念「${concept.label}」找到 ${results.length} 筆結果`);
    
    if (results.length === 0) {
      toast({ 
        title: "沒有找到相關資料集", 
        description: `概念「${concept.label}」暫無對應結果，請嘗試其他概念或關鍵字。` 
      });
      return;
    }

    setSearchResults(results.sort((a, b) => b.relevance - a.relevance));
    scrollToResults();
  };

  const handleSituationClick = (situation: Situation) => {
    if (!knowledgeGraph || !matchingResults) {
      toast({ title: "資料尚未載入", description: "請稍候再試，或改用關鍵字搜尋。" });
      return;
    }
    const results = searchBySituation(situation);
    setSearchResults(results);
    if (results.length === 0) {
      toast({ title: "沒有找到相關資料集", description: `情境「${situation.name}」暫無對應結果，請嘗試其他情境或關鍵字。` });
      return;
    }
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

  const handleViewDetail = async (datasetName: string) => {
    const detail = await getDatasetDetail(datasetName);
    if (detail) {
      setSelectedDataset(detail);
      setDialogType('detail');
      setDialogOpen(true);
    } else {
      toast({
        title: "找不到資料",
        description: "無法載入此資料集的詳細說明"
      });
    }
  };

  const handleViewSample = async (datasetName: string) => {
    const detail = await getDatasetDetail(datasetName);
    if (detail) {
      setSelectedDataset(detail);
      setDialogType('sample');
      setDialogOpen(true);
    } else {
      toast({
        title: "找不到資料",
        description: "無法載入此資料集的範例資料"
      });
    }
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
        <div className="flex gap-3 mb-6 relative">
          <div className="flex-1 relative">
            <Input
              placeholder="例如：變電所、饋線、輸電線路..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleKeywordSearch()}
              onFocus={() => keywordInput && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="text-lg"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => {
                      setKeywordInput(suggestion);
                      handleKeywordSearch(suggestion);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => handleKeywordSearch()} className="px-8">
            搜尋
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">快速搜尋：</span>
            {['變電所', '饋線', '停電', '再生能源', '電價', '負載'].map((kw) => (
              <Badge
                key={kw}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                onClick={() => {
                  setKeywordInput(kw);
                  handleKeywordSearch(kw);
                }}
              >
                {kw}
              </Badge>
            ))}
          </div>
          
          {searchHistory.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
              <span className="text-sm text-gray-600">搜尋歷史：</span>
              {searchHistory.map((kw, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                  onClick={() => {
                    setKeywordInput(kw);
                    handleKeywordSearch(kw);
                  }}
                >
                  {kw}
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearchHistory}
                className="text-xs text-gray-500 hover:text-red-600 h-6"
              >
                清除歷史
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 常見問題、概念瀏覽和知識圖譜 */}
      <div className="space-y-6">
        {/* 按鈕列 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant={showFAQ ? "default" : "outline"}
            className="w-full justify-start text-lg py-8 transition-all"
            onClick={() => {
              setShowFAQ(!showFAQ);
              if (!showFAQ) {
                setShowConcepts(false);
                setShowKnowledgeGraph(false);
              }
            }}
          >
            <span className="text-3xl mr-4">💬</span>
            <div className="flex flex-col items-start">
              <span className="font-semibold">常見問題</span>
              <span className="text-xs opacity-70">快速找到相關資料集</span>
            </div>
            <span className="ml-auto text-sm">
              {showFAQ ? '▲' : '▼'}
            </span>
          </Button>

          <Button
            variant={showConcepts ? "default" : "outline"}
            className="w-full justify-start text-lg py-8 transition-all"
            onClick={() => {
              setShowConcepts(!showConcepts);
              if (!showConcepts) {
                setShowFAQ(false);
                setShowKnowledgeGraph(false);
              }
            }}
          >
            <span className="text-3xl mr-4">🗂️</span>
            <div className="flex flex-col items-start">
              <span className="font-semibold">概念瀏覽</span>
              <span className="text-xs opacity-70">依主題分類探索</span>
            </div>
            <span className="ml-auto text-sm">
              {showConcepts ? '▲' : '▼'}
            </span>
          </Button>

          <Button
            variant={showKnowledgeGraph ? "default" : "outline"}
            className="w-full justify-start text-lg py-8 transition-all"
            onClick={() => {
              setShowKnowledgeGraph(!showKnowledgeGraph);
              if (!showKnowledgeGraph) {
                setShowFAQ(false);
                setShowConcepts(false);
              }
            }}
          >
            <span className="text-3xl mr-4">🗺️</span>
            <div className="flex flex-col items-start">
              <span className="font-semibold">知識圖譜</span>
              <span className="text-xs opacity-70">視覺化探索概念關聯</span>
            </div>
            <span className="ml-auto text-sm">
              {showKnowledgeGraph ? '▲' : '▼'}
            </span>
          </Button>
        </div>

        {/* 展開內容區（全寬） */}
        {showFAQ && (
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">💬 常見問題</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFAQ(false)}>
                收合 ✕
              </Button>
            </div>
            <FAQSection categoryId={category.id} onDatasetSelect={handleFAQDatasetSelect} />
          </Card>
        )}

        {showConcepts && (
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">🗂️ 概念瀏覽</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowConcepts(false)}>
                收合 ✕
              </Button>
            </div>
            <ConceptExplorer categoryId={category.id} onConceptSelect={handleConceptSelect} />
          </Card>
        )}

        {showKnowledgeGraph && knowledgeGraph && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">🗺️ 知識圖譜視覺化</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowKnowledgeGraph(false)}>
                收合 ✕
              </Button>
            </div>
            <KnowledgeGraphD3 data={knowledgeGraph} onConceptClick={handleConceptSelect} />
          </div>
        )}
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
                      onClick={() => handleViewDetail(result.name)}
                    >
                      查看詳情
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                      onClick={() => handleViewSample(result.name)}
                    >
                      範例資料
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <DatasetDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        datasetName={selectedDataset?.name || ''}
        description={selectedDataset?.description}
        sampleData={selectedDataset?.sampleData}
        type={dialogType}
      />
    </div>
  );
};

export default SearchInterface;
