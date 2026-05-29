export function normalizeMoroccanPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits === "055000000") {
    return "055000000";
  }

  if (/^0[67]\d{8}$/.test(digits)) {
    return `+212${digits.slice(1)}`;
  }

  if (/^212[67]\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  return phone.trim();
}

export function isValidMoroccanPhone(phone: string) {
  const normalized = normalizeMoroccanPhone(phone);
  return normalized === "055000000" || /^\+212[67]\d{8}$/.test(normalized);
}

