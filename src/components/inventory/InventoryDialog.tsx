import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InventoryItemWithQuantity, AddInventoryRequest, UpdateInventoryRequest } from "@/types/api";

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItemWithQuantity | null;
  onSave: (data: AddInventoryRequest | UpdateInventoryRequest) => Promise<void>;
}

export function InventoryDialog({ open, onOpenChange, item, onSave }: InventoryDialogProps) {
  const [materialCode, setMaterialCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [type, setType] = useState("");
  const [unit, setUnit] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setMaterialCode(String(item.material_code));
      setItemName(item.item);
      setType(item.type);
      setUnit(item.unit || "");
    } else {
      setMaterialCode("");
      setItemName("");
      setType("");
      setUnit("");
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && item) {
        await onSave({
          inventory_id: item.inventory_id,
          material_code: parseInt(materialCode),
          item: itemName,
          type,
          unit: unit || undefined,
        } as UpdateInventoryRequest);
      } else {
        await onSave({
          material_code: parseInt(materialCode),
          item: itemName,
          type,
          unit: unit || undefined,
        } as AddInventoryRequest);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the inventory item details" : "Add a new item to your inventory"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="materialCode">Material Code</Label>
              <Input
                id="materialCode"
                type="number"
                placeholder="Enter material code"
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                type="text"
                placeholder="Enter item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                type="text"
                placeholder="Enter item type (e.g., PPE, Medical)"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit (Optional)</Label>
              <Input
                id="unit"
                type="text"
                placeholder="Enter unit (e.g., box, piece)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
