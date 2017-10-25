import 'babel-polyfill'
import forEach from 'lodash.foreach'
import { hasFX, fx, StateWithFx } from './helpers'
import {
  StoreEnhancerStoreCreator,
  Store,
  Reducer,
  StoreEnhancer,
  Action,
  Dispatch,
  createStore
} from 'redux'

export interface FXReducer<S, A> {
  (state: S | undefined, action: A): S | StateWithFx<S>
}

export interface FXHandler<S> {
  (params: FXParams, getState: () => S, dispatch: Dispatch<S>): void
}

export interface FXParams {
  [key: string]: any
}

interface RegisteredFXs<S> {
  [key: string]: FXHandler<S>
}

type QueuedFX = [string, FXParams]

export interface FXStore<S> extends Store<S> {
  registerFX(id: string, handler: FXHandler<S>): void
}

const reduxDataFX = <S, A extends Action>(
  createStore: StoreEnhancerStoreCreator<S>
) => (reducer: FXReducer<S, A>, initialState: S): FXStore<S> => {
  let q: QueuedFX[] = []
  let fx: RegisteredFXs<S> = {}

  const liftReducer = (reducer: FXReducer<S, A>) => (state: S, action: A) => {
    const result = reducer(state, action)

    if (hasFX(result)) {
      let { effects, state } = result

      if (Array.isArray(effects)) {
        effects.forEach(effects => {
          forEach(effects, (params, id) => {
            q.push([id, params])
          })
        })
      } else {
        forEach(effects, (params, id) => {
          q.push([id, params])
        })
      }

      return state
    } else {
      return result
    }
  }

  const store = createStore(liftReducer(reducer), initialState)

  const dispatch = <A extends Action>(action: A): A => {
    let res = store.dispatch(action)

    while (q.length > 0) {
      let current = q.shift()

      if (!current) return res // --'

      let [id, params] = current

      if (fx[id] !== undefined) {
        fx[id](params, store.getState, store.dispatch)
      } else {
        console.warn(
          'Trying to use fx: ' +
            id +
            '. None has been registered. Doing nothing.'
        )
      }
    }

    return res
  }

  const replaceReducer = (reducer: Reducer<S>) => {
    return store.replaceReducer(liftReducer(reducer))
  }

  return {
    ...store,
    replaceReducer,
    dispatch,
    registerFX(id: string, handler: FXHandler<S>) {
      fx[id] = handler
    }
  }
}

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

const createStoreFx = createStore as StoreCreator

export { reduxDataFX, fx, createStoreFx as createStore }
