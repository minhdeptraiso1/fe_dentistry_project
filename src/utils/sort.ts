/**
 * Sort array by createdAt in descending order (newest first)
 */
export function sortByCreatedAtDesc<T extends { createdAt?: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA; // DESC (newest first)
  });
}
