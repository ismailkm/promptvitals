import { filterOverlappingMatches } from '../filterMatchUtils';
import type { DetectedPatternInfo } from '@/lib/types/patterns';
import { SeverityLevel } from '@/lib/types/shared';

describe('filterOverlappingMatches', () => {
  it('removes overlapping matches, keeps the longest', () => {
        const matches: DetectedPatternInfo[] = [{
          matchedPatternSource: 'A',
          reason: 'test',
          severity: SeverityLevel.LOW,
          startIndex: 0,
          endIndex: 5
        },
        {
          matchedPatternSource: 'B',
          reason: 'test',
          severity: SeverityLevel.LOW,
          startIndex: 3,
          endIndex: 8
        }, // overlaps with first
        {
          matchedPatternSource: 'C',
          reason: 'test',
          severity: SeverityLevel.LOW,
          startIndex: 10,
          endIndex: 15
        }
      ];
      const result = filterOverlappingMatches(matches);
      expect(result.length).toBe(2);
      expect(result.some(m => m.startIndex === 10 && m.endIndex === 15)).toBe(true);
  });

  it('keeps non-overlapping matches', () => {
        const matches: DetectedPatternInfo[] = [{
          matchedPatternSource: 'A',
          reason: 'test',
          severity: SeverityLevel.LOW,
          startIndex: 0,
          endIndex: 2
        },
        {
          matchedPatternSource: 'B',
          reason: 'test',
          severity: SeverityLevel.LOW,
          startIndex: 3,
          endIndex: 5
        }
      ];
      const result = filterOverlappingMatches(matches);
      expect(result.length).toBe(2);
  });

  it('handles nested matches', () => {
        const matches: DetectedPatternInfo[] = [{
          matchedPatternSource: 'A',
          reason: 'test',
          severity: SeverityLevel.LOW,
          startIndex: 0,
          endIndex: 10
        },
        {
          matchedPatternSource: 'B',
          reason: 'test',
          severity: SeverityLevel.LOW,
          startIndex: 2,
          endIndex: 5
        } // nested inside first
      ];
      const result = filterOverlappingMatches(matches);
      expect(result.length).toBe(1);
      expect(result[0].startIndex).toBe(0);
      expect(result[0].endIndex).toBe(10);
  });
});
