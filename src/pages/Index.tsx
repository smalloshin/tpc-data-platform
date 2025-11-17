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
      id: "transmission",
      name: "輸電類別",
      icon: "⚡",
      description: "輸配電設施、電力調度、系統運作相關資料"
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
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent mb-3">
          台電開放資料集搜尋系統
        </h1>
        <p className="text-xl text-gray-600">基於知識圖譜的智能搜尋引擎 v2.0</p>
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
