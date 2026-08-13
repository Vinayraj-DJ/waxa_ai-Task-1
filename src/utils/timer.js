/**
 * High-precision timer returning milliseconds elapsed since start.
 */
export function startTimer() {
  const start = process.hrtime.bigint();
  return {
    elapsedMs: () => {
      const end = process.hrtime.bigint();
      return Number(end - start) / 1e6;
    }
  };
}
