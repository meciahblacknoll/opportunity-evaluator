/**
 * Convert cents to dollars with 2 decimal places
 * @param {number|null|undefined} cents
 * @returns {string}
 */
export function centsToDollars(cents) {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return "0.00";
  }
  const dollars = cents / 100;
  return dollars.toFixed(2);
}
