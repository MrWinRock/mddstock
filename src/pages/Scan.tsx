import { useState, useEffect, useCallback } from "react";
import { inventoryApi } from "@/lib/api";
import type { InventoryItemWithQuantity } from "@/types/api";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { CameraScanner } from "@/components/scan/CameraScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ArrowDownToLine, ArrowUpFromLine, Package, Check } from "lucide-react";

export default function Scan() {
  const [inventory, setInventory] = useState<InventoryItemWithQuantity[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithQuantity | null>(null);
  const [amount, setAmount] = useState("");
  const [scanMode, setScanMode] = useState<"in" | "out">("in");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  // Fetch inventory on mount
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
    }
  };

  const handleScan = useCallback(
    (code: string) => {
      // Find item by material_code
      const item = inventory.find((i) => i.material_code.toString() === code);
      if (item) {
        setSelectedItem(item);
        setAmount("");
        setLastScanResult(null);
        toast({
          title: "Item Found",
          description: `${item.item} (${item.material_code})`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Item Not Found",
          description: `No item with code "${code}" found in inventory`,
        });
      }
    },
    [inventory, toast]
  );

  // External barcode scanner hook
  const { isListening, startListening, stopListening } = useBarcodeScanner(handleScan);

  // Start listening on mount
  useEffect(() => {
    startListening();
    return () => stopListening();
  }, [startListening, stopListening]);

  const handleProcess = async () => {
    if (!selectedItem || !amount) return;

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
      });
      return;
    }

    // Check for scan-out: validate quantity
    if (scanMode === "out" && amountNum > (selectedItem.item_quantity || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient Quantity",
        description: `Available: ${selectedItem.item_quantity || 0}, Requested: ${amountNum}`,
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response =
        scanMode === "in"
          ? await inventoryApi.scanIn({ inventory_id: selectedItem.inventory_id, amount: amountNum })
          : await inventoryApi.scanOut({ inventory_id: selectedItem.inventory_id, amount: amountNum });

      if (response.success) {
        setLastScanResult({
          success: true,
          message: `${scanMode === "in" ? "Scanned in" : "Scanned out"} ${amountNum} ${selectedItem.unit || "units"} of ${selectedItem.item}`,
        });
        toast({
          title: "Success",
          description: response.message,
        });
        // Refresh inventory and clear form
        await fetchInventory();
        setSelectedItem(null);
        setAmount("");
      } else {
        setLastScanResult({
          success: false,
          message: response.message,
        });
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process scan";
      setLastScanResult({ success: false, message });
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraToggle = () => {
    setCameraActive(!cameraActive);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan</h1>
        <p className="text-muted-foreground">Scan items in or out of inventory</p>
      </div>

      {/* Scan Mode Tabs */}
      <Tabs value={scanMode} onValueChange={(v) => setScanMode(v as "in" | "out")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="in" className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Scan In
          </TabsTrigger>
          <TabsTrigger value="out" className="gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Scan Out
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Add items to inventory. Scan a barcode or use the camera to select an item.
          </p>
        </TabsContent>
        <TabsContent value="out" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Remove items from inventory. Quantity will be validated before processing.
          </p>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner Section */}
        <div className="space-y-4">
          {/* External Scanner Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${isListening ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
                <div>
                  <p className="font-medium">External Scanner</p>
                  <p className="text-sm text-muted-foreground">
                    {isListening ? "Ready - Scan a barcode with your external scanner" : "Not active"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Camera Scanner */}
          <CameraScanner onScan={handleScan} isActive={cameraActive} onToggle={handleCameraToggle} />
        </div>

        {/* Selected Item & Action */}
        <div className="space-y-4">
          {selectedItem ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Selected Item
                </CardTitle>
                <CardDescription>Review and confirm the scan action</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material Code:</span>
                    <span className="font-mono font-medium">{selectedItem.material_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item:</span>
                    <span className="font-medium">{selectedItem.item}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{selectedItem.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Quantity:</span>
                    <span className="font-bold">{selectedItem.item_quantity || 0} {selectedItem.unit || "units"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount to {scanMode === "in" ? "Add" : "Remove"}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedItem(null);
                      setAmount("");
                      setLastScanResult(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProcess}
                    disabled={!amount || isProcessing}
                    className="flex-1 gap-2"
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : scanMode === "in" ? (
                      <>
                        <ArrowDownToLine className="h-4 w-4" />
                        Scan In
                      </>
                    ) : (
                      <>
                        <ArrowUpFromLine className="h-4 w-4" />
                        Scan Out
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex h-[300px] flex-col items-center justify-center gap-4 text-center">
                <ScanLine className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">No Item Selected</p>
                  <p className="text-sm text-muted-foreground">
                    Scan a barcode to select an item
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last Scan Result */}
          {lastScanResult && (
            <Card className={lastScanResult.success ? "border-green-500" : "border-destructive"}>
              <CardContent className="flex items-center gap-3 p-4">
                {lastScanResult.success ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <span className="h-5 w-5 text-destructive">✗</span>
                )}
                <p className={lastScanResult.success ? "text-green-700" : "text-destructive"}>
                  {lastScanResult.message}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
