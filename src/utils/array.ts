export function swapItems<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const nextItems = [...items];
  const temp = nextItems[fromIndex];
  nextItems[fromIndex] = nextItems[toIndex];
  nextItems[toIndex] = temp;
  return nextItems;
}
