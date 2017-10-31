import { Action, StoreEnhancer, Dispatch, Store } from 'redux'
import { StateWithFx } from './helpers'

export type Effects = { [key: string]: any }

export type BatchEffects = Effects[]

export interface StoreCreator {
  <S, A extends Action>(
    reducer: FXReducer<S, A>,
    enhancer?: StoreEnhancer<S>
  ): FXStore<S>
  <S, A extends Action>(
    reducer: FXReducer<S, A>,
    preloadedState: S,
    enhancer?: StoreEnhancer<S>
  ): FXStore<S>
}

export interface FXReducer<S, A> {
  (state: S | undefined, action: A): S | StateWithFx<S>
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
}
