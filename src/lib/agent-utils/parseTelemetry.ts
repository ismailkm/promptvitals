type TelemetryEvent = 'parse_success' | 'parse_repaired' | 'parse_failed';

const counters: Record<string, number> = {};
const samples: Record<string, string[]> = {};

export function recordTelemetry(event: TelemetryEvent, moduleName: string, sample?: string) {
  const key = `${moduleName}:${event}`;
  counters[key] = (counters[key] || 0) + 1;
  if (sample) {
    samples[key] = samples[key] || [];
    // keep up to 5 samples per key
    if (samples[key].length < 5) samples[key].push(sample.slice(0, 1000));
  }
}

export function getTelemetry() {
  return { counters: { ...counters }, samples: { ...samples } };
}

export function resetTelemetry() {
  for (const k of Object.keys(counters)) delete counters[k];
  for (const k of Object.keys(samples)) delete samples[k];
}
