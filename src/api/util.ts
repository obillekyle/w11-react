export function execute(v: any, ...args: any) {
  if (typeof v == 'function') return v(...args);
  return v;
}

export function v(v: string | number) {
  typeof v == 'number' && (v = v + 'px');
  return `calc(${v} * var(--scaling, 1))`;
}
