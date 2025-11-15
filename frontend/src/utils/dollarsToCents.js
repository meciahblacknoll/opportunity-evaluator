/**
 * Convert dollars to cents
 * @param {string|number} dollars
 * @returns {number}
 */
export function dollarsToCents(dollars) {
  if (dollars === "" || dollars === null || dollars === undefined) {
    return 0;
  }
  const num = Number(String(dollars).replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(num)) {
    return 0;
  }
  return Math.round(num * 100);
}
