export type Effects = { [key: string]: any }

export type BatchEffects = [Effects]

export interface StateWithFx<S> {
  state: S
  effects: Effects | BatchEffects
}

export class StateWithFx<S> {
  constructor(state: S, effects: Effects) {
    this.state = state
    this.effects = effects
  }
}

export function hasFX<S>(s: S | StateWithFx<S>): s is StateWithFx<S> {
  return s instanceof StateWithFx
}

export function fx<S>(state: S, effects: Effects): StateWithFx<S> {
  return new StateWithFx(state, effects)
}
