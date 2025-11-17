import { Card } from "@/components/ui/card";
import { TrendingUp, Activity, Database, Users } from "lucide-react";

const StatsOverview = () => {
  const stats = [
    {
      title: "總用電量",
      value: "1,234,567",
      unit: "kWh",
      change: "+12.5%",
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "用戶數量",
      value: "45,678",
      unit: "戶",
      change: "+8.3%",
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "資料筆數",
      value: "892,341",
      unit: "筆",
      change: "+15.2%",
      icon: Database,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "成長率",
      value: "23.4%",
      unit: "",
      change: "+5.1%",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                  {stat.unit && (
                    <span className="text-sm text-muted-foreground">{stat.unit}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-medium text-success">{stat.change}</span>
                  <span className="text-xs text-muted-foreground">vs 上月</span>
                </div>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverview;
