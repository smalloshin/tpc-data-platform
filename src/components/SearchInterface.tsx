import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, HelpCircle, Layers, Share2, X } from "lucide-react";

import FAQSection from "@/components/FAQSection";
import ConceptExplorer from "@/components/ConceptExplorer";
import DatasetDetailDialog from "@/components/DatasetDetailDialog";
import KnowledgeGraphD3 from "@/components/KnowledgeGraphD3";
import ResponsibleUnitExplorer from "@/components/ResponsibleUnitExplorer";
import OtherSituationExplorer from "@/components/OtherSituationExplorer";
import OtherSystemDetailDialog from "@/components/OtherSystemDetailDialog";
import { toast } from "@/components/ui/use-toast";
import { getDatasetDetail, type DatasetDetail } from "@/utils/datasetLoader";
import { loadOtherSystems, searchOtherSystems, type SystemData } from "@/utils/otherSystemsLoader";
import { getBigDataDataset, type BigDataDataset } from "@/utils/bigDataLoader";


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
  source?: string;
}

const SearchInterface = ({ category, onBack }: SearchInterfaceProps) => {
  const [matchingResults, setMatchingResults] = useState<any>(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [situations, setSituations] = useState<Situation[]>([]);
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
  const [quickSearchKeywords, setQuickSearchKeywords] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'detail' | 'sample' | 'summary' | 'tags' | 'rewrite'>('detail');
  const [selectedDataset, setSelectedDataset] = useState<DatasetDetail | null>(null);
  const [selectedBigData, setSelectedBigData] = useState<BigDataDataset | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showConcepts, setShowConcepts] = useState(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [showResponsibleUnit, setShowResponsibleUnit] = useState(false);
  const [showSituationExplorer, setShowSituationExplorer] = useState(false);
  const [otherSystems, setOtherSystems] = useState<SystemData[]>([]);
  const [otherSearchResults, setOtherSearchResults] = useState<SystemData[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<SystemData | null>(null);
  const [systemDialogOpen, setSystemDialogOpen] = useState(false);
  
  const isOtherCategory = category.id === "other";

  useEffect(() => {
    // 切換類別時重置所有狀態
    setSearchResults([]);
    setOtherSearchResults([]);
    setKeywordInput("");
    setDialogOpen(false);
    setSystemDialogOpen(false);
    setShowFAQ(false);
    setShowConcepts(false);
    setShowKnowledgeGraph(false);
    setShowResponsibleUnit(false);
    setShowSituationExplorer(false);
    
    // 根據類別 ID 決定要載入的資料檔案
    const categoryId = category.id;
    
    // 若為「其他」類別，載入系統資料
    if (categoryId === 'other') {
      loadOtherSystems().then(systems => {
        setOtherSystems(systems);
        
        // 從系統資料提取關鍵字
        const keywordSet = new Set<string>();
        systems.forEach(system => {
          // 從管理標的提取關鍵字
          if (system.managementTarget) {
            keywordSet.add(system.managementTarget);
          }
          // 從主題領域提取
          if (system.themeL1) {
            keywordSet.add(system.themeL1);
          }
        });
        const keywords = Array.from(keywordSet).sort();
        setAvailableKeywords(keywords);
        
        // 選取熱門主題作為快速搜尋
        const themeCount = new Map<string, number>();
        systems.forEach(system => {
          if (system.themeL1) {
            themeCount.set(system.themeL1, (themeCount.get(system.themeL1) || 0) + 1);
          }
        });
        
        const topKeywords = Array.from(themeCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([keyword]) => keyword);
        
        setQuickSearchKeywords(topKeywords);
      });
    } else {
      // 非「其他」類別，載入 JSON 檔案
      Promise.all([
        fetch(`/data/${categoryId}_matching_results.json`).then(r => r.json()),
        fetch(`/data/${categoryId}_knowledge_graph.json`).then(r => r.json()),
        fetch(`/data/${categoryId}_situations.json`).then(r => r.json())
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
        
        // 統計關鍵字出現次數，選取最熱門的6個作為快速搜尋
        const keywordCount = new Map<string, number>();
        matching.matching_results.forEach((r: any) => {
          const keyword = String(r.關鍵字);
          if (keyword) {
            keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
          }
        });
        
        const topKeywords = Array.from(keywordCount.entries())
          .sort((a, b) => b[1] - a[1]) // 按出現次數降序排列
          .slice(0, 6) // 取前6個
          .map(([keyword]) => keyword);
        
        setQuickSearchKeywords(topKeywords);
      }).catch(err => console.error("載入資料失敗:", err));
    }

    // 載入搜尋歷史
    const savedHistory = localStorage.getItem(`searchHistory_${categoryId}`);
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
          matchReason: records[0].匹配原因 || '',
          source: records[0].資料集來源 || ''
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

      const edges = knowledgeGraph.edges || knowledgeGraph.links || [];
      const keywordLinks = edges.filter(
        (l: any) => l.type === 'belongs_to' && l.target === conceptNode.id
      );

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
    localStorage.setItem(`searchHistory_${category.id}`, JSON.stringify(updatedHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(`searchHistory_${category.id}`);
    toast({ 
      title: "已清除搜尋歷史", 
      description: "所有搜尋記錄已被刪除" 
    });
  };

  const handleKeywordSearch = async (keyword?: string) => {
    const searchKeyword = keyword || keywordInput.trim();
    if (!searchKeyword) return;
    
    setShowSuggestions(false);

    // 「其他」類別使用不同的搜尋邏輯
    if (isOtherCategory) {
      // 確保從 loader 取得最新的快取資料
      const systems = await loadOtherSystems();
      const results = searchOtherSystems(systems, searchKeyword);
      setOtherSearchResults(results);
      
      if (results.length === 0) {
        toast({ 
          title: "沒有找到相關系統", 
          description: `關鍵字「${searchKeyword}」暫無對應結果，請嘗試其他關鍵字。` 
        });
        return;
      }
      addToSearchHistory(searchKeyword);
      scrollToResults();
      return;
    }

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

    // 找出與此概念相關的連結（支援 edges 或 links）
    const edges = knowledgeGraph.edges || knowledgeGraph.links || [];
    
    // 方法 1: 透過 belongs_to、keyword_to_concept 或 relationship === '屬於' 找關鍵字再匹配資料集
    const keywordLinks = edges.filter((l: any) => {
      const isKeywordToConcept = 
        l.type === 'belongs_to' || 
        l.type === 'keyword_to_concept' ||
        l.relationship === '屬於';
      const targetMatchesId = l.target === concept.id;
      const targetMatchesLabel = l.target === concept.label;
      return isKeywordToConcept && (targetMatchesId || targetMatchesLabel);
    });

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

    // 方法 2: 透過 concept_to_dataset 直接找資料集（輸電等類別使用此格式）
    const datasetLinks = edges.filter(
      (l: any) => l.type === 'concept_to_dataset' && l.source === concept.id
    );

    console.log(`概念「${concept.label}」找到 ${datasetLinks.length} 個直接資料集連結`);

    datasetLinks.forEach((link: any) => {
      // 取得資料集名稱（需從 matching_results 或 nodes 中找）
      const datasetNode = knowledgeGraph.nodes?.find((n: any) => n.id === link.target);
      const viaKeywords = link.via_keywords || [];
      
      // 透過 via_keywords 找資料集名稱
      viaKeywords.forEach((keyword: string) => {
        const keywordResults = searchByKeyword(keyword, 0);
        keywordResults.forEach(result => {
          if (!processedDatasets.has(result.name)) {
            processedDatasets.add(result.name);
            results.push({
              ...result,
              relevance: Math.max(result.relevance, link.score || 0.7),
              method: `概念導引: ${concept.label}`,
              matchReason: `屬於「${concept.category}」類別（透過：${keyword}）`
            });
          }
        });
      });
    });

    console.log(`概念「${concept.label}」最終找到 ${results.length} 筆結果`);
    
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

  const handleFAQDatasetSelect = (datasets: any[], question: string) => {
    const results: SearchResult[] = [];
    
    datasets.forEach((dataset: any) => {
      // 處理新的資料格式：datasets 現在是物件陣列 {id, title, url}
      const datasetName = typeof dataset === 'string' ? dataset : dataset.title;
      
      // 從 matching_results 查找該資料集的資訊
      let source = '';
      let stage = '';
      let keywords: string[] = [];
      
      if (matchingResults?.matching_results) {
        const matchRecords = matchingResults.matching_results.filter(
          (r: any) => r.資料集名稱 === datasetName
        );
        
        if (matchRecords.length > 0) {
          source = matchRecords[0].資料集來源 || '';
          stage = matchRecords[0].匹配階段 || '';
          // 收集相關關鍵字
          const keywordSet = new Set<string>();
          matchRecords.forEach((r: any) => {
            if (r.關鍵字) keywordSet.add(r.關鍵字);
          });
          keywords = Array.from(keywordSet).slice(0, 5);
        }
      }
      
      results.push({
        name: datasetName,
        relevance: 1.0,
        stage: stage || '第一階段',
        method: 'FAQ 推薦',
        matchReason: `相關問題: ${question}`,
        source,
        keywords
      });
    });

    setSearchResults(results);
    scrollToResults();
  };

  const handleViewDetail = async (datasetName: string, source?: string) => {
    if (source === '大數據平台資料集') {
      // 大數據平台資料集：顯示標籤
      const bigData = await getBigDataDataset(datasetName);
      if (bigData) {
        setSelectedBigData(bigData);
        setSelectedDataset(null);
        setDialogType('tags');
        setDialogOpen(true);
      } else {
        toast({
          title: "找不到資料",
          description: "無法載入此資料集的標籤資訊"
        });
      }
    } else {
      // 開放資料集：顯示詳細說明
      const detail = await getDatasetDetail(datasetName);
      if (detail) {
        setSelectedDataset(detail);
        setSelectedBigData(null);
        setDialogType('detail');
        setDialogOpen(true);
      } else {
        toast({
          title: "找不到資料",
          description: "無法載入此資料集的詳細說明"
        });
      }
    }
  };

  const handleViewSample = async (datasetName: string) => {
    const detail = await getDatasetDetail(datasetName);
    if (detail) {
      setSelectedDataset(detail);
      setSelectedBigData(null);
      setDialogType('sample');
      setDialogOpen(true);
    } else {
      toast({
        title: "找不到資料",
        description: "無法載入此資料集的範例資料"
      });
    }
  };

  const handleViewSummary = async (datasetName: string, source?: string) => {
    if (source === '大數據平台資料集') {
      // 大數據平台資料集：顯示重寫敘述
      const bigData = await getBigDataDataset(datasetName);
      if (bigData) {
        setSelectedBigData(bigData);
        setSelectedDataset(null);
        setDialogType('rewrite');
        setDialogOpen(true);
      } else {
        toast({
          title: "找不到資料",
          description: "無法載入此資料集的重寫敘述"
        });
      }
    } else {
      // 開放資料集：顯示 AI 解釋
      const detail = await getDatasetDetail(datasetName);
      if (detail) {
        setSelectedDataset(detail);
        setSelectedBigData(null);
        setDialogType('summary');
        setDialogOpen(true);
      } else {
        toast({
          title: "找不到資料",
          description: "無法載入此資料集的 AI 解釋"
        });
      }
    }
  };

  // 當前激活的 Tab
  const [activeTab, setActiveTab] = useState<'search' | 'faq' | 'concepts' | 'graph'>('search');

  const tabs = [
    { id: 'search' as const, label: '關鍵字搜尋', desc: '快速找到相關資料庫', icon: Search },
    { id: 'faq' as const, label: '常見問題', desc: '快速找到相關資料庫', icon: HelpCircle },
    { id: 'concepts' as const, label: '概念瀏覽', desc: '依主題分類探索', icon: Layers },
    { id: 'graph' as const, label: '知識圖譜', desc: '視覺化探索概念關聯', icon: Share2 },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero 區塊 */}
      <div className="bg-[hsl(var(--hero-bg))] rounded-t-3xl pt-8 pb-12 px-8 relative overflow-hidden">
        {/* 返回按鈕 */}
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6 bg-foreground/10 hover:bg-foreground/20 text-foreground"
        >
          ← 返回選擇
        </Button>

        {/* 標題區 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {category.name}資料集搜尋
          </h2>
        </div>

        {/* 麵包屑導航 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full">首頁</span>
          <span className="text-foreground/60">/</span>
          <span className="text-foreground/80">{category.name}資料集搜尋</span>
        </div>
      </div>

      {/* Tab 按鈕列 - 非「其他」類別時顯示 */}
      {!isOtherCategory && (
        <Card className="mx-4 -mt-6 relative z-10 p-4 rounded-2xl shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left ${
                    isActive 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : 'hover:bg-muted border-2 border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {tab.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* 主內容區 */}
      <div className="bg-background rounded-b-3xl p-6 md:p-8 shadow-2xl">
        
        {/* 關鍵字搜尋區塊 */}
        {(activeTab === 'search' || isOtherCategory) && (
          <Card className="p-6 bg-card border border-border mb-6 relative">
            <h3 className="text-xl font-semibold mb-4 text-foreground">請輸入關鍵字</h3>
            <div className="flex gap-3 mb-6 relative">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="w-5 h-5" />
                </div>
                <Input
                  placeholder="請輸入關鍵字，如：變電所、饋線、輸電線路..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleKeywordSearch()}
                  onFocus={() => keywordInput && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="text-lg pl-10 h-12 rounded-full border-border"
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
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
              <Button onClick={() => handleKeywordSearch()} className="px-8 h-12 rounded-full">
                搜尋
              </Button>
            </div>
            <div className="space-y-3">
              {quickSearchKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">快速搜尋：</span>
                  {quickSearchKeywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        setKeywordInput(kw);
                        handleKeywordSearch(kw);
                      }}
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}
              
              {searchHistory.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">歷史搜尋：</span>
                  {searchHistory.map((kw, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        setKeywordInput(kw);
                        handleKeywordSearch(kw);
                      }}
                    >
                      {kw}
                    </Badge>
                  ))}
                  <button
                    onClick={clearSearchHistory}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                    清除歷史
                  </button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 常見問題 */}
        {activeTab === 'faq' && !isOtherCategory && (
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                常見問題
              </h3>
            </div>
            <FAQSection categoryId={category.id} onDatasetSelect={handleFAQDatasetSelect} />
          </Card>
        )}

        {/* 概念瀏覽 */}
        {activeTab === 'concepts' && !isOtherCategory && (
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                概念瀏覽
              </h3>
            </div>
            <ConceptExplorer categoryId={category.id} onConceptSelect={handleConceptSelect} />
          </Card>
        )}

        {/* 知識圖譜 */}
        {activeTab === 'graph' && !isOtherCategory && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                知識圖譜視覺化
              </h3>
            </div>
            <KnowledgeGraphD3 categoryId={category.id} onConceptClick={handleConceptSelect} />
          </div>
        )}

        {/* 「其他」類別專用按鈕 */}
        {isOtherCategory && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant={showResponsibleUnit ? "default" : "outline"}
                className="w-full justify-start text-lg py-8 transition-all"
                onClick={() => {
                  setShowResponsibleUnit(!showResponsibleUnit);
                  if (!showResponsibleUnit) {
                    setShowSituationExplorer(false);
                  }
                }}
              >
                <span className="text-3xl mr-4">🏢</span>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">主責單位</span>
                  <span className="text-xs opacity-70">依單位分類探索</span>
                </div>
                <span className="ml-auto text-sm">
                  {showResponsibleUnit ? '▲' : '▼'}
                </span>
              </Button>

              <Button
                variant={showSituationExplorer ? "default" : "outline"}
                className="w-full justify-start text-lg py-8 transition-all"
                onClick={() => {
                  setShowSituationExplorer(!showSituationExplorer);
                  if (!showSituationExplorer) {
                    setShowResponsibleUnit(false);
                  }
                }}
              >
                <span className="text-3xl mr-4">🎯</span>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">情境探索</span>
                  <span className="text-xs opacity-70">依使用情境探索</span>
                </div>
                <span className="ml-auto text-sm">
                  {showSituationExplorer ? '▲' : '▼'}
                </span>
              </Button>
            </div>

            {/* 展開內容區 */}
            {showResponsibleUnit && (
              <Card className="p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">🏢 主責單位</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowResponsibleUnit(false)}>
                    收合 ✕
                  </Button>
                </div>
                <ResponsibleUnitExplorer 
                  onSystemSelect={(system) => {
                    setSelectedSystem(system);
                    setSystemDialogOpen(true);
                  }}
                />
              </Card>
            )}

            {showSituationExplorer && (
              <Card className="p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">🎯 情境探索</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowSituationExplorer(false)}>
                    收合 ✕
                  </Button>
                </div>
                <OtherSituationExplorer 
                  onSystemSelect={(system) => {
                    setSelectedSystem(system);
                    setSystemDialogOpen(true);
                  }}
                />
              </Card>
            )}
          </div>
        )}

        {/* 「其他」類別搜尋結果 */}
        {isOtherCategory && otherSearchResults.length > 0 && (
        <div ref={resultsRef} className="mt-8">
          <h3 className="text-2xl font-bold mb-6">
            找到 {otherSearchResults.length} 個相關系統
          </h3>
          <div className="space-y-4">
            {otherSearchResults.map((system, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {system.systemName}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {system.purpose}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">{system.responsibleUnit}</Badge>
                      {system.themeL1 && (
                        <Badge variant="outline">{system.themeL1}</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {system.managementTarget}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedSystem(system);
                      setSystemDialogOpen(true);
                    }}
                  >
                    查看詳情
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 非「其他」類別搜尋結果 */}
      {!isOtherCategory && searchResults.length > 0 && (
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
                      {result.source && (
                        <Badge 
                          variant="outline"
                          className={result.source === '大數據平台資料集' 
                            ? 'border-orange-400 text-orange-600 bg-orange-50' 
                            : 'border-green-400 text-green-600 bg-green-50'}
                        >
                          {result.source}
                        </Badge>
                      )}
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
                  <div className="flex flex-wrap gap-2 ml-4">
                    {result.source === '大數據平台資料集' ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          onClick={() => handleViewDetail(result.name, result.source)}
                        >
                          標籤
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          onClick={() => handleViewSummary(result.name, result.source)}
                        >
                          ✨ AI資料集解釋
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetail(result.name, result.source)}
                        >
                          查看詳情
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-purple-300 text-purple-600 hover:bg-purple-50"
                          onClick={() => handleViewSummary(result.name, result.source)}
                        >
                          ✨ AI資料集解釋
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                          onClick={() => handleViewSample(result.name)}
                        >
                          範例資料
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        )}
      </div>

      <DatasetDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        datasetName={selectedDataset?.name || selectedBigData?.name || ''}
        description={selectedDataset?.description}
        sampleData={selectedDataset?.sampleData}
        summary={selectedDataset?.summary}
        bigDataDataset={selectedBigData}
        type={dialogType}
      />

      <OtherSystemDetailDialog
        open={systemDialogOpen}
        onOpenChange={setSystemDialogOpen}
        system={selectedSystem}
      />
    </div>
  );
};

export default SearchInterface;
