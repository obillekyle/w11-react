/**
 * Executes value if its a function, return otherwise
 *
 * @param v - value to check and execute
 * @param args - the arguments of the function
 * @returns v or ReturnType\<v>
 */

export function execute(v: any, ...args: any) {
  if (typeof v == 'function') return v(...args);
  return v;
}

/**
 * Function that returns scale properties for css or scaled number
 * @param v - The value to scale
 * @param s - The desired scaling, defaults to css calc if value is a string, or unset
 * @returns string or number
 */
export function v(v: number | string) {
  const isNumber = typeof v == 'number';
  return `calc(${isNumber ? v + 'px' : v} * var(--scaling, 1))`;
}

/**
 * Function that returns timing properties for css or timing number
 * @param v - The value to time
 * @param t - The desired timing, defaults to css calc if value is a string, or unset
 * @returns string or number
 */
export function t(v: number | string) {
  const isNumber = typeof v == 'number';
  return `calc(${isNumber ? v + 'px' : v} / var(--timing, 1))`;
}
