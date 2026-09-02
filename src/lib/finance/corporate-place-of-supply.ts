const STATE_CODE_BY_NAME: Record<string, string> = {
    andhra_pradesh: "37",
    bihar: "10",
    delhi: "07",
    gujarat: "24",
    karnataka: "29",
    kerala: "32",
    madhya_pradesh: "23",
    maharashtra: "27",
    odisha: "21",
    punjab: "03",
    rajasthan: "08",
    tamil_nadu: "33",
    telangana: "36",
    uttar_pradesh: "09",
    west_bengal: "19",
};

const STATE_NAME_BY_CODE = Object.fromEntries(
    Object.entries(STATE_CODE_BY_NAME).map(([name, code]) => [code, name])
);

const STATE_LABEL_BY_CODE: Record<string, string> = {
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "19": "West Bengal",
    "21": "Odisha",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "27": "Maharashtra",
    "29": "Karnataka",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "36": "Telangana",
    "37": "Andhra Pradesh",
};

function normalize(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
}

function resolveState(value?: string | null) {
    const normalized = normalize(value ?? "");
    const code = /^\d{2}$/.test(normalized)
        ? normalized
        : STATE_CODE_BY_NAME[normalized];
    if (!code) return null;
    return {
        stateCode: code,
        stateName:
            STATE_LABEL_BY_CODE[code] ?? STATE_NAME_BY_CODE[code] ?? normalized,
    };
}

export type CorporatePlaceOfSupply = {
    stateCode: string;
    stateName: string;
    source: "delivery_address" | "billing_address" | "registered_address";
};

export function resolveCorporatePlaceOfSupply(input: {
    deliveryState?: string | null;
    billingState?: string | null;
    registeredState?: string | null;
}): CorporatePlaceOfSupply {
    const candidates = [
        ["delivery_address", input.deliveryState],
        ["billing_address", input.billingState],
        ["registered_address", input.registeredState],
    ] as const;
    for (const [source, value] of candidates) {
        const state = resolveState(value);
        if (state) return { ...state, source };
    }
    return {
        stateCode: "",
        stateName: "",
        source: "registered_address",
    };
}

export function splitCorporateGstByPlaceOfSupply(input: {
    taxableValuePaise: number;
    gstRateBps: number;
    supplierStateCode?: string | null;
    placeOfSupplyStateCode?: string | null;
}) {
    const totalTaxPaise = Math.round(
        input.taxableValuePaise * (input.gstRateBps / 10_000)
    );
    const sameState =
        Boolean(input.supplierStateCode && input.placeOfSupplyStateCode) &&
        input.supplierStateCode === input.placeOfSupplyStateCode;
    if (!sameState) {
        return { cgstPaise: 0, sgstPaise: 0, igstPaise: totalTaxPaise };
    }
    const cgstPaise = Math.floor(totalTaxPaise / 2);
    return {
        cgstPaise,
        sgstPaise: totalTaxPaise - cgstPaise,
        igstPaise: 0,
    };
}
