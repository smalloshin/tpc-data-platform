import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Question {
  question: string;
  related_datasets: string[];
  keywords: string[];
  answer_hint: string;
}

interface FAQCategory {
  category: string;
  icon: string;
  description: string;
  questions: Question[];
}

interface FAQSectionProps {
  categoryId: string;
  onDatasetSelect: (datasets: string[], question: string) => void;
}

const FAQSection = ({ categoryId, onDatasetSelect }: FAQSectionProps) => {
  const [faqData, setFaqData] = useState<{ faq_categories: FAQCategory[] } | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    // 根據類別載入對應的 FAQ 檔案
    const faqFile = categoryId === 'transmission' ? 'faq' : 
                   categoryId === 'distribution' ? 'distribution_faq' : 
                   'faq'; // 預設為輸電
    
    fetch(`/data/${faqFile}.json`)
      .then(r => r.json())
      .then(data => setFaqData(data))
      .catch(err => console.error("載入 FAQ 失敗:", err));
  }, [categoryId]);

  if (!faqData) {
    return (
      <Card className="p-6 bg-gray-50">
        <p className="text-center text-gray-500">載入常見問題中...</p>
      </Card>
    );
  }

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const toggleQuestion = (question: string) => {
    setExpandedQuestion(expandedQuestion === question ? null : question);
  };

  return (
    <Card className="p-6 bg-gray-50">
      <h3 className="text-xl font-semibold mb-4">從生活化問題開始探索</h3>
      <p className="text-sm text-gray-600 mb-6">
        點擊分類展開問題，點擊問題查看相關資料集
      </p>

      <div className="space-y-3">
        {faqData.faq_categories.map((cat) => (
          <div key={cat.category} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* 類別標題 */}
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              onClick={() => toggleCategory(cat.category)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-lg text-gray-800">{cat.category}</div>
                  <div className="text-sm text-gray-500">{cat.description}</div>
                </div>
              </div>
              {expandedCategory === cat.category ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* 問題列表 */}
            {expandedCategory === cat.category && (
              <div className="border-t border-gray-200 bg-gray-50">
                {cat.questions.map((q, idx) => (
                  <div key={idx} className="border-b border-gray-200 last:border-b-0">
                    {/* 問題標題 */}
                    <button
                      className="w-full flex items-start justify-between p-4 hover:bg-white transition-colors text-left"
                      onClick={() => toggleQuestion(q.question)}
                    >
                      <div className="flex-1 pr-4">
                        <div className="font-medium text-gray-800">{q.question}</div>
                        {expandedQuestion !== q.question && (
                          <div className="text-sm text-gray-500 mt-1">{q.answer_hint}</div>
                        )}
                      </div>
                      {expandedQuestion === q.question ? (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                      )}
                    </button>

                    {/* 問題詳情 */}
                    {expandedQuestion === q.question && (
                      <div className="px-4 pb-4 bg-white">
                        <div className="p-4 bg-blue-50 rounded-lg mb-3">
                          <div className="font-medium text-blue-900 mb-2">💡 提示</div>
                          <p className="text-sm text-blue-800">{q.answer_hint}</p>
                        </div>

                        {/* 關鍵字 */}
                        {q.keywords && q.keywords.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">相關關鍵字：</div>
                            <div className="flex flex-wrap gap-2">
                              {q.keywords.map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 相關資料集 */}
                        {q.related_datasets && q.related_datasets.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              相關資料集 ({q.related_datasets.length} 個)：
                            </div>
                            <Button
                              onClick={() => onDatasetSelect(q.related_datasets, q.question)}
                              className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                            >
                              查看相關資料集
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FAQSection;
