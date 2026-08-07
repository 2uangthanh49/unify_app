import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Star,
    Clock,
    LayoutGrid,
    ChevronDown,
    Menu,
    Pin,
    Sun,
    Moon,
    FileText,
    Bot // Added Bot icon for AI root
} from "lucide-react";
import { getZcommands } from "../services/zcommands";
import { useCountry } from "../hooks/country.context";

// Structure definitions
export interface MenuItemLevel3 {
    id: string;
    title: string;
    formId?: string;
}

export interface MenuItemLevel2 {
    id: string;
    title: string;
    items?: MenuItemLevel3[];
}

export interface MenuItemLevel1 {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    items?: MenuItemLevel2[];
    isCollapsible?: boolean;
}

interface SidebarProps {
    onSelectPage: (path: string[], labels?: string[], formId?: string) => void;
    activePath: string[];
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (isCollapsed: boolean) => void;
    isPinned: boolean;
    setIsPinned: (isPinned: boolean) => void;
}

interface ZcommandMenuRecord {
    menu_id: string;
    menu_id0: string | null;
    bar: string | null;
    bar2: string | null;
    description: string | null;
    description2: string | null;
    type: string | null;
    exe: string | null;
    rep_form: string | null;
    forder: string | null;
    hide_yn: number | null;
    country_code: string | null;
    _isFallback?: boolean;
}

function commandFormId(command: ZcommandMenuRecord): string | undefined {
    const exeValue = command.exe?.trim() || "";
    const exeMatch = exeValue.match(/\/main\/([A-Za-z0-9_-]+)/i);
    if (exeMatch?.[1]) {
        return exeMatch[1];
    }

    const reportForm = command.rep_form?.trim();
    return reportForm || undefined;
}

function commandTitle(command: ZcommandMenuRecord): string {
    return [command.bar2, command.bar, command.description2, command.description, command.menu_id]
        .map(value => value?.trim())
        .find(Boolean) || command.menu_id;
}

function isCommandVisibleForCountry(countryCodeField: string | null, activeCountryCode: string): boolean {
    if (!countryCodeField) return true;

    const countryMapping: Record<string, string> = {
        VNM: "VN",
        MMR: "MM",
        IDN: "ID",
        SRB: "SB",
        CAM: "CAM",
        IND: "IND"
    };

    const mappedActiveCode = countryMapping[activeCountryCode] || activeCountryCode;
    const allowedCountries = countryCodeField.split(',').map(c => c.trim().toUpperCase());
    return allowedCountries.includes(mappedActiveCode.toUpperCase());
}

function buildDatabaseMenus(commands: ZcommandMenuRecord[], activeCountryCode: string): MenuItemLevel1[] {
    const normalized = commands
        .map(command => ({
            ...command,
            menu_id: command.menu_id?.trim() || "",
            menu_id0: command.menu_id0?.trim() || ""
        }))
        .filter(command => {
            if (!command.menu_id) return false;
            if (command.hide_yn === 1) return false;
            return isCommandVisibleForCountry(command.country_code, activeCountryCode);
        });

    const commandIds = new Set(normalized.map(command => command.menu_id));
    const childrenByParent = new Map<string, ZcommandMenuRecord[]>();

    normalized.forEach(command => {
        const children = childrenByParent.get(command.menu_id0) || [];
        children.push(command);
        childrenByParent.set(command.menu_id0, children);
    });

    const roots = normalized.filter(command =>
        !command.menu_id0 ||
        command.menu_id === command.menu_id0 ||
        !commandIds.has(command.menu_id0)
    );

    roots.sort((a, b) => (a.forder || a.menu_id).localeCompare(b.forder || b.menu_id));

    return roots.map(root => {
        let RootIcon = FileText;
        if (root.menu_id === "04.AZ.00" || root.bar?.toLowerCase().includes("ai") || root.bar2?.toLowerCase().includes("ai")) {
            RootIcon = Bot;
        } else if (root.menu_id === "04.B0.0-" || root.bar?.toLowerCase().includes("in-house") || root.bar2?.toLowerCase().includes("in-house")) {
            RootIcon = LayoutGrid;
        }

        const buildL2Items = (parentId: string): MenuItemLevel2[] => {
            const level2Commands = childrenByParent.get(parentId) || [];
            level2Commands.sort((a, b) => (a.forder || a.menu_id).localeCompare(b.forder || b.menu_id));

            return level2Commands.map(level2 => {
                const level3Commands = childrenByParent.get(level2.menu_id) || [];
                level3Commands.sort((a, b) => (a.forder || a.menu_id).localeCompare(b.forder || b.menu_id));

                return {
                    id: level2.menu_id,
                    title: commandTitle(level2),
                    items: level3Commands.map(level3 => ({
                        id: level3.menu_id,
                        title: commandTitle(level3),
                        formId: commandFormId(level3)
                    }))
                };
            });
        };

        return {
            id: root.menu_id,
            title: commandTitle(root),
            icon: RootIcon,
            isCollapsible: true,
            items: buildL2Items(root.menu_id)
        };
    });
}

// Mock Dynamics 365 Menu Data
const D365_MENU_DATA: MenuItemLevel1[] = [
    {
        id: "home",
        title: "Home",
        icon: Home,
        isCollapsible: false
    },
    {
        id: "favorites",
        title: "Favorites",
        icon: Star,
        isCollapsible: true,
        items: [
            { id: "fav-vendors", title: "My Vendors" },
            { id: "fav-invoices", title: "Pending Invoices" }
        ]
    },
    {
        id: "recent",
        title: "Recent",
        icon: Clock,
        isCollapsible: true,
        items: [
            { id: "rec-ap", title: "Accounts payable" },
            { id: "rec-ar", title: "Accounts receivable" }
        ]
    },
    {
        id: "workspaces",
        title: "Workspaces",
        icon: LayoutGrid,
        isCollapsible: true,
        items: [
            { id: "ws-ledger", title: "General ledger portal" },
            { id: "ws-cash", title: "Cash overview" }
        ]
    }
];

const STATIC_MENU_DATA = D365_MENU_DATA.filter(item => item.id !== "modules");

export const Sidebar: React.FC<SidebarProps> = ({
    onSelectPage,
    activePath,
    isDarkMode,
    toggleDarkMode,
    isCollapsed,
    setIsCollapsed,
    isPinned,
    setIsPinned
}) => {
    const [rawCommands, setRawCommands] = useState<ZcommandMenuRecord[]>([]);
    const [isFallback, setIsFallback] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const { countryCode } = useCountry();

    const menuData = useMemo(() => {
        if (rawCommands.length === 0) {
            return STATIC_MENU_DATA;
        }
        const dbMenus = buildDatabaseMenus(rawCommands, countryCode);
        return [...STATIC_MENU_DATA, ...dbMenus];
    }, [rawCommands, countryCode]);

    // Track expanded Level 1 and Level 2 nodes
    const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>({
        modules: true, // Modules expanded by default
        recent: false,
        favorites: false,
        workspaces: false
    });

    const [expandedL2, setExpandedL2] = useState<Record<string, boolean>>({
        ap: true // Accounts payable expanded by default
    });

    useEffect(() => {
        let cancelled = false;

        getZcommands()
            .then(commands => {
                if (cancelled) return;

                const mappedCommands: ZcommandMenuRecord[] = commands.map(cmd => ({
                    menu_id: cmd.menu_id || "",
                    menu_id0: cmd.menu_id0 || null,
                    bar: cmd.bar || null,
                    bar2: cmd.bar2 || null,
                    description: cmd.description || null,
                    description2: cmd.description2 || null,
                    type: cmd.type || null,
                    exe: cmd.exe || null,
                    rep_form: cmd.rep_form || null,
                    forder: cmd.forder || null,
                    hide_yn: cmd.hide_yn ?? null,
                    country_code: cmd.country_code || null,
                    _isFallback: (cmd as any)._isFallback
                }));

                setRawCommands(mappedCommands);
                setIsFallback(commands[0] ? (commands[0] as any)._isFallback === true : false);
                setLoadError(null);

                // Auto-expand database roots
                const roots = mappedCommands.filter(cmd => !cmd.menu_id0 || cmd.menu_id === cmd.menu_id0);
                setExpandedL1(previous => {
                    const next = { ...previous };
                    roots.forEach(root => {
                        next[root.menu_id] = true;
                    });
                    return next;
                });
            })
            .catch(error => {
                console.warn("Unable to load menu from getZscommands.", error);
                setLoadError(error instanceof Error ? error.message : String(error));
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const toggleL1 = (id: string, isCollapsible?: boolean) => {
        if (isCollapsible === false) {
            const menuItem = menuData.find(item => item.id === id);
            onSelectPage([id], [menuItem?.title || id]);
            return;
        }
        if (isCollapsed) setIsCollapsed(false);
        setExpandedL1(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleL2 = (l1: MenuItemLevel1, l2: MenuItemLevel2, hasChildren: boolean) => {
        if (!hasChildren) {
            onSelectPage([l1.id, l2.id], [l1.title, l2.title]);
            return;
        }
        setExpandedL2(prev => ({ ...prev, [l2.id]: !prev[l2.id] }));
    };

    return (
        <motion.aside
            animate={{ width: isCollapsed ? 48 : 280 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`flex flex-col h-full border-r shrink-0 select-none transition-colors duration-250 relative
                ${isDarkMode
                    ? "bg-[#201f1e] border-[#323130] text-[#f3f2f1]"
                    : "bg-[#f3f2f1] border-[#edebe9] text-[#323130]"
                }`}
        >
            {/* Top Toolbar (Hamburger + Pin + Theme toggle) */}
            <div className={`flex items-center justify-between px-3 h-12 border-b transition-colors duration-200
                ${isDarkMode ? "border-[#323130]" : "border-[#edebe9]"}`}
            >
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-2 rounded hover:bg-neutral-500/10 transition-colors text-inherit`}
                        title="Toggle Navigation Pane"
                    >
                        <Menu className="w-4 h-4 stroke-[1.5]" />
                    </button>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="text-[12px] font-semibold tracking-wide uppercase opacity-75 font-heading">
                                Navigation
                            </span>
                            {rawCommands.length > 0 && (
                                <span className={`text-[9px] font-semibold px-1 rounded-sm w-fit mt-0.5 ${isFallback
                                    ? "bg-sky-500/10 text-sky-500 dark:text-sky-400"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    }`}>
                                    {isFallback ? `Local Mock (${rawCommands.length})` : `Fabric Database (${rawCommands.length})`}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="flex items-center gap-0.5">
                        {/* Theme toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded hover:bg-neutral-500/10 transition-colors text-inherit"
                            title={isDarkMode ? "Light Mode" : "Dark Mode"}
                        >
                            {isDarkMode ? (
                                <Sun className="w-3.5 h-3.5 stroke-[1.5]" />
                            ) : (
                                <Moon className="w-3.5 h-3.5 stroke-[1.5]" />
                            )}
                        </button>
                        {/* Pin Button */}
                        <button
                            onClick={() => setIsPinned(!isPinned)}
                            className={`p-2 rounded hover:bg-neutral-500/10 transition-colors text-inherit ${isPinned ? "text-[#007b8f] dark:text-[#479ef5]" : "opacity-60"
                                }`}
                            title={isPinned ? "Unpin Navigation Pane" : "Pin Navigation Pane"}
                        >
                            <Pin className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                    </div>
                )}
            </div>

            {loadError && !isCollapsed && (
                <div className="mx-3 mt-2 p-1.5 text-[10px] text-red-500 bg-red-500/10 border border-red-500/20 rounded select-text">
                    Error loading database menu: {loadError}
                </div>
            )}

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-thin overflow-x-hidden">
                {menuData.map((l1) => {
                    const isL1Expanded = !!expandedL1[l1.id];
                    const hasChildren = l1.items && l1.items.length > 0;
                    const isL1Active = activePath[0] === l1.id;

                    return (
                        <div key={l1.id} className="space-y-0.5">
                            {/* LEVEL 1 ITEM */}
                            <button
                                onClick={() => toggleL1(l1.id, l1.isCollapsible)}
                                className={`w-full flex items-center justify-between py-2 px-3 text-[14px] text-left transition-colors relative
                                    text-[#323130] dark:text-[#f3f2f1] hover:font-semibold
                                    ${isL1Active && !hasChildren
                                        ? isDarkMode ? "bg-[#292827] text-white font-semibold" : "bg-white text-[#007b8f] font-semibold border-l-4 border-[#007b8f]"
                                        : isL1Active && isCollapsed
                                            ? "bg-[#007b8f]/10 text-[#007b8f] border-l-4 border-[#007b8f]"
                                            : isDarkMode
                                                ? "hover:bg-[#292827]"
                                                : "hover:bg-[#edebe9]"
                                    }
                                    ${isL1Active && !isCollapsed ? "font-semibold" : ""}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <l1.icon className={`w-[18px] h-[18px] stroke-[1.5] ${isL1Active ? "text-[#007b8f] dark:text-[#479ef5]" : "opacity-75"
                                        }`} />
                                    {!isCollapsed && (
                                        <span className="font-heading tracking-tight truncate max-w-[180px]">
                                            {l1.title}
                                        </span>
                                    )}
                                </div>
                                {!isCollapsed && hasChildren && (
                                    <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isL1Expanded ? "rotate-0" : "-rotate-90"
                                        }`} />
                                )}

                                {/* Hover tooltip for collapsed mode */}
                                {isCollapsed && (
                                    <div className={`absolute left-12 scale-0 group-hover:scale-100 bg-neutral-900 text-white text-[11px] px-2 py-1 rounded shadow-md pointer-events-none z-50 whitespace-nowrap`}>
                                        {l1.title}
                                    </div>
                                )}
                            </button>

                            {/* LEVEL 2 & 3 CONTAINER */}
                            <AnimatePresence initial={false}>
                                {isL1Expanded && hasChildren && !isCollapsed && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden space-y-0.5"
                                    >
                                        {l1.items?.map((l2) => {
                                            const isL2Expanded = !!expandedL2[l2.id];
                                            const hasL2Children = l2.items && l2.items.length > 0;
                                            const isL2Active = activePath[1] === l2.id;

                                            return (
                                                <div key={l2.id} className="space-y-0.5">
                                                    {/* LEVEL 2 ITEM (Indented, clean text link) */}
                                                    <button
                                                        onClick={() => toggleL2(l1, l2, !!hasL2Children)}
                                                        className={`w-full flex items-center justify-between py-1.5 pl-9 pr-4 text-[13px] text-left transition-colors
                                                            text-[#323130] dark:text-[#f3f2f1] hover:font-semibold
                                                            ${isL2Active && !hasL2Children
                                                                ? isDarkMode ? "bg-[#292827] text-white font-semibold border-l-2 border-[#479ef5]" : "bg-white text-[#007b8f] font-semibold border-l-2 border-[#007b8f]"
                                                                : isDarkMode
                                                                    ? "hover:bg-[#292827]"
                                                                    : "hover:bg-[#edebe9]"
                                                            }
                                                            ${isL2Active && hasL2Children ? "font-semibold text-[#007b8f] dark:text-[#479ef5]" : ""}
                                                        `}
                                                    >
                                                        <span className="truncate">{l2.title}</span>
                                                        {hasL2Children && (
                                                            <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${isL2Expanded ? "rotate-0" : "-rotate-90"
                                                                }`} />
                                                        )}
                                                    </button>

                                                    {/* LEVEL 3 ITEMS (Further indented, sub-sub-links) */}
                                                    <AnimatePresence initial={false}>
                                                        {isL2Expanded && hasL2Children && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.12 }}
                                                                className="overflow-hidden space-y-0.5"
                                                            >
                                                                {l2.items?.map((l3) => {
                                                                    const isL3Active = activePath[2] === l3.id;
                                                                    return (
                                                                        <button
                                                                            key={l3.id}
                                                                            onClick={() => onSelectPage([l1.id, l2.id, l3.id], [l1.title, l2.title, l3.title], l3.formId)}
                                                                            className={`w-full py-1.5 pl-12 pr-4 text-[12px] text-left transition-colors relative block
                                                                                text-[#0f6cbd] dark:text-[#63b4ff] hover:font-semibold
                                                                                ${isL3Active
                                                                                    ? isDarkMode ? "bg-[#292827] text-white font-semibold border-l-2 border-[#479ef5]" : "bg-white text-[#007b8f] font-semibold border-l-2 border-[#007b8f]"
                                                                                    : isDarkMode
                                                                                        ? "hover:bg-[#292827]"
                                                                                        : "hover:bg-[#edebe9]"
                                                                                }
                                                                            `}
                                                                        >
                                                                            <span className="truncate">{l3.title}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </motion.aside>
    );
};
