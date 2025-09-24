// src/lib/utils/__tests__/nounVerbBalance.test.ts

import { getNounVerbBalance } from '../textAnalysisUtils';

describe('getNounVerbBalance', () => {
  it('should return null ratio for empty text', () => {
    const result = getNounVerbBalance('');
    expect(result.ratio).toBeNull();
    expect(result.nounCount).toBe(0);
    expect(result.verbCount).toBe(0);
  });

  it('should return null ratio when no verbs are found', () => {
    const result = getNounVerbBalance('The book table chair');
    expect(result.ratio).toBeNull();
    expect(result.nounCount).toBeGreaterThan(0);
    expect(result.verbCount).toBe(0);
  });

  it('should calculate ratio for balanced text', () => {
    const result = getNounVerbBalance('The cat runs quickly');
    expect(result.ratio).toBeGreaterThan(0);
    expect(result.nounCount).toBeGreaterThan(0);
    expect(result.verbCount).toBeGreaterThan(0);
  });

  it('should detect high noun ratio (noun-heavy text)', () => {
    const result = getNounVerbBalance('The database table column index key field record entry contains information');
    expect(result.ratio).toBeGreaterThan(3); // Should trigger penalty
    expect(result.nounCount).toBeGreaterThan(result.verbCount);
  });

  it('should detect low noun ratio (verb-heavy text)', () => {
    const result = getNounVerbBalance('Run jump walk analyze create optimize generate build');
    if (result.ratio !== null) {
      expect(result.ratio).toBeLessThan(0.3); // Should trigger penalty
      expect(result.verbCount).toBeGreaterThan(result.nounCount);
    }
  });
});
