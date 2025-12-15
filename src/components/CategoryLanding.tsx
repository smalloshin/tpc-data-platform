import { Battery, Zap, PlugZap, CircleDollarSign, FolderOpen, Database } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface CategoryLandingProps {
  categories: Category[];
  onSelectCategory: (category: Category) => void;
  onBrowseDatasets?: () => void;
}

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'generation':
      return <Battery className="w-12 h-12 text-primary stroke-[1.5]" />;
    case 'transmission':
      return <Zap className="w-12 h-12 text-primary stroke-[1.5]" />;
    case 'distribution':
      return <PlugZap className="w-12 h-12 text-primary stroke-[1.5]" />;
    case 'retail':
      return <CircleDollarSign className="w-12 h-12 text-primary stroke-[1.5]" />;
    case 'other':
      return <FolderOpen className="w-12 h-12 text-primary stroke-[1.5]" />;
    case 'browse':
      return <Database className="w-12 h-12 text-primary stroke-[1.5]" />;
    default:
      return <FolderOpen className="w-12 h-12 text-primary stroke-[1.5]" />;
  }
};

const CategoryLanding = ({ categories, onSelectCategory, onBrowseDatasets }: CategoryLandingProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => onSelectCategory(category)}
          className="bg-card border border-border rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-secondary/50 group-hover:bg-secondary transition-colors">
              {getCategoryIcon(category.id)}
            </div>
            <div>
              <h3 className="font-bold text-lg text-card-foreground mb-2">{category.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{category.description}</p>
            </div>
          </div>
        </div>
      ))}
      
      {/* 瀏覽資料集 Card */}
      {onBrowseDatasets && (
        <div
          onClick={onBrowseDatasets}
          className="bg-card border border-border rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-secondary/50 group-hover:bg-secondary transition-colors">
              <Database className="w-12 h-12 text-primary stroke-[1.5]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-card-foreground mb-2">瀏覽資料集</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">查看所有可用的資料集</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryLanding;
