import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlusCircle } from "lucide-react";
import { D365Card } from "./D365Card";

interface InvoiceListViewProps {
    isDarkMode: boolean;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
    isDarkMode,
    isFilterOpen,
    onToggleFilter
}) => {
    const initialInvoices = [
        { id: "INV-8910", vendor: "VEND-001", date: "2026-07-15", due: "2026-08-15", amount: "$15,200.00", type: "Invoice", approved: "Yes" },
        { id: "INV-8911", vendor: "VEND-002", date: "2026-07-18", due: "2026-08-18", amount: "$8,450.00", type: "Invoice", approved: "Pending" },
        { id: "CRN-1102", vendor: "VEND-004", date: "2026-07-20", due: "2026-08-20", amount: "($1,200.00)", type: "Credit note", approved: "Yes" }
    ];

    const [invoices, setInvoices] = useState(initialInvoices);
    const [searchVendor, setSearchVendor] = useState("");
    const [approvedFilter, setApprovedFilter] = useState("All");

    const handleApplyFilters = () => {
        let filtered = initialInvoices;
        if (searchVendor) {
            filtered = filtered.filter(inv => inv.vendor.toLowerCase().includes(searchVendor.toLowerCase()));
        }
        if (approvedFilter !== "All") {
            filtered = filtered.filter(inv => inv.approved === approvedFilter);
        }
        setInvoices(filtered);
    };

    const handleResetFilters = () => {
        setSearchVendor("");
        setApprovedFilter("All");
        setInvoices(initialInvoices);
    };

    return (
        <div className="flex gap-6 h-full items-start relative">
            <div className="flex-1 min-w-0">
                <D365Card title="Invoice Register" isDarkMode={isDarkMode}>
                    <div className={`overflow-x-auto rounded border ${isDarkMode ? "border-[#323130]" : "border-[#edebe9]"}`}>
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className={isDarkMode ? "bg-[#252423] text-neutral-300" : "bg-[#faf9f8] text-neutral-600"}>
                                    <th className="py-1.5 px-3 font-semibold">Invoice number</th>
                                    <th className="py-1.5 px-3 font-semibold">Vendor account</th>
                                    <th className="py-1.5 px-3 font-semibold">Invoice date</th>
                                    <th className="py-1.5 px-3 font-semibold">Due date</th>
                                    <th className="py-1.5 px-3 font-semibold">Type</th>
                                    <th className="py-1.5 px-3 font-semibold text-right">Invoice amount</th>
                                    <th className="py-1.5 px-3 font-semibold text-center">Approved</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {invoices.map((inv, idx) => (
                                    <tr key={idx} className={isDarkMode ? "hover:bg-[#252423]" : "hover:bg-[#f3f2f1]"}>
                                        <td className="py-1.5 px-3 font-mono font-semibold text-[#007b8f]">{inv.id}</td>
                                        <td className="py-1.5 px-3 font-mono">{inv.vendor}</td>
                                        <td className="py-1.5 px-3">{inv.date}</td>
                                        <td className="py-1.5 px-3">{inv.due}</td>
                                        <td className="py-1.5 px-3">{inv.type}</td>
                                        <td className="py-1.5 px-3 text-right font-mono font-semibold">{inv.amount}</td>
                                        <td className="py-1.5 px-3 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                                                inv.approved === "Yes"
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            }`}>
                                                {inv.approved}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </D365Card>
            </div>

            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`shrink-0 border rounded shadow-sm flex flex-col h-fit overflow-hidden
                            ${isDarkMode ? "bg-[#201f1e] border-[#323130]" : "bg-white border-[#edebe9]"}`}
                    >
                        <div className={`flex items-center justify-between px-4 py-3 border-b
                            ${isDarkMode ? "border-[#323130]" : "border-[#edebe9]"}`}
                        >
                            <span className="font-heading font-semibold text-[13px] tracking-tight">Filters</span>
                            <div className="flex items-center gap-2">
                                <button className="text-[11px] text-[#007b8f] font-semibold flex items-center gap-0.5 hover:underline">
                                    <PlusCircle className="w-3 h-3" /> Add
                                </button>
                                <button onClick={onToggleFilter} className="p-1 hover:bg-neutral-500/10 rounded">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-4 text-[13px]">
                            {/* Filter by Vendor Account */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-neutral-500 uppercase">Vendor Account</label>
                                <input
                                    type="text"
                                    value={searchVendor}
                                    onChange={(e) => setSearchVendor(e.target.value)}
                                    placeholder="e.g. VEND-001"
                                    className={`w-full px-3 py-1.5 border rounded outline-none text-[13px]
                                        ${isDarkMode 
                                            ? "bg-[#252423] border-[#323130] text-white focus:border-[#479ef5]" 
                                            : "bg-[#faf9f8] border-[#edebe9] focus:border-[#007b8f]"}`}
                                />
                            </div>

                            {/* Filter by Approved Status */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-neutral-500 uppercase">Approved</label>
                                <select
                                    value={approvedFilter}
                                    onChange={(e) => setApprovedFilter(e.target.value)}
                                    className={`w-full px-2 py-1.5 border rounded outline-none text-[13px]
                                        ${isDarkMode 
                                            ? "bg-[#252423] border-[#323130] text-white" 
                                            : "bg-[#faf9f8] border-[#edebe9]"}`}
                                >
                                    <option value="All">All</option>
                                    <option value="Yes">Yes</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleApplyFilters}
                                    className="flex-1 py-1.5 bg-[#007b8f] hover:bg-[#0066b3] text-white font-semibold text-[12px] rounded transition-colors"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={handleResetFilters}
                                    className={`flex-1 py-1.5 font-semibold text-[12px] rounded border transition-colors
                                        ${isDarkMode 
                                            ? "border-[#323130] hover:bg-neutral-800" 
                                            : "border-neutral-300 hover:bg-neutral-100"}`}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
