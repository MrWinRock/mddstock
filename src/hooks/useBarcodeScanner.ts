import { useState, useEffect, useCallback, useRef } from "react";

interface UseBarcodeScanner {
  scannedCode: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearCode: () => void;
}

export function useBarcodeScanner(onScan?: (code: string) => void): UseBarcodeScanner {
  const [scannedCode, setScannedCode] = useState("");
  const [isListening, setIsListening] = useState(false);
  const bufferRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Clear timeout if it exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Handle Enter key - means scan is complete
      if (event.key === "Enter") {
        if (bufferRef.current.length > 0) {
          const code = bufferRef.current;
          setScannedCode(code);
          onScan?.(code);
          bufferRef.current = "";
        }
        return;
      }

      // Only accept alphanumeric characters
      if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
        bufferRef.current += event.key;
      }

      // Set timeout to clear buffer if no more input (scanner typically finishes within 50ms)
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = "";
      }, 100);
    },
    [onScan]
  );

  const startListening = useCallback(() => {
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    bufferRef.current = "";
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const clearCode = useCallback(() => {
    setScannedCode("");
  }, []);

  useEffect(() => {
    if (isListening) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isListening, handleKeyDown]);

  return {
    scannedCode,
    isListening,
    startListening,
    stopListening,
    clearCode,
  };
}
