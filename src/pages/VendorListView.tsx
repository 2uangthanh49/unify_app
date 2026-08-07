import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Wallet, Plus, X, PlusCircle } from "lucide-react";
import { D365Card } from "./D365Card";

interface VendorListViewProps {
    isDarkMode: boolean;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
}

export const VendorListView: React.FC<VendorListViewProps> = ({
    isDarkMode,
    isFilterOpen,
    onToggleFilter
}) => {
    const initialVendors = [
        { account: "VEND-001", name: "Contoso Utilities Corp", group: "Utilities (10)", currency: "USD", balance: "$45,200.00", status: "Active" },
        { account: "VEND-002", name: "Fabrikam Supplies Ltd", group: "Inventory (20)", currency: "EUR", balance: "$12,410.00", status: "Active" },
        { account: "VEND-003", name: "Northwind Logistics LLC", group: "Services (30)", currency: "USD", balance: "$0.00", status: "On Hold" },
        { account: "VEND-004", name: "Adatum Marketing Inc", group: "Advertising (40)", currency: "GBP", balance: "$8,950.00", status: "Active" }
    ];

    const [vendors, setVendors] = useState(initialVendors);
    const [searchName, setSearchName] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const handleApplyFilters = () => {
        let filtered = initialVendors;
        if (searchName) {
            filtered = filtered.filter(v => v.name.toLowerCase().includes(searchName.toLowerCase()));
        }
        if (statusFilter !== "All") {
            filtered = filtered.filter(v => v.status === statusFilter);
        }
        setVendors(filtered);
    };

    const handleResetFilters = () => {
        setSearchName("");
        setStatusFilter("All");
        setVendors(initialVendors);
    };

    return (
        <div className="flex gap-6 h-full items-start relative">
            {/* Left Content Area (shrunk automatically if filter is open) */}
            <div className="flex-1 min-w-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <D365Card isDarkMode={isDarkMode}>
                        <div className="flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-[#007b8f]" />
                            <div>
                                <p className="text-[11px] text-neutral-500 font-semibold uppercase">Total Vendors</p>
                                <p className="text-[20px] font-semibold mt-0.5">142 Accounts</p>
                            </div>
                        </div>
                    </D365Card>
                    <D365Card isDarkMode={isDarkMode}>
                        <div className="flex items-center gap-3">
                            <Wallet className="w-8 h-8 text-indigo-500" />
                            <div>
                                <p className="text-[11px] text-neutral-500 font-semibold uppercase">Accounts Payable Aging</p>
                                <p className="text-[20px] font-semibold mt-0.5">$66,560.00</p>
                            </div>
                        </div>
                    </D365Card>
                    <D365Card isDarkMode={isDarkMode}>
                        <div className="flex items-center gap-3">
                            <Plus className="w-8 h-8 text-emerald-500" />
                            <div>
                                <p className="text-[11px] text-neutral-500 font-semibold uppercase">New Vendors (MTD)</p>
                                <p className="text-[20px] font-semibold mt-0.5">+4 Approved</p>
                            </div>
                        </div>
                    </D365Card>
                </div>

                <D365Card title="Vendor Accounts" isDarkMode={isDarkMode}>
                    <div className={`overflow-x-auto rounded border ${isDarkMode ? "border-[#323130]" : "border-[#edebe9]"}`}>
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className={isDarkMode ? "bg-[#252423] text-neutral-300" : "bg-[#faf9f8] text-neutral-600"}>
                                    <th className="py-1.5 px-3 font-semibold">Vendor account</th>
                                    <th className="py-1.5 px-3 font-semibold">Name</th>
                                    <th className="py-1.5 px-3 font-semibold">Vendor group</th>
                                    <th className="py-1.5 px-3 font-semibold">Currency</th>
                                    <th className="py-1.5 px-3 font-semibold text-right">Balance</th>
                                    <th className="py-1.5 px-3 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {vendors.map((vend, idx) => (
                                    <tr key={idx} className={isDarkMode ? "hover:bg-[#252423]" : "hover:bg-[#f3f2f1]"}>
                                        <td className="py-1.5 px-3 font-mono font-semibold text-[#007b8f]">{vend.account}</td>
                                        <td className="py-1.5 px-3">{vend.name}</td>
                                        <td className="py-1.5 px-3">{vend.group}</td>
                                        <td className="py-1.5 px-3">{vend.currency}</td>
                                        <td className="py-1.5 px-3 text-right font-mono font-semibold">{vend.balance}</td>
                                        <td className="py-1.5 px-3 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                                vend.status === "Active"
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            }`}>
                                                {vend.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </D365Card>
            </div>

            {/* Collapsible Right-side Filter Panel */}
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
                            {/* Filter by Name */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-neutral-500 uppercase">Vendor Name</label>
                                <input
                                    type="text"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    placeholder="e.g. Contoso"
                                    className={`w-full px-3 py-1.5 border rounded outline-none text-[13px]
                                        ${isDarkMode 
                                            ? "bg-[#252423] border-[#323130] text-white focus:border-[#479ef5]" 
                                            : "bg-[#faf9f8] border-[#edebe9] focus:border-[#007b8f]"}`}
                                />
                            </div>

                            {/* Filter by Status */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-neutral-500 uppercase">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className={`w-full px-2 py-1.5 border rounded outline-none text-[13px]
                                        ${isDarkMode 
                                            ? "bg-[#252423] border-[#323130] text-white" 
                                            : "bg-[#faf9f8] border-[#edebe9]"}`}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="On Hold">On Hold</option>
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
