import { Action, StoreEnhancer, Dispatch, Store, Reducer } from 'redux'
import { StateWithFx } from './helpers'

export type Effect = { effect: string; [key: string]: any }
export type Effects = Effect[]

export interface StoreCreator {
  <S, A extends Action>(
    reducer: FXReducer<S>,
    enhancer?: StoreEnhancer<S>
  ): FXStore<S>
  <S, A extends Action>(
    reducer: FXReducer<S>,
    preloadedState: S,
    enhancer?: StoreEnhancer<S>
  ): FXStore<S>
}

export interface FXReducer<S> {
  (state: S | undefined, action: Action): S | StateWithFx<S>
}

export interface FXHandler<S> {
  (params: FXParams, getState: () => S, dispatch: Dispatch<S>): void
}

export interface FXParams {
  [key: string]: any
}

export interface RegisteredFXs<S> {
  [key: string]: FXHandler<S>
}

export type QueuedFX = [string, FXParams]

export interface FXStore<S> extends Store<S> {
  registerFX(id: string, handler: FXHandler<S>): void
  replaceEffectfulReducer(reducer: FXReducer<S>): void
}
