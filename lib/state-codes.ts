/**
 * GST state codes, which a tax invoice has to print beside the place of supply.
 *
 * The first two digits of a GSTIN are the same code, which is why 09 in
 * `09IGMPB9121F2Z9` and "Uttar Pradesh" have to agree — a mismatch between the
 * seller's code and the place of supply is what decides CGST+SGST versus IGST.
 *
 * Keys must match INDIAN_STATES in `lib/constants.ts` exactly.
 */
export const STATE_CODES: Record<string, string> = {
  "Jammu & Kashmir": "01",
  "Himachal Pradesh": "02",
  Punjab: "03",
  Chandigarh: "04",
  Uttarakhand: "05",
  Haryana: "06",
  Delhi: "07",
  Rajasthan: "08",
  "Uttar Pradesh": "09",
  Bihar: "10",
  Sikkim: "11",
  "Arunachal Pradesh": "12",
  Nagaland: "13",
  Manipur: "14",
  Mizoram: "15",
  Tripura: "16",
  Meghalaya: "17",
  Assam: "18",
  "West Bengal": "19",
  Jharkhand: "20",
  Odisha: "21",
  Chhattisgarh: "22",
  "Madhya Pradesh": "23",
  Gujarat: "24",
  "Dadra & Nagar Haveli & Daman & Diu": "26",
  Maharashtra: "27",
  Karnataka: "29",
  Goa: "30",
  Lakshadweep: "31",
  Kerala: "32",
  "Tamil Nadu": "33",
  Puducherry: "34",
  "Andaman & Nicobar Islands": "35",
  Telangana: "36",
  "Andhra Pradesh": "37",
  Ladakh: "38",
};

/** "Uttar Pradesh (09)", or just the state where no code is known. */
export function stateWithCode(state?: string | null): string {
  if (!state) return "—";
  const code = STATE_CODES[state];
  return code ? `${state} (${code})` : state;
}
