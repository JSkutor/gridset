/**
 * Exchanges two items in an array immutably.
 * 
 * @param {Array} items - The source array
 * @param {number} fromIndex - The index of the first item to swap
 * @param {number} toIndex - The index of the second item to swap
 * @returns {Array} A new array with the items swapped
 */
export function swapItems(items, fromIndex, toIndex) {
  const nextItems = [...items];
  const temp = nextItems[fromIndex];
  nextItems[fromIndex] = nextItems[toIndex];
  nextItems[toIndex] = temp;
  return nextItems;
}
