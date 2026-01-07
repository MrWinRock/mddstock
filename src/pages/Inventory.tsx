import { useEffect, useState } from "react";
import { inventoryApi } from "@/lib/api";
import type { InventoryItemWithQuantity, AddInventoryRequest, UpdateInventoryRequest } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { InventoryDialog } from "@/components/inventory/InventoryDialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 10;

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItemWithQuantity[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItemWithQuantity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemWithQuantity | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItemWithQuantity | null>(null);
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
        <Button onClick={handleAddItem} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
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
              <TableHead>Material Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
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
              filteredInventory.map((item) => (
                <TableRow key={item.inventory_id}>
                  <TableCell className="font-mono">{item.material_code}</TableCell>
                  <TableCell className="font-medium">{item.item}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.unit || "-"}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-medium",
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
                        onClick={() => handleEditItem(item)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteItem(item)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
    </div>
  );
}
