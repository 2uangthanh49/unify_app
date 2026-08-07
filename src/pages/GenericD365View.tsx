import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sliders } from "lucide-react";
import { D365Card } from "./D365Card";

interface GenericD365ViewProps {
    path: string[];
    isDarkMode: boolean;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
}

export const GenericD365View: React.FC<GenericD365ViewProps> = ({
    path,
    isDarkMode,
    isFilterOpen,
    onToggleFilter
}) => {
    return (
        <div className="flex gap-6 h-full items-start relative">
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <D365Card title="Module Configuration Properties" isDarkMode={isDarkMode}>
                        <div className="space-y-4 text-[13px]">
                            {[
                                { label: "Module Path", value: `d365://finance/${path.join("/")}` },
                                { label: "Item ID Reference", value: path[path.length - 1] || "None" },
                                { label: "Synchronization Status", value: "Fully operational" },
                                { label: "Data Source", value: "Fabric Data Warehouse (Gold Lake)" }
                            ].map((prop, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3 last:border-0 last:pb-0">
                                    <span className="font-semibold text-foreground">{prop.label}</span>
                                    <span className="text-neutral-500 font-mono">{prop.value}</span>
                                </div>
                            ))}
                        </div>
                    </D365Card>
                </div>

                <D365Card title="Audit Logs" isDarkMode={isDarkMode}>
                    <div className="space-y-4 text-[12px]">
                        <div className="relative pl-4 border-l border-neutral-300 dark:border-neutral-800">
                            <p className="font-semibold">Modified schema variables</p>
                            <p className="text-neutral-500 mt-0.5">2 hours ago by admin@deheus.com</p>
                        </div>
                        <div className="relative pl-4 border-l border-neutral-300 dark:border-neutral-800">
                            <p className="font-semibold">Fiscal year Q3 period opened</p>
                            <p className="text-neutral-500 mt-0.5">1 day ago by System Scheduler</p>
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
