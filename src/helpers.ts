import { Effects } from './types'

export interface StateWithFx<S> {
  state: S
  effects: Effects
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
