/**
 * Calculates accurate latency percentiles (p50, p95, p99) and statistics
 * from an array of millisecond or microsecond measurements.
 */
export function calculateStats(measurements = []) {
  if (!measurements || measurements.length === 0) {
    return {
      count: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0,
      mean: 0,
      stddev: 0
    };
  }

  const sorted = [...measurements].sort((a, b) => a - b);
  const count = sorted.length;

  const min = sorted[0];
  const max = sorted[count - 1];
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stddev = Math.sqrt(variance);

  const getPercentile = (p) => {
    if (count === 1) return sorted[0];
    const index = (p / 100) * (count - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (upper >= count) return sorted[count - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  return {
    count,
    p50: Math.round(getPercentile(50) * 100) / 100,
    p95: Math.round(getPercentile(95) * 100) / 100,
    p99: Math.round(getPercentile(99) * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    stddev: Math.round(stddev * 100) / 100
  };
}
