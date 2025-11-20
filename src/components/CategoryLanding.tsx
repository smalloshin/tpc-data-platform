interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface CategoryLandingProps {
  categories: Category[];
  onSelectCategory: (category: Category) => void;
}

const CategoryLanding = ({ categories, onSelectCategory }: CategoryLandingProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {categories.map((category) => (
        <div
          key={category.id}
          className="relative h-[350px] rounded-3xl overflow-hidden cursor-pointer transition-all duration-400 hover:-translate-y-3 hover:scale-105 hover:shadow-2xl"
          onClick={() => onSelectCategory(category)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 flex flex-col items-center justify-center p-8">
            <div className="text-8xl mb-5">{category.icon}</div>
            <h2 className="text-4xl font-bold text-white mb-3">{category.name}</h2>
            <p className="text-lg text-white/90 text-center">{category.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryLanding;
