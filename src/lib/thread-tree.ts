import type { ResponseNode } from "@/types";

/**
 * Build a tree structure from a flat array of responses.
 * Uses a Map for O(n) performance.
 *
 * @param responses - flat array of responses (must include parentResponseId)
 * @returns array of top-level ResponseNodes, each with nested children
 */
export function buildResponseTree<
  T extends {
    id: string;
    parentResponseId: string | null;
    position: number;
  },
>(responses: T[]): (T & { children: (T & { children: unknown[] })[] })[] {
  type Node = T & { children: Node[] };

  const map = new Map<string, Node>();
  const roots: Node[] = [];

  // First pass: wrap each response with an empty children array
  for (const r of responses) {
    map.set(r.id, { ...r, children: [] });
  }

  // Second pass: attach children to parents
  for (const r of responses) {
    const node = map.get(r.id)!;
    if (r.parentResponseId && map.has(r.parentResponseId)) {
      map.get(r.parentResponseId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by position within each parent
  function sortChildren(node: Node) {
    node.children.sort((a, b) => a.position - b.position);
    node.children.forEach(sortChildren);
  }
  roots.sort((a, b) => a.position - b.position);
  roots.forEach(sortChildren);

  return roots as (T & { children: (T & { children: unknown[] })[] })[];
}
