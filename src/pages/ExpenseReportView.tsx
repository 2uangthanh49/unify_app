import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlusCircle } from "lucide-react";
import { D365Card } from "./D365Card";

interface ExpenseReportViewProps {
    isDarkMode: boolean;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
}

export const ExpenseReportView: React.FC<ExpenseReportViewProps> = ({
    isDarkMode,
    isFilterOpen,
    onToggleFilter
}) => {
    const initialExpenses = [
        { id: "EXP-9920", emp: "John Smith", cat: "Travel", purpose: "Annual conference flights", amt: "$850.00", status: "Approved" },
        { id: "EXP-9921", emp: "Sarah Jenkins", cat: "Meals", purpose: "Vendor dinner engagement", amt: "$240.40", status: "Approved" },
        { id: "EXP-9922", emp: "Robert Vance", cat: "Hardware", purpose: "Testing monitor workstation", amt: "$450.00", status: "Pending" }
    ];

    const [expenses, setExpenses] = useState(initialExpenses);
    const [searchEmp, setSearchEmp] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const handleApplyFilters = () => {
        let filtered = initialExpenses;
        if (searchEmp) {
            filtered = filtered.filter(exp => exp.emp.toLowerCase().includes(searchEmp.toLowerCase()));
        }
        if (categoryFilter !== "All") {
            filtered = filtered.filter(exp => exp.cat === categoryFilter);
        }
        setExpenses(filtered);
    };

    const handleResetFilters = () => {
        setSearchEmp("");
        setCategoryFilter("All");
        setExpenses(initialExpenses);
    };

    return (
        <div className="flex gap-6 h-full items-start relative">
            <div className="flex-1 min-w-0">
                <D365Card title="Recent Employee Expenses" isDarkMode={isDarkMode}>
                    <div className={`overflow-x-auto rounded border ${isDarkMode ? "border-[#323130]" : "border-[#edebe9]"}`}>
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className={isDarkMode ? "bg-[#252423] text-neutral-300" : "bg-[#faf9f8] text-neutral-600"}>
                                    <th className="py-1.5 px-3 font-semibold">Expense ID</th>
                                    <th className="py-1.5 px-3 font-semibold">Employee</th>
                                    <th className="py-1.5 px-3 font-semibold">Category</th>
                                    <th className="py-1.5 px-3 font-semibold">Business purpose</th>
                                    <th className="py-1.5 px-3 font-semibold text-right">Amount</th>
                                    <th className="py-1.5 px-3 font-semibold text-center">Payment status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {expenses.map((row, idx) => (
                                    <tr key={idx} className={isDarkMode ? "hover:bg-[#252423]" : "hover:bg-[#f3f2f1]"}>
                                        <td className="py-1.5 px-3 font-mono font-semibold text-[#007b8f]">{row.id}</td>
                                        <td className="py-1.5 px-3 font-semibold">{row.emp}</td>
                                        <td className="py-1.5 px-3">{row.cat}</td>
                                        <td className="py-1.5 px-3">{row.purpose}</td>
                                        <td className="py-1.5 px-3 text-right font-mono">{row.amt}</td>
                                        <td className="py-1.5 px-3 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                                                row.status === "Approved"
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            }`}>
                                                {row.status}
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
                            {/* Filter by Employee Name */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-neutral-500 uppercase">Employee</label>
                                <input
                                    type="text"
                                    value={searchEmp}
                                    onChange={(e) => setSearchEmp(e.target.value)}
                                    placeholder="e.g. John"
                                    className={`w-full px-3 py-1.5 border rounded outline-none text-[13px]
                                        ${isDarkMode 
                                            ? "bg-[#252423] border-[#323130] text-white focus:border-[#479ef5]" 
                                            : "bg-[#faf9f8] border-[#edebe9] focus:border-[#007b8f]"}`}
                                />
                            </div>

                            {/* Filter by Category */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-neutral-500 uppercase">Category</label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className={`w-full px-2 py-1.5 border rounded outline-none text-[13px]
                                        ${isDarkMode 
                                            ? "bg-[#252423] border-[#323130] text-white" 
                                            : "bg-[#faf9f8] border-[#edebe9]"}`}
                                >
                                    <option value="All">All Categories</option>
                                    <option value="Travel">Travel</option>
                                    <option value="Meals">Meals</option>
                                    <option value="Hardware">Hardware</option>
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
