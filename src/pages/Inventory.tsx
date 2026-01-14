import { useEffect, useState } from "react";
import { inventoryApi } from "@/lib/api";
import type { InventoryItemWithQuantity, AddInventoryRequest, UpdateInventoryRequest } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventoryDialog } from "@/components/inventory/InventoryDialog";
import { HistoryDialog } from "@/components/inventory/HistoryDialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, ArrowDownToLine, ArrowUpFromLine, History, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 30;

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItemWithQuantity[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItemWithQuantity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemWithQuantity | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItemWithQuantity | null>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanItem, setScanItem] = useState<InventoryItemWithQuantity | null>(null);
  const [scanType, setScanType] = useState<"in" | "out">("in");
  const [scanAmount, setScanAmount] = useState("");
  const [isScanLoading, setIsScanLoading] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<InventoryItemWithQuantity | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    const filtered = inventory.filter(
      (item) =>
        item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.material_code.toString().includes(searchQuery) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInventory(filtered);
  }, [searchQuery, inventory]);

  const fetchInventory = async () => {
    try {
      const response = await inventoryApi.getAll();
      setInventory(response.data || []);
      setFilteredInventory(response.data || []);
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

  const handleAddItem = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItemWithQuantity) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSaveItem = async (data: AddInventoryRequest | UpdateInventoryRequest) => {
    try {
      if ("inventory_id" in data) {
        await inventoryApi.update(data);
        toast({ title: "Success", description: "Item updated successfully" });
      } else {
        await inventoryApi.add(data);
        toast({ title: "Success", description: "Item added successfully" });
      }
      fetchInventory();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save item",
      });
      throw error;
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItem) return;

    try {
      await inventoryApi.delete({ inventory_id: deleteItem.inventory_id });
      toast({ title: "Success", description: "Item deleted successfully" });
      fetchInventory();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete item",
      });
    } finally {
      setDeleteItem(null);
    }
  };

  const handleOpenScanDialog = (item: InventoryItemWithQuantity, type: "in" | "out") => {
    setScanItem(item);
    setScanType(type);
    setScanAmount("");
    setScanDialogOpen(true);
  };

  const handleScanSubmit = async () => {
    if (!scanItem || !scanAmount) return;

    const amount = parseInt(scanAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
      });
      return;
    }

    setIsScanLoading(true);
    try {
      const scanFn = scanType === "in" ? inventoryApi.scanIn : inventoryApi.scanOut;
      await scanFn({ inventory_id: scanItem.inventory_id, amount });
      toast({
        title: "Success",
        description: `${scanType === "in" ? "Item In" : "Item Out"}: ${amount} ${scanItem.unit || "units"} of ${scanItem.item}`,
      });
      setScanDialogOpen(false);
      fetchInventory();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${scanType === "in" ? "add" : "remove"} items`,
      });
    } finally {
      setIsScanLoading(false);
    }
  };

  const handleOpenHistory = (item: InventoryItemWithQuantity) => {
    setHistoryItem(item);
    setHistoryDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInventory} className="gap-2 cursor-pointer">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleAddItem} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, code, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ลำดับ</TableHead>
              <TableHead>รหัส Material</TableHead>
              <TableHead>รายการ</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>หน่วยนับ</TableHead>
              <TableHead className="text-right">รับเข้า</TableHead>
              <TableHead className="text-right">เบิกจ่าย</TableHead>
              <TableHead className="text-right">คงเหลือ</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchQuery ? "No items match your search" : "No inventory items found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
                const isLowStock = (item.item_quantity || 0) < LOW_STOCK_THRESHOLD;
                return (
                  <TableRow key={item.inventory_id}>
                    <TableCell className={cn(isLowStock && "text-destructive")}>{filteredInventory.indexOf(item) + 1}</TableCell>
                    <TableCell className={cn("font-mono", isLowStock && "text-destructive")}>{item.material_code}</TableCell>
                    <TableCell className={cn("font-medium", isLowStock && "text-destructive")}>{item.item}</TableCell>
                    <TableCell className={cn(isLowStock && "text-destructive")}>{item.type}</TableCell>
                    <TableCell className={cn(isLowStock && "text-destructive")}>{item.unit || "-"}</TableCell>
                    <TableCell className={cn("text-right", isLowStock && "text-destructive")}>
                      {item.item_in?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className={cn("text-right", isLowStock && "text-destructive")}>
                      {item.item_out?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "font-bold",
                          (item.item_quantity || 0) < LOW_STOCK_THRESHOLD && "text-destructive"
                        )}
                      >
                        {item.item_quantity?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenScanDialog(item, "in")}
                          className="h-8 w-8 cursor-pointer text-green-600 hover:text-green-700"
                          title="Item In"
                        >
                          <ArrowDownToLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenScanDialog(item, "out")}
                          className="h-8 w-8 cursor-pointer text-orange-600 hover:text-orange-700"
                          title="Item Out"
                        >
                          <ArrowUpFromLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenHistory(item)}
                          className="h-8 w-8 cursor-pointer text-blue-600 hover:text-blue-700"
                          title="History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditItem(item)}
                          className="h-8 w-8 cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteItem(item)}
                          className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <InventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onSave={handleSaveItem}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.item}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item In/Out Dialog */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className={scanType === "in" ? "text-green-600" : "text-orange-600"}>
              {scanType === "in" ? "รับเข้า (Item In)" : "เบิกจ่าย (Item Out)"}
            </DialogTitle>
            <DialogDescription>
              {scanItem?.item} ({scanItem?.material_code})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="scan-amount">จำนวน ({scanItem?.unit || "units"})</Label>
            <Input
              id="scan-amount"
              type="number"
              min="1"
              value={scanAmount}
              onChange={(e) => setScanAmount(e.target.value)}
              placeholder="Enter amount"
              className="mt-2"
              autoFocus
            />
            {scanType === "out" && scanItem && (
              <p className="mt-2 text-sm text-muted-foreground">
                คงเหลือ: {scanItem.item_quantity?.toLocaleString() || 0} {scanItem.unit || "units"}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScanSubmit}
              disabled={isScanLoading || !scanAmount}
              className={scanType === "in" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
            >
              {isScanLoading ? "Processing..." : scanType === "in" ? "รับเข้า" : "เบิกจ่าย"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <HistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        item={historyItem}
      />
    </div>
  );
}
