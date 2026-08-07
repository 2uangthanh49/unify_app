import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlusCircle } from "lucide-react";
import { D365Card } from "./D365Card";

interface CustomerListViewProps {
    isDarkMode: boolean;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
    isDarkMode,
    isFilterOpen,
    onToggleFilter
}) => {
    const initialCustomers = [
        { id: "CUST-001", name: "Alpine Ski House", group: "Wholesale (10)", currency: "USD", creditLimit: "$150,000.00", balance: "$42,500.00" },
        { id: "CUST-002", name: "School of Fine Arts", group: "Retail (20)", currency: "CAD", creditLimit: "$50,000.00", balance: "$15,100.00" },
        { id: "CUST-003", name: "City Power & Light", group: "Corporate (30)", currency: "USD", creditLimit: "$500,000.00", balance: "$114,800.00" }
    ];

    const [customers, setCustomers] = useState(initialCustomers);
    const [searchName, setSearchName] = useState("");
    const [currencyFilter, setCurrencyFilter] = useState("All");

    const handleApplyFilters = () => {
        let filtered = initialCustomers;
        if (searchName) {
            filtered = filtered.filter(cust => cust.name.toLowerCase().includes(searchName.toLowerCase()));
        }
        if (currencyFilter !== "All") {
            filtered = filtered.filter(cust => cust.currency === currencyFilter);
        }
        setCustomers(filtered);
    };

    const handleResetFilters = () => {
        setSearchName("");
        setCurrencyFilter("All");
        setCustomers(initialCustomers);
    };

    return (
        <div className="flex gap-6 h-full items-start relative">
            <div className="flex-1 min-w-0">
                <D365Card title="Customer Accounts" isDarkMode={isDarkMode}>
                    <div className={`overflow-x-auto rounded border ${isDarkMode ? "border-[#323130]" : "border-[#edebe9]"}`}>
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                 <tr className={isDarkMode ? "bg-[#252423] text-neutral-300" : "bg-[#faf9f8] text-neutral-600"}>
                                     <th className="py-1.5 px-3 font-semibold">Customer account</th>
                                     <th className="py-1.5 px-3 font-semibold">Name</th>
                                     <th className="py-1.5 px-3 font-semibold">Customer group</th>
                                     <th className="py-1.5 px-3 font-semibold">Currency</th>
                                     <th className="py-1.5 px-3 font-semibold text-right">Credit limit</th>
                                     <th className="py-1.5 px-3 font-semibold text-right">Balance</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                 {customers.map((cust, idx) => (
                                     <tr key={idx} className={isDarkMode ? "hover:bg-[#252423]" : "hover:bg-[#f3f2f1]"}>
                                         <td className="py-1.5 px-3 font-mono font-semibold text-[#007b8f]">{cust.id}</td>
                                         <td className="py-1.5 px-3">{cust.name}</td>
                                         <td className="py-1.5 px-3">{cust.group}</td>
                                         <td className="py-1.5 px-3">{cust.currency}</td>
                                         <td className="py-1.5 px-3 text-right font-mono">{cust.creditLimit}</td>
                                         <td className="py-1.5 px-3 text-right font-mono font-semibold">{cust.balance}</td>
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
                            {/* Filter by Customer Name */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-neutral-500 uppercase">Customer Name</label>
                                <input
                                    type="text"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    placeholder="e.g. Alpine"
                                    className={`w-full px-3 py-1.5 border rounded outline-none text-[13px]
                                        ${isDarkMode 
                                            ? "bg-[#252423] border-[#323130] text-white focus:border-[#479ef5]" 
                                            : "bg-[#faf9f8] border-[#edebe9] focus:border-[#007b8f]"}`}
                                />
                            </div>

                            {/* Filter by Currency */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-neutral-500 uppercase">Currency</label>
                                <select
                                    value={currencyFilter}
                                    onChange={(e) => setCurrencyFilter(e.target.value)}
                                    className={`w-full px-2 py-1.5 border rounded outline-none text-[13px]
                                        ${isDarkMode 
                                            ? "bg-[#252423] border-[#323130] text-white" 
                                            : "bg-[#faf9f8] border-[#edebe9]"}`}
                                >
                                    <option value="All">All</option>
                                    <option value="USD">USD</option>
                                    <option value="CAD">CAD</option>
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
