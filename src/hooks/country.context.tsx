import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export const COUNTRY_OPTIONS = [
    { code: "CAM", name: "Campuchia" },
    { code: "IND", name: "India" },
    { code: "IDN", name: "Indonesia" },
    { code: "KOR", name: "Korea" },
    { code: "MMR", name: "Myanmar" },
    { code: "NLD", name: "Netherlands" },
    { code: "PHI", name: "Philippines" },
    { code: "SRB", name: "Serbia" },
    { code: "VNM", name: "Việt Nam" }
] as const;

export type CountryCode = (typeof COUNTRY_OPTIONS)[number]["code"];

interface CountryContextValue {
    countryCode: CountryCode;
    setCountryCode: (countryCode: CountryCode) => void;
    countryOptions: typeof COUNTRY_OPTIONS;
}

const COUNTRY_STORAGE_KEY = "app-01.country-code";

const CountryContext = createContext<CountryContextValue | undefined>(undefined);

function getCountryStorageKey(userId: string): string {
    return `${COUNTRY_STORAGE_KEY}.${encodeURIComponent(userId)}`;
}

function getInitialCountryCode(userId: string): CountryCode {
    const storedValue = localStorage.getItem(getCountryStorageKey(userId));
    return COUNTRY_OPTIONS.some(option => option.code === storedValue) ? storedValue as CountryCode : "VNM";
}

export function CountryProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const storageUserId = user?.id || "anonymous";
    const [countryCode, setCountryCodeValue] = useState<CountryCode>(() => getInitialCountryCode(storageUserId));

    useEffect(() => {
        setCountryCodeValue(getInitialCountryCode(storageUserId));
    }, [storageUserId]);

    const setCountryCode = (newCountryCode: CountryCode) => {
        setCountryCodeValue(newCountryCode);
        localStorage.setItem(getCountryStorageKey(storageUserId), newCountryCode);
    };

    return (
        <CountryContext.Provider value={{ countryCode, setCountryCode, countryOptions: COUNTRY_OPTIONS }}>
            {children}
        </CountryContext.Provider>
    );
}

export function useCountry(): CountryContextValue {
    const context = useContext(CountryContext);
    if (!context) {
        throw new Error("useCountry must be used within a CountryProvider");
    }

    return context;
}
