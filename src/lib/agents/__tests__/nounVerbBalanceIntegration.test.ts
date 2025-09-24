// Test noun/verb balance integration in clarity agent

import { evaluateClarityUnambiguityRules } from '../ClarityPurposeAgent';
import { makeContext } from '../../agent-utils/fixtureBuilders';

describe('Noun/Verb Balance Integration', () => {
  it('should penalize high noun/verb ratio (>3)', () => {
    const context = makeContext({
      nounVerbBalanceRatio: 4.5,
      nounCount: 9,
      verbCount: 2,
    });

    const result = evaluateClarityUnambiguityRules(context);

    expect(result.score).toBeLessThan(100); // Should be penalized
    expect(result.flags?.skewedNounVerbBalance).toBe(true);
    expect(result.flags?.nounVerbBalanceRatio).toBe(4.5);
    expect(result.flags?.nounCount).toBe(9);
    expect(result.flags?.verbCount).toBe(2);
  });

  it('should penalize low noun/verb ratio (<0.3)', () => {
    const context = makeContext({
      nounVerbBalanceRatio: 0.2,
      nounCount: 1,
      verbCount: 5,
    });

    const result = evaluateClarityUnambiguityRules(context);

    expect(result.score).toBeLessThan(100); // Should be penalized
    expect(result.flags?.skewedNounVerbBalance).toBe(true);
    expect(result.flags?.nounVerbBalanceRatio).toBe(0.2);
  });

  it('should not penalize balanced noun/verb ratio', () => {
    const context = makeContext({
      nounVerbBalanceRatio: 1.5,
      nounCount: 3,
      verbCount: 2,
    });

    const result = evaluateClarityUnambiguityRules(context);

    expect(result.score).toBe(100); // No penalty
    expect(result.flags?.skewedNounVerbBalance).toBeUndefined();
    expect(result.flags?.nounVerbBalanceRatio).toBe(1.5);
  });

  it('should handle null ratio gracefully', () => {
    const context = makeContext({
      nounVerbBalanceRatio: null,
      nounCount: 3,
      verbCount: 0,
    });

    const result = evaluateClarityUnambiguityRules(context);

    expect(result.score).toBe(100); // No penalty for null ratio
    expect(result.flags?.skewedNounVerbBalance).toBeUndefined();
    expect(result.flags?.nounVerbBalanceRatio).toBeUndefined();
  });
});
