import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import StatsOverview from "@/components/StatsOverview";
import DataTable from "@/components/DataTable";
import ChartSection from "@/components/ChartSection";
import SearchFilters from "@/components/SearchFilters";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [region, setRegion] = useState("all");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            台電資料查詢平台
          </h1>
          <p className="text-muted-foreground text-lg">
            台灣電力公司用電資料分析與查詢系統
          </p>
        </div>

        <StatsOverview />

        <Card className="mt-8 p-6">
          <SearchFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateRange={dateRange}
            setDateRange={setDateRange}
            region={region}
            setRegion={setRegion}
          />
        </Card>

        <Tabs defaultValue="table" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="table">資料列表</TabsTrigger>
            <TabsTrigger value="chart">圖表分析</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="mt-6">
            <DataTable 
              searchQuery={searchQuery}
              dateRange={dateRange}
              region={region}
            />
          </TabsContent>
          
          <TabsContent value="chart" className="mt-6">
            <ChartSection region={region} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
