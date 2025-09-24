/**
 * Utility to detect persona/role step markers in a list of step markers.
 * Returns true if any marker matches persona/role patterns.
 */
export function detectPersonaStepMarker(stepMarkers: any[]): boolean {
  return stepMarkers.some(marker => {
    if (typeof marker === 'string') return /persona|role|you are|act as/i.test(marker);
    if (marker && typeof marker === 'object' && 'matchedText' in marker) return /persona|role|you are|act as/i.test(marker.matchedText ?? '');
    return false;
  });
}
