// src/lib/utils/filterMatchUtils.ts
import type { DetectedPatternInfo } from '@/lib/types/patterns'; // Adjust path

/**
 * Filters an array of DetectedPatternInfo objects to remove overlapping matches,
 * prioritizing longer matches. If two matches have the same range and length,
 * the one that appeared earlier in the input array (before sorting by length)
 * might be preferred due to stable sort behavior of `startIndex` sort.
 *
 * @param matches - An array of DetectedPatternInfo, MUST include valid startIndex and endIndex.
 * @returns A new array of DetectedPatternInfo with overlaps resolved, sorted by startIndex.
 */
export function filterOverlappingMatches(matches: DetectedPatternInfo[]): DetectedPatternInfo[] {
  if (!matches || matches.length === 0) {
    return [];
  }

  // 1. Create a defensive copy and ensure indices are valid numbers for sorting.
  //    Filter out any matches that might have invalid indices.
  const validMatches = matches.filter(
    (match) => typeof match.startIndex === 'number' && typeof match.endIndex === 'number'
  );

  if (validMatches.length === 0) {
    return [];
  }

  // 2. Sort matches:
  //    - Primarily by length descending (longer matches first)
  //    - Secondarily by startIndex ascending (to process from left to right for same-length overlaps)
  const sortedMatches = [...validMatches].sort((a, b) => {
    const lengthA = a.endIndex - a.startIndex;
    const lengthB = b.endIndex - b.startIndex;

    if (lengthB !== lengthA) {
      return lengthB - lengthA; // Longer matches first
    }
    return a.startIndex - b.startIndex; // Then by start index
  });

  const filteredResults: DetectedPatternInfo[] = [];
  const coveredRanges: { start: number; end: number }[] = [];

  for (const currentMatch of sortedMatches) {
    let isOverlappedOrContained = false;
    for (const coveredRange of coveredRanges) {
      // Check for any overlap:
      // Current match: |----current----|
      // Covered range:       |----covered----|   OR   |----covered----| (partial overlap)
      // OR current is contained within covered, or covered is contained in current (shouldn't happen due to sort order for latter).
      if (
        Math.max(currentMatch.startIndex, coveredRange.start) < Math.min(currentMatch.endIndex, coveredRange.end)
      ) {
        isOverlappedOrContained = true;
        break;
      }
    }

    if (!isOverlappedOrContained) {
      filteredResults.push(currentMatch);
      coveredRanges.push({ start: currentMatch.startIndex, end: currentMatch.endIndex });
      // Optional: Sort coveredRanges by start index if it becomes very large, for minor optimization.
      // coveredRanges.sort((a,b) => a.start - b.start);
    }
  }

  // Return filteredResults sorted by their original appearance order in the text.
  return filteredResults.sort((a, b) => a.startIndex - b.startIndex);
}