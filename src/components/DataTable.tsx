import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DataTableProps {
  searchQuery: string;
  dateRange: { start: string; end: string };
  region: string;
}

const DataTable = ({ searchQuery, dateRange, region }: DataTableProps) => {
  // 模擬資料
  const mockData = [
    { id: "001", date: "2025-01", location: "台北市", usage: 3450, amount: 12500, status: "已繳費" },
    { id: "002", date: "2025-01", location: "新北市", usage: 2890, amount: 10200, status: "已繳費" },
    { id: "003", date: "2025-01", location: "桃園市", usage: 4120, amount: 14800, status: "未繳費" },
    { id: "004", date: "2025-01", location: "台中市", usage: 3780, amount: 13500, status: "已繳費" },
    { id: "005", date: "2025-01", location: "台南市", usage: 2950, amount: 10500, status: "已繳費" },
    { id: "006", date: "2025-01", location: "高雄市", usage: 4580, amount: 16300, status: "未繳費" },
    { id: "007", date: "2025-01", location: "新竹市", usage: 3290, amount: 11700, status: "已繳費" },
    { id: "008", date: "2025-01", location: "基隆市", usage: 2670, amount: 9500, status: "已繳費" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">用戶編號</TableHead>
              <TableHead className="font-semibold">日期</TableHead>
              <TableHead className="font-semibold">地區</TableHead>
              <TableHead className="font-semibold text-right">用電量 (kWh)</TableHead>
              <TableHead className="font-semibold text-right">金額 (元)</TableHead>
              <TableHead className="font-semibold">狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{row.id}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.location}</TableCell>
                <TableCell className="text-right font-semibold">{row.usage.toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold">NT$ {row.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge 
                    variant={row.status === "已繳費" ? "default" : "destructive"}
                    className={row.status === "已繳費" ? "bg-success hover:bg-success/80" : ""}
                  >
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default DataTable;
