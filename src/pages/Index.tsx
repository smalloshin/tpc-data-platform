import { useState, useEffect } from "react";
import { Download, User, Zap, Battery, PlugZap, CircleDollarSign, FolderOpen } from "lucide-react";
import CategoryLanding from "@/components/CategoryLanding";
import SearchInterface from "@/components/SearchInterface";
import DatasetBrowser from "@/components/DatasetBrowser";
import { Button } from "@/components/ui/button";
import { mergeAndDownloadExcel } from "@/utils/excelMerger";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

type ViewMode = "landing" | "category" | "browser";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("landing");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleDownloadMergedExcel = async () => {
    setDownloading(true);
    try {
      await mergeAndDownloadExcel();
      toast.success("Excel 檔案已下載");
    } catch (error) {
      toast.error("下載失敗，請稍後再試");
    } finally {
      setDownloading(false);
    }
  };

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
    },
    {
      id: "other",
      name: "探索",
      icon: "📁",
      description: "其他相關資料"
    }
  ];

  const navCategories = categories.filter(c => c.id !== 'other');

  const handleNavClick = (category: Category) => {
    setSelectedCategory(category);
    setViewMode("category");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--hero-gradient-start))] to-[hsl(var(--hero-gradient-end))]">
        <div className="text-foreground text-xl">載入資料中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-primary">重要營運詮釋資料服務平台</h1>
            <p className="text-xs text-muted-foreground">基於知識圖譜的智能搜尋引擎 v2.0</p>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleNavClick(cat)}
                className="text-sm text-foreground hover:text-primary transition-colors"
              >
                {cat.name}
              </button>
            ))}
            <button
              onClick={() => handleNavClick(categories.find(c => c.id === 'other')!)}
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              其他類別
            </button>
            <button
              onClick={() => setViewMode("browser")}
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              瀏覽資料集
            </button>
          </nav>

          {/* Login Button */}
          <Button variant="default" size="sm" className="rounded-full px-4">
            <User className="w-4 h-4 mr-2" />
            登入/註冊
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {viewMode === "landing" && (
          <>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-start))] to-[hsl(var(--hero-gradient-end))]">
              <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  {/* Left: Text */}
                  <div className="space-y-6">
                    <p className="text-muted-foreground text-lg">
                      您定義探索範圍、提問題，剩下的分析交給系統。
                    </p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                      用最直覺的方式串起重要營運詮釋資料來源與問題思考，給你更清楚的決策依據
                    </h2>
                  </div>
                  
                  {/* Right: Illustration Placeholder */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="w-full max-w-md aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="flex justify-center gap-4">
                          <Battery className="w-16 h-16 text-primary" />
                          <Zap className="w-16 h-16 text-accent" />
                        </div>
                        <div className="flex justify-center gap-4">
                          <PlugZap className="w-16 h-16 text-primary" />
                          <CircleDollarSign className="w-16 h-16 text-accent" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Category Cards */}
            <section className="bg-background py-8">
              <div className="max-w-7xl mx-auto px-6">
                <CategoryLanding 
                  categories={categories}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setViewMode("category");
                  }}
                  onBrowseDatasets={() => setViewMode("browser")}
                />
              </div>
            </section>
          </>
        )}

        {viewMode === "category" && selectedCategory && (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <SearchInterface 
              category={selectedCategory}
              onBack={() => {
                setSelectedCategory(null);
                setViewMode("landing");
              }}
            />
          </div>
        )}

        {viewMode === "browser" && (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <DatasetBrowser onBack={() => setViewMode("landing")} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
