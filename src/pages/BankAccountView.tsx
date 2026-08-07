import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { D365Card } from "./D365Card";

interface BankAccountViewProps {
    isDarkMode: boolean;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
}

export const BankAccountView: React.FC<BankAccountViewProps> = ({
    isDarkMode,
    isFilterOpen,
    onToggleFilter
}) => {
    const initialAccounts = [
        { bank: "US Operating Ledger", account: "US-OP-011", balance: "$450,290.41", currency: "USD", type: "Checking" },
        { bank: "EU Payroll Ledger", account: "EU-PR-082", balance: "€124,510.90", currency: "EUR", type: "Checking" },
        { bank: "Main Treasury Reserve", account: "TR-RS-991", balance: "$2,890,000.00", currency: "USD", type: "Savings" }
    ];

    const [currencyFilter, setCurrencyFilter] = useState("All");

    const filteredAccounts = currencyFilter === "All"
        ? initialAccounts
        : initialAccounts.filter(a => a.currency === currencyFilter);

    return (
        <div className="flex gap-6 h-full items-start relative">
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredAccounts.map((acct, idx) => (
                    <D365Card key={idx} isDarkMode={isDarkMode}>
                        <p className="text-[11px] text-neutral-500 font-semibold uppercase">{acct.bank}</p>
                        <p className="text-[12px] font-mono text-neutral-400 mt-0.5">{acct.account} ➔ {acct.type}</p>
                        <div className="text-[20px] font-bold mt-4 font-mono text-[#007b8f]">{acct.balance}</div>
                        <p className="text-[10px] text-emerald-500 mt-2 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Reconciled
                        </p>
                    </D365Card>
                ))}
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
                            <button onClick={onToggleFilter} className="p-1 hover:bg-neutral-500/10 rounded">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4 text-[13px]">
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
                                    <option value="All">All Currencies</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
