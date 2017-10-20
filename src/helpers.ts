export interface StateWithFx {
  [key: string]: any
  state: any
  _fx: { [key: string]: any }
}

export function hasFX(s: any): s is StateWithFx {
  return s && typeof s._fx === 'object' && '_fx' in s && 'state' in s
}
