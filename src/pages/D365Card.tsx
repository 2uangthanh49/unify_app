import React from "react";

interface D365CardProps {
    children: React.ReactNode;
    title?: string;
    isDarkMode: boolean;
}

export const D365Card: React.FC<D365CardProps> = ({ children, title, isDarkMode }) => (
    <div className={`rounded border shadow-sm transition-all duration-200 flex flex-col
        ${isDarkMode 
            ? "bg-[#201f1e] border-[#323130]" 
            : "bg-[#ffffff] border-[#edebe9]"}`}
    >
        {title && (
            <div className={`px-4 py-3 border-b font-heading font-semibold text-[13px] tracking-tight
                ${isDarkMode ? "border-[#323130] text-[#f3f2f1]" : "border-[#edebe9] text-[#323130]"}`}
            >
                {title}
            </div>
        )}
        <div className="p-5 flex-1">
            {children}
        </div>
    </div>
);
