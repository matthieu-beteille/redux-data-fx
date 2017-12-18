import 'babel-polyfill'
import forEach from 'lodash.foreach'
import { hasFX, fx, StateWithFx } from './helpers'
import { combineReducers } from './combine-reducers'
import { instrument } from './devtools'
import {
  StoreEnhancerStoreCreator,
  Store,
  Reducer,
  StoreEnhancer,
  Action,
  Dispatch,
  createStore
} from 'redux'
import {
  FXReducer,
  FXHandler,
  FXParams,
  RegisteredFXs,
  QueuedFX,
  FXStore,
  StoreCreator,
  Effects
} from './types'

export interface Options {
  devtools?: boolean
}

const reduxDataFX = ({ devtools }: Options = {}) => {
  return <S, A extends Action>(createStore: StoreEnhancerStoreCreator<S>) => (
    reducer: FXReducer<S>,
    initialState: S
  ): FXStore<S> => {
    let q: Effects = []
    let fx: RegisteredFXs<S> = {}

    const liftReducer = (reducer: FXReducer<S>): Reducer<S> => (
      state: S,
      action: Action
    ) => {
      const result = reducer(state, action)

      if (hasFX(result)) {
        let { effects, state } = result

        q = q.concat(effects)

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

        let { effect, ...params } = current

        if (fx[effect] !== undefined) {
          // !!! performing side effects !!!
          fx[effect](params, store.getState, store.dispatch)
        } else {
          console.warn(
            'Trying to use fx: ' +
              effect +
              '. None has been registered. Doing nothing.'
          )
        }
      }

      return res
    }

    const replaceEffectfulReducer = (reducer: FXReducer<S>) => {
      return store.replaceReducer(liftReducer(reducer))
    }

    if (devtools) {
      instrument(fx, dispatch, store.getState)
    }

    return {
      ...store,
      replaceEffectfulReducer,
      dispatch,
      registerFX(id: string, handler: FXHandler<S>) {
        fx[id] = handler
      }
    }
  }
}

const createStoreFx = createStore as StoreCreator

export { reduxDataFX, fx, createStoreFx as createStore, combineReducers }
