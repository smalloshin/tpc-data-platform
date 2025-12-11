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

const CategoryLanding = ({ categories, onSelectCategory, onBrowseDatasets }: CategoryLandingProps) => {
  // 分離主要類別（發輸配售）和其他類別
  const mainCategories = categories.filter(c => ['generation', 'transmission', 'distribution', 'retail'].includes(c.id));
  const otherCategories = categories.filter(c => !['generation', 'transmission', 'distribution', 'retail'].includes(c.id));

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* 第一排：發輸配售 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mainCategories.map((category) => (
          <div
            key={category.id}
            className="relative h-[160px] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
            onClick={() => onSelectCategory(category)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 flex flex-col items-center justify-center p-4 group-hover:from-primary group-hover:to-accent transition-all duration-300">
              <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
              <h2 className="text-xl font-bold text-white mb-1">{category.name}</h2>
              <p className="text-xs text-white/90 text-center leading-relaxed line-clamp-2">{category.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 第二排：其他 + 瀏覽資料集 */}
      <div className="grid grid-cols-2 gap-4">
        {otherCategories.map((category) => (
          <div
            key={category.id}
            className="relative h-[140px] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
            onClick={() => onSelectCategory(category)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 flex flex-col items-center justify-center p-4 group-hover:from-primary group-hover:to-accent transition-all duration-300">
              <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
              <h2 className="text-xl font-bold text-white mb-1">{category.name}</h2>
              <p className="text-xs text-white/90 text-center leading-relaxed line-clamp-2">{category.description}</p>
            </div>
          </div>
        ))}
        {onBrowseDatasets && (
          <div
            className="relative h-[140px] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
            onClick={onBrowseDatasets}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 flex flex-col items-center justify-center p-4 group-hover:from-primary group-hover:to-accent transition-all duration-300">
              <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform duration-300">📊</div>
              <h2 className="text-xl font-bold text-white mb-1">瀏覽資料集</h2>
              <p className="text-xs text-white/90 text-center leading-relaxed">查看系統所有資料集的完整列表</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryLanding;
