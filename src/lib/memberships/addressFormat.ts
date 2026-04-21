/** UK-style postal fields shared by member profile and CSV flat rows. */
export type PostalAddressFields = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
};

export function emptyPostalAddress(): PostalAddressFields {
  return { addressLine1: "", addressLine2: "", city: "", postcode: "" };
}

/** Non-empty lines for display (e.g. `<address>` block). */
export function formatPostalAddressLines(m: PostalAddressFields): string[] {
  const out: string[] = [];
  if (m.addressLine1.trim()) out.push(m.addressLine1.trim());
  if (m.addressLine2.trim()) out.push(m.addressLine2.trim());
  const city = m.city.trim();
  const pc = m.postcode.trim();
  if (city && pc) out.push(`${city}, ${pc}`);
  else if (city) out.push(city);
  else if (pc) out.push(pc);
  return out.length ? out : [];
}

/** Single line for search / CSV “address” compatibility. */
export function formatPostalAddressOneLine(m: PostalAddressFields): string {
  return formatPostalAddressLines(m).join(", ");
}

export function postalAddressSearchText(m: PostalAddressFields): string {
  return [m.addressLine1, m.addressLine2, m.city, m.postcode].join(" ");
}
