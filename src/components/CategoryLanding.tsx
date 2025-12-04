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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {categories.map((category) => (
        <div
          key={category.id}
          className="relative h-[320px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group"
          onClick={() => onSelectCategory(category)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 flex flex-col items-center justify-center p-6 group-hover:from-primary group-hover:to-accent transition-all duration-300">
            <div className="text-7xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
            <h2 className="text-3xl font-bold text-white mb-2">{category.name}</h2>
            <p className="text-base text-white/90 text-center leading-relaxed">{category.description}</p>
          </div>
        </div>
      ))}
      {onBrowseDatasets && (
        <div
          className="relative h-[320px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group"
          onClick={onBrowseDatasets}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-teal-600/90 flex flex-col items-center justify-center p-6 group-hover:from-emerald-600 group-hover:to-teal-600 transition-all duration-300">
            <div className="text-7xl mb-4 transform group-hover:scale-110 transition-transform duration-300">📊</div>
            <h2 className="text-3xl font-bold text-white mb-2">瀏覽資料集</h2>
            <p className="text-base text-white/90 text-center leading-relaxed">查看系統所有資料集的完整列表</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryLanding;
