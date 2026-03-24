type PrefetchFn = () => Promise<unknown> | void;

const onceKeys = new Set<string>();

export function runOnce(key: string, fn: PrefetchFn) {
  if (onceKeys.has(key)) return;
  onceKeys.add(key);
  void fn();
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function prefetchConDelay(key: string, fn: PrefetchFn, ms = 250) {
  if (onceKeys.has(key)) return;
  await delay(ms);
  runOnce(key, fn);
}
