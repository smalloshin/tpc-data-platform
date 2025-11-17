import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ChartSectionProps {
  region: string;
}

const ChartSection = ({ region }: ChartSectionProps) => {
  const monthlyData = [
    { month: "1月", usage: 3200, amount: 11400 },
    { month: "2月", usage: 2900, amount: 10300 },
    { month: "3月", usage: 3400, amount: 12100 },
    { month: "4月", usage: 3600, amount: 12800 },
    { month: "5月", usage: 4100, amount: 14600 },
    { month: "6月", usage: 4500, amount: 16000 },
    { month: "7月", usage: 5200, amount: 18500 },
    { month: "8月", usage: 5400, amount: 19200 },
    { month: "9月", usage: 4800, amount: 17100 },
    { month: "10月", usage: 3900, amount: 13900 },
    { month: "11月", usage: 3300, amount: 11800 },
    { month: "12月", usage: 3500, amount: 12500 },
  ];

  const regionData = [
    { region: "台北市", usage: 45000 },
    { region: "新北市", usage: 38000 },
    { region: "桃園市", usage: 32000 },
    { region: "台中市", usage: 35000 },
    { region: "台南市", usage: 28000 },
    { region: "高雄市", usage: 40000 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">月度用電趨勢</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem"
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="usage" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              name="用電量 (kWh)"
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">各地區用電量分布</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={regionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem"
              }}
            />
            <Bar 
              dataKey="usage" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
              name="用電量 (kWh)"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-foreground mb-4">用電量與費用對比</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem"
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="usage" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="用電量 (kWh)"
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              name="費用 (元)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default ChartSection;
