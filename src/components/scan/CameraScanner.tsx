import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, CameraOff } from "lucide-react";

interface CameraScannerProps {
  onScan: (code: string) => void;
  isActive: boolean;
  onToggle: () => void;
}

export function CameraScanner({ onScan, isActive, onToggle }: CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>("");

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {
        // Ignore stop errors
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    // Yield to break synchronous chain - any setState after this is async
    await Promise.resolve();
    try {
      const scanner = new Html5Qrcode("camera-scanner");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          // Don't stop scanner, allow continuous scanning
        },
        () => {
          // Ignore errors during scanning
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start camera");
      onToggle();
    }
  }, [onScan, onToggle]);

  // Handle toggle with error clearing - keeps state changes in event handlers
  const handleToggle = useCallback(() => {
    if (!isActive) {
      setError(""); // Clear error when activating (user action, not effect)
    }
    onToggle();
  }, [isActive, onToggle]);

  useEffect(() => {
    if (isActive) {
      // Schedule async to avoid synchronous setState in effect body
      queueMicrotask(() => {
        startScanner();
      });
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, startScanner, stopScanner]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Camera Scanner</h3>
          <Button variant="outline" size="sm" onClick={handleToggle} className="gap-2">
            {isActive ? (
              <>
                <CameraOff className="h-4 w-4" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Start Camera
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div
          id="camera-scanner"
          className={`mx-auto overflow-hidden rounded-lg ${isActive ? "block" : "hidden"}`}
          style={{ maxWidth: "300px" }}
        />

        {!isActive && !error && (
          <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Click "Start Camera" to scan barcodes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
