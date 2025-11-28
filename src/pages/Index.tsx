import { useState, useEffect } from "react";
import CategoryLanding from "@/components/CategoryLanding";
import SearchInterface from "@/components/SearchInterface";

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模擬資料載入
    setTimeout(() => setLoading(false), 500);
  }, []);

  const categories: Category[] = [
    {
      id: "generation",
      name: "發電類別",
      icon: "🔋",
      description: "發電設施、發電量、能源結構相關資料"
    },
    {
      id: "transmission",
      name: "輸電類別",
      icon: "⚡",
      description: "輸配電設施、電力調度、系統運作相關資料"
    },
    {
      id: "distribution",
      name: "配電類別",
      icon: "🔌",
      description: "配電系統、用戶服務、供電品質相關資料"
    },
    {
      id: "retail",
      name: "售電類別",
      icon: "💡",
      description: "電力銷售、電價、用電統計相關資料"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">載入資料中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg py-10 text-center">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
          重要營運詮釋資料服務平台
        </h1>
        <p className="text-xl text-gray-600">基於知識圖譜的智能搜尋引擎</p>
      </header>

      {/* Main Content */}
      <main>
        <div className="max-w-[1400px] mx-auto px-5 py-16">
          {!selectedCategory ? (
            <CategoryLanding 
              categories={categories}
              onSelectCategory={setSelectedCategory}
            />
          ) : (
            <SearchInterface 
              category={selectedCategory}
              onBack={() => setSelectedCategory(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
