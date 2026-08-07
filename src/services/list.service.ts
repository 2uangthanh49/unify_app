export interface LookupDataValue {
    jsonData: string; // Encrypted JSON string of data table
    start: number;
    hits: number;
}

export interface ResultValue {
    status: boolean;
    data: string; // Encrypted JSON string of form/metadata
    sql?: string;
    message: string;
    code?: string;
}

export interface InlineFilter {
    id: string;
    type: "S" | "N" | "D" | "B"; // S: String, N: Number, D: Date, B: Boolean
    operation: string; // LIKE, BEGIN, =, !=, BLANK, etc.
    value: string;
}

interface ListFormDefinition {
    form: string;
    title: string;
    title2?: string;
    fields: string;
    headers: string;
    widths: string;
    formats: string;
    corder?: string;
}

interface ListQueryResult {
    data: any[];
    total: number;
}

const listApiBaseUrl = import.meta.env.VITE_LIST_API_BASE_URL?.replace(/\/+$/, "") ?? "";

const mockFormDefinitions: Record<string, ListFormDefinition> = {
    d365040810: {
        form: "d365040810",
        title: "Định mức thức ăn",
        title2: "Feed BOM",
        fields: "site, sfuture01, itemgroupid, itemgroupname, dayfrom, dayto, rate, classname, wmslocationid, itemid",
        headers: "Site, Warehouse, Mã nhóm, Tên nhóm, Từ ngày, Đến ngày, Thức ăn ước tính, Cách tính, Chuồng, Item",
        widths: "100, 100, 100, 150, 100, 100, 100, 200, 100, 350",
        formats: ", , , , ##0, ##0, ### ### ##0.000, , ,",
        corder: "site, itemgroupid, wmslocationid, dayfrom"
    }
};

function getListEndpoint(path: string): string | null {
    if (!listApiBaseUrl) {
        return null;
    }

    return `${listApiBaseUrl}/${path.replace(/^\/+/, "")}`;
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message = typeof errorPayload?.message === "string" ? errorPayload.message : "";
        throw new Error(message || `List API request failed (${response.status} ${response.statusText})`);
    }

    return response.json() as Promise<T>;
}

function parseJsonPayload<T>(payload: string | null | undefined, fallbackMessage: string): T {
    if (!payload) {
        throw new Error(fallbackMessage);
    }

    try {
        return JSON.parse(payload) as T;
    } catch {
        throw new Error(fallbackMessage);
    }
}

async function declareFromApi(formId: string): Promise<ListFormDefinition | null> {
    const endpoint = getListEndpoint(`list/declare?form=${encodeURIComponent(formId)}`);
    if (!endpoint) {
        return null;
    }

    const payload = await fetchJson<any>(endpoint);

    if (payload && typeof payload === "object" && typeof payload.form === "string") {
        return payload as ListFormDefinition;
    }

    if (payload?.status === false) {
        throw new Error(payload.message || `Failed to load form configuration for '${formId}'.`);
    }

    if (typeof payload?.data === "string") {
        return parseJsonPayload<ListFormDefinition>(
            payload.data,
            `List API returned a non-JSON form payload for '${formId}'.`
        );
    }

    throw new Error(`List API returned an unsupported form payload for '${formId}'.`);
}

async function allFromApi(
    formId: string,
    start: number,
    limit: number,
    searchInline: InlineFilter[],
    sortName?: string,
    sortType?: string
): Promise<ListQueryResult | null> {
    const endpoint = getListEndpoint("list/all");
    if (!endpoint) {
        return null;
    }

    const params = new URLSearchParams({
        form: formId,
        start: String(start),
        limit: String(limit),
        searchKey: "",
        searchInline: JSON.stringify(searchInline ?? []),
        sortName: sortName ?? "",
        sortType: sortType ?? ""
    });

    const payload = await fetchJson<any>(`${endpoint}?${params.toString()}`);

    if (payload && Array.isArray(payload.data) && typeof payload.total === "number") {
        return payload as ListQueryResult;
    }

    if (typeof payload?.jsonData === "string") {
        return {
            data: parseJsonPayload<any[]>(payload.jsonData, `List API returned a non-JSON data payload for '${formId}'.`),
            total: Number(payload.hits ?? payload.total ?? 0)
        };
    }

    if (payload?.status === false) {
        throw new Error(payload.message || `Failed to load rows for '${formId}'.`);
    }

    throw new Error(`List API returned an unsupported row payload for '${formId}'.`);
}

// Static mock records modeled from z_z for form d365040810 (Feed BOM)
const mockDataFeedBOM = [
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 5,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM, 3960DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 6,
        "dayto": 12,
        "rate": 4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM, 3960DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 13,
        "dayto": 19,
        "rate": 6.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM, 3960DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 20,
        "dayto": 26,
        "rate": 7.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM, 3960DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 27,
        "dayto": 35,
        "rate": 8.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM, 3960DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 5,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 6,
        "dayto": 12,
        "rate": 4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 13,
        "dayto": 19,
        "rate": 6.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 20,
        "dayto": 26,
        "rate": 7.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 27,
        "dayto": 35,
        "rate": 8.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 0.25,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5, 9271-B20"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 0.37,
        "classname": "Ngày sinh",
        "wmslocationid": "GDL1-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 0.54,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 0.71,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 0.87,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 1.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 1.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-CS",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 1.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-CS",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 7,
        "dayto": 13,
        "rate": 0.01,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "960883"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 14,
        "dayto": 20,
        "rate": 0.01,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "9271-B20, 960883"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 21,
        "dayto": 27,
        "rate": 0.02,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "9271-B20"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 28,
        "dayto": 34,
        "rate": 0.05,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5, 9271-B20, 960883"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 35,
        "dayto": 41,
        "rate": 0.25,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 42,
        "dayto": 48,
        "rate": 0.37,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-DE",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 1.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 1.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.75,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 120,
        "dayto": 126,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 127,
        "dayto": 133,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 134,
        "dayto": 140,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM6, 3970DHG, 3970DHG-M2, 3970DHG-M7, 3970DHG-Y2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 141,
        "dayto": 147,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3930DHGM6, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 148,
        "dayto": 154,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3930DHGM6, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 155,
        "dayto": 189,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3930DHGM6, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3930DHGM6, 3970DHG-M2, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3930DHGM6, 3970DHG-M2, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3930DHGM6, 3970DHG-M2, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3930DHGM6, 3970DHG-M2, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3930DHGM6, 3970DHG-M2, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3930DHGM6, 3970DHG-M2, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3930DHGM6, 3970DHG-M2, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3930DHGM6, 3970DHG-M2, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 100,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TD",
        "itemid": "3950DHG, 3950DHG-M7"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 15,
        "rate": 1.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 16,
        "dayto": 21,
        "rate": 1.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3930DHGM6, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3930DHGM6, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3930DHGM6, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.75,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 106,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 107,
        "dayto": 127,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 128,
        "dayto": 141,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 142,
        "dayto": 148,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 0.25,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5, 9271-B20"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 0.37,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 0.54,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 0.71,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 0.87,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 1.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-CS",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 1.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-CS",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 1.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-CS",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 7,
        "dayto": 13,
        "rate": 0.005,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "960883"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 14,
        "dayto": 20,
        "rate": 0.01,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "960883, 9271-B20"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 21,
        "dayto": 27,
        "rate": 0.02,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "9271-B20"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 28,
        "dayto": 34,
        "rate": 0.05,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 35,
        "dayto": 41,
        "rate": 0.25,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 42,
        "dayto": 48,
        "rate": 0.37,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-DE",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 1.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 1.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.75,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 120,
        "dayto": 126,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 127,
        "dayto": 133,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 134,
        "dayto": 140,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 141,
        "dayto": 147,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 148,
        "dayto": 154,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 155,
        "dayto": 189,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 15,
        "rate": 1.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 16,
        "dayto": 21,
        "rate": 1.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.75,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 106,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 107,
        "dayto": 127,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 128,
        "dayto": 141,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GDL",
        "sfuture01": "GDL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 142,
        "dayto": 148,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GDL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 5,
        "rate": 3.26,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 6,
        "dayto": 13,
        "rate": 3.26,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 14,
        "dayto": 19,
        "rate": 6.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 20,
        "dayto": 26,
        "rate": 7.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 27,
        "dayto": 35,
        "rate": 8.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 5,
        "rate": 3.26,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 6,
        "dayto": 13,
        "rate": 3.26,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 14,
        "dayto": 19,
        "rate": 6.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 20,
        "dayto": 26,
        "rate": 7.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 27,
        "dayto": 35,
        "rate": 8.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM, 3950DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 0.12,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 0.33,
        "classname": "Ngày sinh",
        "wmslocationid": "GGL1-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 0.56,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 0.81,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 1.12,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 1.29,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 1.29,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 3,
        "dayto": 10,
        "rate": 0.01,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-DE",
        "itemid": "960883"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 11,
        "dayto": 18,
        "rate": 0.02,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-DE",
        "itemid": "9271-B20, 960883"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 19,
        "dayto": 22,
        "rate": 0.04,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-DE",
        "itemid": "9271-B20"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 23,
        "dayto": 29,
        "rate": 0.12,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-DE",
        "itemid": "9271-B20"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.66,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 1.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8, 3872"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.95,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 120,
        "dayto": 126,
        "rate": 3.05,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 127,
        "dayto": 133,
        "rate": 3.05,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 134,
        "dayto": 140,
        "rate": 3.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 141,
        "dayto": 147,
        "rate": 3.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 148,
        "dayto": 154,
        "rate": 3.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 155,
        "dayto": 189,
        "rate": 3.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-HB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 70,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.66,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 1.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM6, 3930DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.95,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 106,
        "dayto": 119,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 120,
        "dayto": 133,
        "rate": 3.05,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 134,
        "dayto": 140,
        "rate": 3.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 141,
        "dayto": 147,
        "rate": 3.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL1-TH",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 0.12,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 0.33,
        "classname": "Ngày sinh",
        "wmslocationid": "GGL2-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 0.56,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 0.81,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 1.12,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 1.29,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 1.29,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 3,
        "dayto": 10,
        "rate": 0.01,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-DE",
        "itemid": "960883"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 11,
        "dayto": 18,
        "rate": 0.02,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-DE",
        "itemid": "9271-B20, 960883"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 19,
        "dayto": 22,
        "rate": 0.04,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-DE",
        "itemid": "9271-B20"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 23,
        "dayto": 29,
        "rate": 0.12,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-DE",
        "itemid": "9271-B20"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.66,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3872, 3872DHG-M2, 3872DHG-M2-5, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 1.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8, 3872"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.95,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 120,
        "dayto": 126,
        "rate": 3.05,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 127,
        "dayto": 133,
        "rate": 3.05,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 134,
        "dayto": 140,
        "rate": 3.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 141,
        "dayto": 147,
        "rate": 3.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 148,
        "dayto": 154,
        "rate": 3.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 155,
        "dayto": 189,
        "rate": 3.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-HB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-PB",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.66,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8, 3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 1.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3910DHGM6, 3910DHGM8"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM6, 3930DHGM"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2, 3930DHGM, 3930DHGM6"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.95,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 106,
        "dayto": 119,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 120,
        "dayto": 133,
        "rate": 3.05,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 134,
        "dayto": 140,
        "rate": 3.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GGL",
        "sfuture01": "GGL2",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 141,
        "dayto": 147,
        "rate": 3.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GGL2-TH",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3970DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 5,
        "rate": 3.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 6,
        "dayto": 12,
        "rate": 6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 13,
        "dayto": 19,
        "rate": 7.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 20,
        "dayto": 26,
        "rate": 8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 27,
        "dayto": 35,
        "rate": 8.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "3960DHG, 3960DHG-M2, 3960DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "FA",
        "itemgroupname": "Pig Asset",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-PB",
        "itemid": "3950DHG, 3950DHG-M2, 3950DHGM"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 0.25,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5, 9271-B20, 960883"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 0.37,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5, 960883"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 0.54,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-CS",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 0.71,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 0.87,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 1.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 1.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 1.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-CS",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 7,
        "dayto": 13,
        "rate": 0.01,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "960883"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 14,
        "dayto": 20,
        "rate": 0.015,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "960883, 9271-B20"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 21,
        "dayto": 27,
        "rate": 0.03,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "9271-B20"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 28,
        "dayto": 34,
        "rate": 0.05,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5, 9271-B20"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 35,
        "dayto": 41,
        "rate": 0.25,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "3871, 3871DHG-M2, 3871DHG-M2-5, 9271-B20"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 42,
        "dayto": 48,
        "rate": 0.37,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-DE",
        "itemid": "3872, 3872DHG-M2, 3872DHG-M2-5"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 1.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 1.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.75,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 105,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 106,
        "dayto": 112,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 113,
        "dayto": 119,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 120,
        "dayto": 126,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 127,
        "dayto": 133,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 134,
        "dayto": 140,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 141,
        "dayto": 147,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 148,
        "dayto": 154,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 155,
        "dayto": 210,
        "rate": 3.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-HB",
        "itemid": "3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TD",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3950DHG, 3950DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 14,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 15,
        "dayto": 21,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TD",
        "itemid": "3970DHG, 3970DHG-M7, 3970DHG-Y2-5, 3950DHG, 3950DHG-M2, 3970DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 1,
        "dayto": 7,
        "rate": 1.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 8,
        "dayto": 15,
        "rate": 1.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 16,
        "dayto": 21,
        "rate": 1.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 22,
        "dayto": 28,
        "rate": 1.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 29,
        "dayto": 35,
        "rate": 2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 36,
        "dayto": 42,
        "rate": 2.1,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3910DHG, 3910DHG-M2-4, 3910DHG-M2, 3874"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 43,
        "dayto": 49,
        "rate": 2.2,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 50,
        "dayto": 56,
        "rate": 2.3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 57,
        "dayto": 63,
        "rate": 2.4,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 64,
        "dayto": 70,
        "rate": 2.5,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 71,
        "dayto": 77,
        "rate": 2.6,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 78,
        "dayto": 84,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 85,
        "dayto": 91,
        "rate": 2.7,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 92,
        "dayto": 98,
        "rate": 2.75,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 99,
        "dayto": 106,
        "rate": 2.8,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 107,
        "dayto": 127,
        "rate": 2.85,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 128,
        "dayto": 141,
        "rate": 2.9,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    },
    {
        "site": "GSL",
        "sfuture01": "GSL1",
        "itemgroupid": "WIP",
        "itemgroupname": "Work in Progress",
        "dayfrom": 142,
        "dayto": 148,
        "rate": 3,
        "classname": "Ngày tồn kho tại chuồng",
        "wmslocationid": "GSL1-TH",
        "itemid": "3874, 3930DHG, 3930DHG-M2-4, 3930DHG-M2"
    }
];

export const listService = {
    /**
     * Mock form definition / metadata (fields, headers, widths, formats, actions).
     */
    async declare(formId: string): Promise<any> {
        const apiConfig = await declareFromApi(formId);
        if (apiConfig) {
            return apiConfig;
        }

        const mockConfig = mockFormDefinitions[formId];
        if (mockConfig) {
            return mockConfig;
        }

        throw new Error(`Form configuration for '${formId}' is not declared in mock settings.`);
    },

    /**
     * Mock list data querying with local filter, sort and paging simulation.
     */
    async all(
        formId: string,
        start: number,
        limit: number,
        searchInline: InlineFilter[],
        sortName?: string,
        sortType?: string
    ): Promise<{ data: any[]; total: number }> {
        const apiResult = await allFromApi(formId, start, limit, searchInline, sortName, sortType);
        if (apiResult) {
            return apiResult;
        }

        if (formId !== "d365040810") {
            return { data: [], total: 0 };
        }

        let filtered = [...mockDataFeedBOM];

        // Apply inline filters locally mimicking ListController's GetKeyInLine C# logic
        for (const filter of searchInline) {
            const { id, type, operation, value } = filter;
            const filterValLower = value.toLowerCase();

            filtered = filtered.filter(row => {
                const cellValue = (row as any)[id];
                if (cellValue === undefined || cellValue === null) {
                    return operation === "BLANK";
                }

                const cellStrLower = String(cellValue).toLowerCase();

                switch (operation) {
                    case "LIKE":
                        return cellStrLower.includes(filterValLower);
                    case "BEGIN":
                        return cellStrLower.startsWith(filterValLower);
                    case "=":
                        if (type === "N") return Number(cellValue) === Number(value);
                        return cellStrLower === filterValLower;
                    case "!=":
                        if (type === "N") return Number(cellValue) !== Number(value);
                        return cellStrLower !== filterValLower;
                    case ">":
                        return Number(cellValue) > Number(value);
                    case ">=":
                        return Number(cellValue) >= Number(value);
                    case "<":
                        return Number(cellValue) < Number(value);
                    case "<=":
                        return Number(cellValue) <= Number(value);
                    case "BLANK":
                        return cellStrLower === "";
                    case "!Blank":
                        return cellStrLower !== "";
                    default:
                        return true;
                }
            });
        }

        // Apply local sorting mimicking corder SQL execution
        if (sortName) {
            filtered.sort((a: any, b: any) => {
                const valA = a[sortName];
                const valB = b[sortName];

                if (valA === valB) return 0;
                if (valA === undefined || valA === null) return 1;
                if (valB === undefined || valB === null) return -1;

                let comparison = 0;
                if (typeof valA === "number" && typeof valB === "number") {
                    comparison = valA - valB;
                } else {
                    comparison = String(valA).localeCompare(String(valB));
                }

                return sortType === "2" ? -comparison : comparison;
            });
        }

        // Apply local pagination
        const total = filtered.length;
        const slicedData = filtered.slice(start, start + limit);

        // Artificial short network latency for a realistic loading feel
        await new Promise(resolve => setTimeout(resolve, 300));

        return {
            data: slicedData,
            total
        };
    }
};
