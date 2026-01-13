import { useState, useEffect, useCallback } from "react";
import { inventoryApi } from "@/lib/api";
import type { Log, InventoryItemWithQuantity } from "@/types/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LOGS_PER_PAGE = 10;

interface HistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItemWithQuantity | null;
}

export function HistoryDialog({ open, onOpenChange, item }: HistoryDialogProps) {
    const [logs, setLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchLogs = useCallback(async () => {
        if (!item) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await inventoryApi.getLog({ inventory_id: item.inventory_id });
            setLogs(response.data || []);
            setCurrentPage(1); // Reset to first page when fetching new data
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch history");
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [item]);

    useEffect(() => {
        if (open && item) {
            fetchLogs();
        }
    }, [open, item, fetchLogs]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Pagination calculations
    const totalPages = Math.ceil(logs.length / LOGS_PER_PAGE);
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    const endIndex = startIndex + LOGS_PER_PAGE;
    const paginatedLogs = logs.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>ประวัติการเคลื่อนไหว (History)</DialogTitle>
                    <DialogDescription>
                        {item?.item} ({item?.material_code})
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : error ? (
                        <div className="flex h-32 items-center justify-center text-destructive">
                            {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-muted-foreground">
                            ไม่มีประวัติการเคลื่อนไหว
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">ลำดับ</TableHead>
                                    <TableHead className="w-[100px]">ประเภท</TableHead>
                                    <TableHead className="text-right">จำนวน</TableHead>
                                    <TableHead>วันที่/เวลา</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedLogs.map((log, index) => (
                                    <TableRow key={log.log_id}>
                                        <TableCell>{startIndex + index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {log.is_item_in ? (
                                                    <>
                                                        <ArrowDownToLine className="h-4 w-4 text-green-600" />
                                                        <span className="text-green-600 font-medium">รับเข้า</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowUpFromLine className="h-4 w-4 text-orange-600" />
                                                        <span className="text-orange-600 font-medium">เบิกจ่าย</span>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-medium",
                                            log.is_item_in ? "text-green-600" : "text-orange-600"
                                        )}>
                                            {log.is_item_in ? "+" : "-"}{log.amount.toLocaleString()} {item?.unit || ""}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(log.create_time)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination Controls */}
                {!isLoading && !error && logs.length > LOGS_PER_PAGE && (
                    <div className="flex items-center justify-between border-t pt-4 mt-2">
                        <p className="text-sm text-muted-foreground">
                            แสดง {startIndex + 1}-{Math.min(endIndex, logs.length)} จาก {logs.length} รายการ
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                ก่อนหน้า
                            </Button>
                            <span className="text-sm text-muted-foreground px-2">
                                หน้า {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="cursor-pointer"
                            >
                                ถัดไป
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
