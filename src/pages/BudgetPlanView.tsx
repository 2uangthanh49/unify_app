import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sliders } from "lucide-react";
import { D365Card } from "./D365Card";

interface BudgetPlanViewProps {
    isDarkMode: boolean;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
}

export const BudgetPlanView: React.FC<BudgetPlanViewProps> = ({
    isDarkMode,
    isFilterOpen,
    onToggleFilter
}) => {
    return (
        <div className="flex gap-6 h-full items-start relative">
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                <D365Card title="Q3 Fiscal Budgets" isDarkMode={isDarkMode}>
                    <div className="space-y-4">
                        {[
                            { dept: "IT Infrastructure & Ops", allocated: "$180,000", spent: "$120,400", percent: 66 },
                            { dept: "Marketing & Demand Gen", allocated: "$120,000", spent: "$98,500", percent: 82 },
                            { dept: "Global Human Resources", allocated: "$75,000", spent: "$45,000", percent: 60 }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-[13px]">
                                    <span className="font-semibold text-foreground">{item.dept}</span>
                                    <span className="text-neutral-500 font-mono">{item.spent} / {item.allocated}</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                    <div style={{ width: `${item.percent}%` }} className="h-full bg-[#007b8f]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </D365Card>

                <D365Card title="Budget Plan Scenarios" isDarkMode={isDarkMode}>
                    <div className="space-y-4 text-[13px]">
                        <div className={`p-4 rounded border ${isDarkMode ? "bg-[#252423] border-[#323130]" : "bg-[#faf9f8] border-[#edebe9]"}`}>
                            <p className="font-semibold text-foreground">Scenario 1: Baseline Projection</p>
                            <p className="text-[11px] text-neutral-500 mt-1 leading-normal">
                                Reflects standard operations with 5% year-over-year expansion. Active status approved.
                            </p>
                        </div>
                        <div className={`p-4 rounded border ${isDarkMode ? "bg-[#252423] border-[#323130]" : "bg-[#faf9f8] border-[#edebe9]"}`}>
                            <p className="font-semibold text-foreground">Scenario 2: Optimistic Target</p>
                            <p className="text-[11px] text-neutral-500 mt-1 leading-normal">
                                Assumes early product launch and expansion into EMEA territories. Pending board validation.
                            </p>
                        </div>
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
                            <button onClick={onToggleFilter} className="p-1 hover:bg-neutral-500/10 rounded">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="p-5 text-center text-neutral-500 text-[12px]">
                            <Sliders className="w-8 h-8 mx-auto opacity-30 mb-2" />
                            No filters available for this view.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
