import { useEffect, useState } from "react";
import { inventoryApi } from "@/lib/api";
import type { InventoryItemWithQuantity } from "@/types/api";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, TrendingDown, AlertTriangle, Boxes } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const LOW_STOCK_THRESHOLD = 30;

export default function Dashboard() {
  const [inventory, setInventory] = useState<InventoryItemWithQuantity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await inventoryApi.getAll();
      setInventory(response.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch inventory",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary stats
  const totalItems = inventory.length;
  const totalQuantity = inventory.reduce((sum, item) => sum + (item.item_quantity || 0), 0);
  const totalIn = inventory.reduce((sum, item) => sum + (item.item_in || 0), 0);
  const totalOut = inventory.reduce((sum, item) => sum + (item.item_out || 0), 0);
  const lowStockItems = inventory.filter((item) => (item.item_quantity || 0) < LOW_STOCK_THRESHOLD);

  // Chart data
  const topItemsData = [...inventory]
    .sort((a, b) => (b.item_quantity || 0) - (a.item_quantity || 0))
    .slice(0, 5)
    .map((item) => ({
      name: item.item.length > 15 ? item.item.substring(0, 15) + "..." : item.item,
      quantity: item.item_quantity || 0,
    }));

  const typeDistribution = inventory.reduce((acc, item) => {
    const type = item.type || "Unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#FF6B9D", "#4ECDC4", "#FFE66D", "#95E87E", "#FF8C42", "#A78BFA", "#67E8F9"];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          title="Total Items"
          value={totalItems}
          description="Unique inventory items"
          icon={Package}
        />
        <SummaryCard
          title="Total Quantity"
          value={totalQuantity.toLocaleString()}
          description="Items in stock"
          icon={Boxes}
        />
        <SummaryCard
          title="Total Scanned In"
          value={totalIn.toLocaleString()}
          description="All time"
          icon={TrendingUp}
        />
        <SummaryCard
          title="Total Scanned Out"
          value={totalOut.toLocaleString()}
          description="All time"
          icon={TrendingDown}
        />
        <SummaryCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          description={`Below ${LOW_STOCK_THRESHOLD} units`}
          icon={AlertTriangle}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Items by Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            {topItemsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topItemsData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No inventory data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Items by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent, x, y, midAngle }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 130;
                      const cx2 = 0;
                      const cy2 = 0;
                      const labelX = x + Math.cos(-midAngle * RADIAN) * 10;
                      const labelY = y + Math.sin(-midAngle * RADIAN) * 10;
                      return (
                        <text
                          x={labelX}
                          y={labelY}
                          fill="#000000"
                          textAnchor={labelX > (cx2 || 0) ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-xs"
                        >
                          {`${name} (${(percent * 100).toFixed(0)}%)`}
                        </text>
                      );
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert Table */}
      {lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.inventory_id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{item.item}</p>
                    <p className="text-sm text-muted-foreground">
                      Code: {item.material_code} | Type: {item.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{item.item_quantity || 0}</p>
                    <p className="text-xs text-muted-foreground">{item.unit || "units"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
