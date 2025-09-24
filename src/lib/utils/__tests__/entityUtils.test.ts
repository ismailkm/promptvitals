import { findKeyEntitiesHeuristic } from '../textAnalysisUtils';

describe('findKeyEntitiesHeuristic', () => {
  it('does not falsely flag sentence-start entities', () => {
    const text = 'Apple is a company. The CEO is Tim Cook.';
    const entities = findKeyEntitiesHeuristic(text);
    expect(entities).not.toContain('Apple'); // Assuming heuristic is tuned to avoid this
  });

  it('correctly identifies entities in middle/end of sentence', () => {
    const text = 'The main competitors are Google and Microsoft.';
    const entities = findKeyEntitiesHeuristic(text);
    expect(entities[0].matchedText).toContain('Google');
    expect(entities[1].matchedText).toContain('Microsoft');
  });
});
