import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import logoJpg from "./logo.jpg";
import { Agentation } from "agentation";
import {
  LayoutGrid,
  Search,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Filter
} from "lucide-react";

import { VendorListView } from "./pages/VendorListView";
import { InvoiceListView } from "./pages/InvoiceListView";
import { CustomerListView } from "./pages/CustomerListView";
import { BudgetPlanView } from "./pages/BudgetPlanView";
import { BankAccountView } from "./pages/BankAccountView";
import { ExpenseReportView } from "./pages/ExpenseReportView";
import { GenericD365View } from "./pages/GenericD365View";
import { DynamicGrid } from "./pages/DynamicGrid";
import { useCountry } from "./hooks/country.context";
import { useAuth } from "./hooks/AuthContext";
import { AuthPage } from "./components/AuthPage";

import { getTodos } from "./services/todos";

function App() {
  const { user, signOut, loading } = useAuth();
  const { countryCode, countryOptions, setCountryCode } = useCountry();
  
  // Debug hook to query Todo table on database
  useEffect(() => {
    if (user) {
      getTodos()
        .then(todos => console.log("%c[Debug Todos] Loaded todos from Fabric SQL Database:", "color: magenta; font-weight: bold;", todos))
        .catch(err => console.error("[Debug Todos] Failed to load todos:", err));
    }
  }, [user]);

  // Initial active path set to Modules -> Accounts payable -> All vendors
  const [activePath, setActivePath] = useState<string[]>([
    "modules",
    "ap",
    "all-vendors"
  ]);
  const [breadcrumbLabels, setBreadcrumbLabels] = useState<string[]>([
    "Modules",
    "Accounts payable",
    "All vendors"
  ]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [isNavigationPinned, setIsNavigationPinned] = useState(true);

  // Apply dark class to body
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f3f2f1] dark:bg-[#11100f] text-[#323130] dark:text-[#f3f2f1] font-sans text-[13px]">
        Connecting to session...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSelectPage = (path: string[], labels?: string[], formId?: string) => {
    setActivePath(path);
    setBreadcrumbLabels(labels || getBreadcrumbLabel(path));
    setActiveFormId(formId || null);
  };

  // Get display names for the breadcrumb
  const getBreadcrumbLabel = (path: string[]) => {
    const map: Record<string, string> = {
      home: "Home",
      favorites: "Favorites",
      "fav-vendors": "My Vendors",
      "fav-invoices": "Pending Invoices",
      recent: "Recent",
      "rec-ap": "Accounts payable",
      "rec-ar": "Accounts receivable",
      workspaces: "Workspaces",
      "ws-ledger": "General ledger portal",
      "ws-cash": "Cash overview",
      modules: "Modules",
      ap: "Accounts payable",
      "all-vendors": "All vendors",
      "ap-invoices": "Vendor invoices",
      "payment-journal": "Vendor payments",
      "feed-bom": "Feed BOM",
      ar: "Accounts receivable",
      "all-customers": "All customers",
      "ar-invoices": "Customer invoices",
      asset: "Asset management",
      "assets-list": "Fixed assets",
      maintenance: "Work orders",
      audit: "Audit workbench",
      "audit-cases": "Audit cases",
      budgeting: "Budgeting",
      "budget-plan": "Budget planning",
      "budget-control": "Budget control configuration",
      "cash-bank": "Cash and bank management",
      "bank-accounts": "Bank accounts",
      reconciliation: "Bank reconciliations",
      common: "Common",
      "global-address": "Global address book",
      consolidations: "Consolidations",
      "consolidate-online": "Consolidate online",
      "cost-accounting": "Cost accounting",
      "cost-policies": "Cost policies",
      "cost-mgmt": "Cost management",
      "inventory-cost": "Inventory costing",
      "credit-coll": "Credit and collections",
      "collections-pool": "Collections agent dashboard",
      expense: "Expense management",
      "my-expenses": "Expense reports"
    };
    return path.map(p => map[p] || p);
  };

  const breadcrumbs = breadcrumbLabels;

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-base transition-colors duration-300
            ${isDarkMode ? "bg-[#11100f] text-neutral-100" : "bg-[#f3f2f1] text-neutral-800"}`}
    >
      {/* De Heus Brand Header Banner */}
      <header className="h-14 bg-[#0066b3] text-[#f3f2f1] flex items-center justify-between z-20 shrink-0 select-none border-b border-[#8cc63f]/30">
        <div className="flex items-center h-full">
          {/* Waffle grid button in De Heus Green */}
          <button className="h-14 w-12 bg-[#8cc63f] hover:bg-[#7ebd1b] flex items-center justify-center text-white shrink-0 transition-colors cursor-pointer">
            <LayoutGrid className="w-[18px] h-[18px] stroke-[1.5]" />
          </button>

          {/* Logo + Text Container */}
          <div className="flex items-center gap-3 ml-4">
            {/* De Heus Logo Mark Image */}
            <img
              src={logoJpg}
              alt="De Heus Logo"
              className="w-10 h-10 object-contain rounded-full bg-white shadow-sm p-0.5"
            />
            {/* Unify IT Brand Title */}
            <span className="font-heading font-bold text-[16px] tracking-tight text-white ml-1">
              Unify IT
            </span>
          </div>
        </div>

        {/* Right utility info */}
        <div className="flex items-center gap-4 px-4 h-full">
          <div className="flex items-center border-r border-white/20 pr-4 h-7">
            <label className="sr-only" htmlFor="country-code">Country code</label>
            <select
              id="country-code"
              value={countryCode}
              onChange={event => setCountryCode(event.target.value as typeof countryCode)}
              className="h-7 min-w-20 border border-white/30 bg-white/10 px-2 text-[11px] font-semibold tracking-wide text-white outline-none focus:border-white cursor-pointer"
            >
              {countryOptions.map(option => (
                <option key={option.code} value={option.code} className="text-[#323130]">
                  {option.code}
                </option>
              ))}
            </select>
          </div>
          {user && (
            <div className="group flex items-center text-[12px]">
              <span className="opacity-0 max-w-0 mr-0 overflow-hidden pointer-events-none group-hover:opacity-90 group-hover:max-w-[150px] group-hover:mr-3 transition-all duration-300 ease-in-out truncate font-semibold text-white" title={user.email}>
                {user.name || user.email}
              </span>
              <button
                onClick={() => void signOut()}
                className="bg-white/10 hover:bg-white/20 transition-all px-2.5 py-0.5 rounded text-[11px] font-semibold border border-white/20 hover:border-white/30 text-white cursor-pointer active:scale-95"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Layout below header */}
      <div className="flex-1 flex overflow-hidden">
        {/* Redesigned Sidebar */}
        <Sidebar
          activePath={activePath}
          onSelectPage={handleSelectPage}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isCollapsed={isNavigationCollapsed}
          setIsCollapsed={setIsNavigationCollapsed}
          isPinned={isNavigationPinned}
          setIsPinned={setIsNavigationPinned}
        />

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-300
                    ${isDarkMode ? "bg-[#11100f]" : "bg-[#faf9f8]"}`}
        >
          {/* Inline Navigation Breadcrumbs bar */}
          <div className={`flex items-center justify-between px-2 h-10 border-b shrink-0 z-10 transition-colors duration-300
                        ${isDarkMode ? "bg-[#252423] border-[#323130]" : "bg-[#ffffff] border-[#edebe9]"}`}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono select-none">
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className={idx === breadcrumbs.length - 1 ? "text-foreground font-semibold" : "opacity-80"}>
                    {crumb}
                  </span>
                  {idx < breadcrumbs.length - 1 && <span className="text-[9px] opacity-50">/</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Actions Ribbon/Toolbar */}
          <div className={`flex items-center justify-between px-2 h-11 border-b shrink-0 z-10 transition-colors duration-300 text-[13px] select-none
                        ${isDarkMode ? "bg-[#201f1e] border-[#323130] text-[#f3f2f1]" : "bg-[#ffffff] border-[#edebe9] text-[#323130]"}`}
          >
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 hover:bg-neutral-500/10 px-2 py-1 rounded transition-colors font-medium">
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700" />
              <button className="flex items-center gap-1 hover:bg-neutral-500/10 px-2 py-1 rounded transition-colors font-medium">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button className="flex items-center gap-1 hover:bg-neutral-500/10 px-2 py-1 rounded transition-colors font-medium">
                <Plus className="w-3.5 h-3.5" /> New
              </button>
              <button className="flex items-center gap-1 hover:bg-neutral-500/10 px-2 py-1 rounded transition-colors font-medium">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <button className="flex items-center gap-1 hover:bg-neutral-500/10 px-2 py-1 rounded transition-colors font-medium">
                Options
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-1.5 hover:bg-neutral-500/10 rounded transition-colors text-neutral-500 hover:text-foreground">
                <Search className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700" />
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-1.5 rounded transition-colors flex items-center gap-1.5 font-medium
                                    ${isFilterOpen
                    ? "bg-[#007b8f]/15 text-[#007b8f] dark:text-[#479ef5]"
                    : "hover:bg-neutral-500/10 text-neutral-500 hover:text-foreground"
                  }`}
                title="Toggle Filter Panel"
              >
                <Filter className="w-4 h-4" />
                <span className="text-[12px] hidden sm:inline">Filter</span>
              </button>
            </div>
          </div>

          {/* Content Scroll Grid */}
          <div
            className="flex-1 overflow-y-auto p-2 relative z-10"
            onClick={() => {
              if (!isNavigationPinned) {
                setIsNavigationCollapsed(previous => !previous);
              }
            }}
          >


            <AnimatePresence mode="wait">
              <motion.div
                key={activePath.join("-")}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="space-y-6"
              >

                {/* Dynamic Views */}
                {activeFormId && (
                  <DynamicGrid
                    formId={activeFormId}
                    isDarkMode={isDarkMode}
                    isFilterOpen={isFilterOpen}
                    onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                  />
                )}
                {activePath[2] === "all-vendors" && (
                  <VendorListView
                    isDarkMode={isDarkMode}
                    isFilterOpen={isFilterOpen}
                    onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                  />
                )}
                {activePath[2] === "ap-invoices" && (
                  <InvoiceListView
                    isDarkMode={isDarkMode}
                    isFilterOpen={isFilterOpen}
                    onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                  />
                )}
                {activePath[2] === "all-customers" && (
                  <CustomerListView
                    isDarkMode={isDarkMode}
                    isFilterOpen={isFilterOpen}
                    onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                  />
                )}
                {activePath[2] === "budget-plan" && (
                  <BudgetPlanView
                    isDarkMode={isDarkMode}
                    isFilterOpen={isFilterOpen}
                    onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                  />
                )}
                {activePath[2] === "bank-accounts" && (
                  <BankAccountView
                    isDarkMode={isDarkMode}
                    isFilterOpen={isFilterOpen}
                    onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                  />
                )}
                {activePath[2] === "my-expenses" && (
                  <ExpenseReportView
                    isDarkMode={isDarkMode}
                    isFilterOpen={isFilterOpen}
                    onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                  />
                )}

                {/* Fallback View */}
                {!activeFormId && !["all-vendors", "ap-invoices", "all-customers", "budget-plan", "bank-accounts", "my-expenses"].includes(activePath[2] || "") && (
                  <GenericD365View
                    path={activePath}
                    isDarkMode={isDarkMode}
                    isFilterOpen={isFilterOpen}
                    onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                  />
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}

export default App;
