import React, { useState, useEffect, useRef } from "react";
import { 
    Filter, 
    ArrowUp, 
    ArrowDown, 
    X, 
    RefreshCw,
    SlidersHorizontal
} from "lucide-react";
import { D365Card } from "./D365Card";
import { listService, InlineFilter } from "../services/list.service";

interface DynamicGridProps {
    formId: string;
    isDarkMode: boolean;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
}

interface GridColumn {
    field: string;
    header: string;
    width: number;
    format: string;
    type: "S" | "N" | "D" | "B";
}

export const DynamicGrid: React.FC<DynamicGridProps> = ({
    formId,
    isDarkMode,
    isFilterOpen,
    onToggleFilter
}) => {
    const [columns, setColumns] = useState<GridColumn[]>([]);
    const [title, setTitle] = useState("Loading...");
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination & Infinite Scroll
    const pageSize = 50; // Load 50 records at a time
    const [totalRows, setTotalRows] = useState(0);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Mouse drag-to-scroll state
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('select') || target.closest('input') || target.closest('button') || target.closest('option') || target.closest('.z-50')) {
            return;
        }
        const container = containerRef.current;
        if (!container) return;

        setIsDragging(true);
        setStartX(e.pageX - container.offsetLeft);
        setScrollLeft(container.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;

        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5; // scroll speed multiplier
        container.scrollLeft = scrollLeft - walk;
    };

    // Sorting
    const [sortField, setSortField] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"1" | "2">("1"); // 1: ASC, 2: DESC

    // Inline Filters state
    // Key is column field, value is filter parameters
    const [activeFilters, setActiveFilters] = useState<Record<string, Omit<InlineFilter, "id">>>({});

    // Popover UI State
    const [popoverColumn, setPopoverColumn] = useState<string | null>(null);
    const [tempFilterOp, setTempFilterOp] = useState<string>("LIKE");
    const [tempFilterVal, setTempFilterVal] = useState<string>("");
    const popoverRef = useRef<HTMLDivElement>(null);

    // Load form structure on mount / formId change
    useEffect(() => {
        const fetchStructure = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const config = await listService.declare(formId);
                if (config) {
                    setTitle(config.title || "Data Sheet");
                    
                    // Parse comma-separated properties
                    const fields = config.fields ? config.fields.split(",").map((s: string) => s.trim()) : [];
                    const headers = config.headers ? config.headers.split(",").map((s: string) => s.trim()) : [];
                    const widths = config.widths ? config.widths.split(",").map((s: string) => s.trim()) : [];
                    const formats = config.formats ? config.formats.split(",").map((s: string) => s.trim()) : [];

                    // Set default sorting from corder
                    if (config.corder) {
                        const defaultSort = config.corder.split(",")[0]?.trim();
                        if (defaultSort) {
                            setSortField(defaultSort);
                        }
                    }

                    // Map to column objects with types
                    const mappedCols: GridColumn[] = fields.map((field: string, idx: number) => {
                        const header = headers[idx] || field;
                        const width = parseInt(widths[idx]) || 120;
                        const format = formats[idx] || "";
                        
                        // Heuristics for data type detection
                        let type: "S" | "N" | "D" | "B" = "S";
                        const fLower = field.toLowerCase();
                        if (fLower.includes("date") || fLower.includes("time") || fLower.includes("day")) {
                            type = "D";
                        } else if (format.includes("#") || format.includes("0")) {
                            type = "N";
                        } else if (fLower.endsWith("yn") || fLower.includes("status") || fLower.includes("active")) {
                            type = "B";
                        }

                        return { field, header, width, format, type };
                    });

                    setColumns(mappedCols);
                }
            } catch (err: any) {
                console.error("Error loading structure:", err);
                setError(err.message || "Failed to load dynamic page configuration.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStructure();
    }, [formId]);

    // Load data with infinite scroll reset option
    const loadData = async (reset: boolean = false) => {
        if (isLoading && !reset) return;
        setIsLoading(true);
        setError(null);
        try {
            const currentData = reset ? [] : data;
            const start = reset ? 0 : currentData.length;
            
            // Map active filters state to array
            const inlineFiltersList: InlineFilter[] = Object.entries(activeFilters).map(([colField, val]) => ({
                id: colField,
                type: val.type,
                operation: val.operation,
                value: val.value
            }));

            const result = await listService.all(
                formId,
                start,
                pageSize,
                inlineFiltersList,
                sortField,
                sortOrder
            );

            if (reset) {
                setData(result.data);
            } else {
                setData(prev => [...prev, ...result.data]);
            }
            setTotalRows(result.total);
        } catch (err: any) {
            console.error("Error loading data:", err);
            setError(err.message || "Error fetching records from server.");
        } finally {
            setIsLoading(false);
        }
    };

    // Load/Reset data when dynamic column metadata, sort, or filters change
    useEffect(() => {
        if (columns.length > 0) {
            loadData(true);
        }
    }, [columns, sortField, sortOrder, activeFilters]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && data.length < totalRows && data.length > 0) {
                    loadData(false);
                }
            },
            { threshold: 0.1 }
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel);
            }
        };
    }, [isLoading, data.length, totalRows]);

    // Handle outside clicks to close the popover
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setPopoverColumn(null);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Format value according to pattern
    const formatValue = (val: any, col: GridColumn): string => {
        if (val === undefined || val === null) return "";
        
        if (col.type === "N") {
            const num = Number(val);
            if (isNaN(num)) return String(val);
            
            // Detect decimals in formats like '### ### ##0.000'
            let decimals = 0;
            if (col.format && col.format.includes(".")) {
                decimals = col.format.split(".")[1].length;
            }
            
            let formatted = num.toFixed(decimals);
            if (col.format && col.format.includes(" ")) {
                const parts = formatted.split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                formatted = parts.join(".");
            }
            return formatted;
        }

        if (col.type === "D") {
            // format date
            try {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    });
                }
            } catch {}
        }

        if (col.type === "B") {
            return val === true || val === 1 || String(val).toLowerCase() === "true" ? "Yes" : "No";
        }

        return String(val);
    };

    // Open Column Filter Dialog
    const handleHeaderClick = (col: GridColumn, e: React.MouseEvent) => {
        e.stopPropagation();
        setPopoverColumn(col.field);
        
        const existing = activeFilters[col.field];
        if (existing) {
            setTempFilterOp(existing.operation);
            setTempFilterVal(existing.value);
        } else {
            // defaults by type
            setTempFilterOp(col.type === "N" ? "=" : "LIKE");
            setTempFilterVal("");
        }
    };

    // Apply Filter
    const applyFilter = (colField: string, type: "S" | "N" | "D" | "B") => {
        if (tempFilterOp === "BLANK" || tempFilterOp === "!Blank" || tempFilterVal.trim() !== "") {
            setActiveFilters(prev => ({
                ...prev,
                [colField]: {
                    type,
                    operation: tempFilterOp,
                    value: tempFilterOp === "BLANK" || tempFilterOp === "!Blank" ? "" : tempFilterVal
                }
            }));
        } else {
            // Clear if empty
            const copy = { ...activeFilters };
            delete copy[colField];
            setActiveFilters(copy);
        }
        setPopoverColumn(null);
    };

    // Clear Filter
    const clearFilter = (colField: string) => {
        const copy = { ...activeFilters };
        delete copy[colField];
        setActiveFilters(copy);
        setPopoverColumn(null);
    };

    // Toggle Sorting
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === "1" ? "2" : "1"));
        } else {
            setSortField(field);
            setSortOrder("1");
        }
    };

    return (
        <div className="flex gap-6 h-full items-start relative select-none">
            {/* Left Content Area */}
            <div className="flex-1 min-w-0 space-y-4">
                <D365Card title={title} isDarkMode={isDarkMode}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-neutral-500 font-mono">
                                Total: <strong className="text-foreground">{totalRows}</strong> rows
                            </span>
                            {Object.keys(activeFilters).length > 0 && (
                                <button 
                                    onClick={() => { setActiveFilters({}); }}
                                    className="text-[11px] px-2 py-0.5 rounded border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 flex items-center gap-1 transition-colors"
                                >
                                    Clear all filters ({Object.keys(activeFilters).length})
                                </button>
                            )}
                        </div>

                        <button 
                            onClick={() => loadData(true)}
                            className="p-1.5 hover:bg-neutral-500/10 rounded transition-colors text-neutral-500 hover:text-foreground"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 mb-4 rounded border border-red-500/20 bg-red-500/10 text-red-500 text-[12px] font-mono">
                            {error}
                        </div>
                    )}

                    {/* Table Container with Mouse Grab-to-Scroll support */}
                    <div 
                        ref={containerRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className={`overflow-auto custom-scrollbar rounded border relative max-h-[calc(100vh-260px)] min-h-[300px] select-none
                            ${isDragging ? "cursor-grabbing" : "cursor-grab"}
                            ${isDarkMode ? "border-[#323130] bg-[#1f1f1f]" : "border-[#edebe9] bg-white"}`}
                    >
                        <table className="w-full text-left border-collapse text-[13px] table-fixed">
                            <thead>
                                <tr className={`sticky top-0 z-20 border-b transition-colors
                                    ${isDarkMode ? "bg-[#252423] text-neutral-300 border-[#323130]" : "bg-[#faf9f8] text-neutral-600 border-[#edebe9]"}`}
                                >
                                    {columns.map((col) => {
                                        const isFiltered = !!activeFilters[col.field];
                                        const isSorted = sortField === col.field;
                                        
                                        return (
                                            <th 
                                                key={col.field} 
                                                style={{ width: `${col.width}px` }}
                                                className={`py-2 px-3 font-semibold text-[12px] group relative hover:bg-neutral-500/5 cursor-pointer`}
                                                onClick={() => handleSort(col.field)}
                                            >
                                                <div className="flex items-center justify-between gap-1 select-none">
                                                    <span className="truncate" title={col.header}>{col.header}</span>
                                                    
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {isSorted && (
                                                            sortOrder === "1" 
                                                                ? <ArrowUp className="w-3 h-3 text-[#007b8f]" /> 
                                                                : <ArrowDown className="w-3 h-3 text-[#007b8f]" />
                                                        )}
                                                        <button
                                                            onClick={(e) => handleHeaderClick(col, e)}
                                                            className={`p-1 rounded hover:bg-neutral-500/15 transition-colors relative z-10
                                                                ${isFiltered ? "text-[#007b8f] bg-[#007b8f]/10" : "text-neutral-400 opacity-30 group-hover:opacity-100"}`}
                                                        >
                                                            <Filter className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Header inline filter popover */}
                                                {popoverColumn === col.field && (
                                                    <div 
                                                        ref={popoverRef}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`absolute top-full left-0 mt-1 w-[220px] rounded shadow-xl border p-3 z-50 text-left font-normal text-foreground normal-case
                                                            ${isDarkMode ? "bg-[#252423] border-[#323130]" : "bg-white border-[#edebe9]"}`}
                                                    >
                                                        <div className="text-[11px] font-semibold text-neutral-500 uppercase mb-2">
                                                            Filter: {col.header}
                                                        </div>

                                                        {/* Operator drop-down */}
                                                        <select
                                                            value={tempFilterOp}
                                                            onChange={(e) => setTempFilterOp(e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded text-[12px] mb-2 outline-none
                                                                ${isDarkMode ? "bg-[#201f1e] border-[#323130]" : "bg-[#faf9f8] border-[#edebe9]"}`}
                                                        >
                                                            {col.type === "S" && (
                                                                <>
                                                                    <option value="LIKE">contains</option>
                                                                    <option value="BEGIN">begins with</option>
                                                                    <option value="=">equals</option>
                                                                    <option value="!=">not equals</option>
                                                                    <option value="BLANK">is blank</option>
                                                                    <option value="!Blank">not blank</option>
                                                                </>
                                                            )}
                                                            {col.type === "N" && (
                                                                <>
                                                                    <option value="=">equals</option>
                                                                    <option value="!=">not equals</option>
                                                                    <option value=">">greater than</option>
                                                                    <option value=">=">greater than or equal</option>
                                                                    <option value="<">less than</option>
                                                                    <option value="<=">less than or equal</option>
                                                                </>
                                                            )}
                                                            {col.type === "D" && (
                                                                <>
                                                                    <option value="=">equals</option>
                                                                    <option value="!=">not equals</option>
                                                                    <option value=">">greater than</option>
                                                                    <option value="<">less than</option>
                                                                    <option value="BLANK">is blank</option>
                                                                    <option value="!Blank">not blank</option>
                                                                </>
                                                            )}
                                                            {col.type === "B" && (
                                                                <>
                                                                    <option value="=">equals</option>
                                                                    <option value="!=">not equals</option>
                                                                </>
                                                            )}
                                                        </select>

                                                        {/* Value Input */}
                                                        {tempFilterOp !== "BLANK" && tempFilterOp !== "!Blank" && (
                                                            col.type === "B" ? (
                                                                <select
                                                                    value={tempFilterVal}
                                                                    onChange={(e) => setTempFilterVal(e.target.value)}
                                                                    className={`w-full px-2 py-1 border rounded text-[12px] mb-3 outline-none
                                                                        ${isDarkMode ? "bg-[#201f1e] border-[#323130]" : "bg-[#faf9f8] border-[#edebe9]"}`}
                                                                >
                                                                    <option value="">-- Chọn --</option>
                                                                    <option value="true">Yes (1)</option>
                                                                    <option value="false">No (0)</option>
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type={col.type === "D" ? "date" : "text"}
                                                                    value={tempFilterVal}
                                                                    onChange={(e) => setTempFilterVal(e.target.value)}
                                                                    placeholder={col.type === "N" ? "e.g. 150" : "enter value..."}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            applyFilter(col.field, col.type);
                                                                        }
                                                                    }}
                                                                    className={`w-full px-2 py-1 border rounded text-[12px] mb-3 outline-none
                                                                        ${isDarkMode ? "bg-[#201f1e] border-[#323130]" : "bg-[#faf9f8] border-[#edebe9]"}`}
                                                                />
                                                            )
                                                        )}

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => applyFilter(col.field, col.type)}
                                                                className="flex-1 py-1 bg-[#007b8f] hover:bg-[#0066b3] text-white text-[11px] font-semibold rounded transition-colors"
                                                            >
                                                                Apply
                                                            </button>
                                                            <button
                                                                onClick={() => clearFilter(col.field)}
                                                                className={`flex-1 py-1 text-[11px] font-semibold rounded border transition-colors
                                                                    ${isDarkMode ? "border-[#323130] hover:bg-neutral-800" : "border-neutral-300 hover:bg-neutral-100"}`}
                                                            >
                                                                Clear
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {isLoading && data.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="py-8 text-center text-neutral-400">
                                            Loading records...
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="py-8 text-center text-neutral-400">
                                            No matching records found.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, rowIdx) => (
                                        <tr key={rowIdx} className={isDarkMode ? "hover:bg-[#252423]/50" : "hover:bg-[#f3f2f1]/50"}>
                                            {columns.map((col) => {
                                                const formatted = formatValue(row[col.field], col);
                                                return (
                                                    <td 
                                                        key={col.field} 
                                                        className={`py-1.5 px-3 truncate
                                                            ${col.type === "N" ? "text-right font-mono" : ""}
                                                            ${col.field === columns[0]?.field ? "font-semibold text-[#007b8f]" : ""}`}
                                                        title={formatted}
                                                    >
                                                        {formatted}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        
                        {/* Infinite Scroll Sentinel element */}
                        <div 
                            ref={sentinelRef} 
                            className={`h-12 mt-4 flex items-center justify-center text-[12px] font-mono rounded border border-dashed transition-colors
                                ${isDarkMode 
                                    ? "border-[#323130] text-neutral-400 bg-[#252423]/10" 
                                    : "border-neutral-200 text-neutral-500 bg-neutral-50/30"}`}
                        >
                            {isLoading && (
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#007b8f]" />
                                    <span>Loading more records...</span>
                                </div>
                            )}
                            {!isLoading && data.length < totalRows && (
                                <span>Scroll down to load more (Loaded {data.length} of {totalRows})</span>
                            )}
                            {!isLoading && data.length >= totalRows && data.length > 0 && (
                                <span className="text-[#007b8f] font-semibold">All {totalRows} records loaded</span>
                            )}
                        </div>
                    </div>
                </D365Card>
            </div>

            {/* Sidebar filter state status indicator / quick status card */}
            {isFilterOpen && (
                <div className={`shrink-0 border rounded shadow-sm flex flex-col h-fit overflow-hidden w-[280px]
                    ${isDarkMode ? "bg-[#201f1e] border-[#323130]" : "bg-white border-[#edebe9]"}`}
            >
                <div className={`flex items-center justify-between px-4 py-3 border-b
                    ${isDarkMode ? "border-[#323130]" : "border-[#edebe9]"}`}
                >
                    <span className="font-heading font-semibold text-[13px] tracking-tight flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#007b8f]" /> Active Filters
                    </span>
                    <button onClick={onToggleFilter} className="p-1 hover:bg-neutral-500/10 rounded">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto text-[12px]">
                    {Object.keys(activeFilters).length === 0 ? (
                        <div className="text-center py-4 text-neutral-400 italic">
                            No column filters applied. Click column headers to apply filters.
                        </div>
                    ) : (
                        Object.entries(activeFilters).map(([colField, val]) => {
                            const col = columns.find(c => c.field === colField);
                            return (
                                <div 
                                    key={colField} 
                                    className={`p-2.5 rounded border flex flex-col gap-1 relative group
                                        ${isDarkMode ? "bg-[#252423] border-[#323130]" : "bg-[#faf9f8] border-[#edebe9]"}`}
                                >
                                    <button 
                                        onClick={() => clearFilter(colField)}
                                        className="absolute top-1.5 right-1.5 p-0.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Clear filter"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <div className="font-semibold text-neutral-500 text-[10px] uppercase truncate pr-5">
                                        {col?.header || colField}
                                    </div>
                                    <div className="font-mono text-[11px] text-[#007b8f] font-semibold">
                                        {val.operation} {val.value ? `"${val.value}"` : ""}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            )}
        </div>
    );
};
