/**
 * Nested List/Step Analysis Utility
 *
 * Parses a flat array of step or bullet markers (DetectedPatternInfo[] or strings)
 * into a hierarchical (nested) structure based on numbering, bullet type, or indentation.
 *
 * This enables accurate scoring of prompts with nested instructions or lists.
 */

import { DetectedPatternInfo, NestedStepNodePattern } from '@/lib/types/patterns';


/**
 * Parses a flat list of step/bullet markers into a nested tree structure.
 *
 * @param stepMarkers Array of DetectedPatternInfo or strings representing steps/bullets
 * @returns Root-level array of NestedStepNode (each may have children)
 */
export function parseNestedSteps(stepMarkers: Array<DetectedPatternInfo | string>): NestedStepNodePattern[] {
  const rootNodes: NestedStepNodePattern[] = [];
  const parentStack: NestedStepNodePattern[] = [];

  for (const marker of stepMarkers) {
    const text = typeof marker === 'string' ? marker : marker.matchedText || '';
    const startIndex = typeof marker === 'string' ? undefined : marker.startIndex;
    const endIndex = typeof marker === 'string' ? undefined : marker.endIndex;

    const indentMatch = text.match(/^(\s*)/);
    const indentLength = indentMatch ? indentMatch[1].length : 0;
    
    // A simple and robust way to determine level: based on indentation.
    // Assuming 2 spaces per level. Adjust if your standard is different.
    const level = Math.floor(indentLength / 2);

    const newNode: NestedStepNodePattern = {
      text: text.trim(), // We only need the trimmed text now
      matchedText: text,
      startIndex,
      endIndex,
      children: [],
      level
    };

    // Find the correct parent in the stack based on the current node's level.
    while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= level) {
      parentStack.pop();
    }

    if (parentStack.length === 0) {
      // This is a top-level node.
      rootNodes.push(newNode);
    } else {
      // This is a child of the last item in the stack.
      parentStack[parentStack.length - 1].children.push(newNode);
    }

    // Add the current node to the stack to be a potential parent for the next nodes.
    parentStack.push(newNode);
  }

  return rootNodes;
}
/**
 * Recursively counts all steps (including nested children)
 */
export function countAllSteps(nodes: NestedStepNodePattern[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1 + countAllSteps(node.children);
  }
  return count;
}
