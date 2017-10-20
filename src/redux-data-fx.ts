import 'babel-polyfill'
import forEach from 'lodash.foreach'
import { hasFX } from './helpers'
import {
  StoreCreator,
  StoreEnhancerStoreCreator,
  Store,
  Reducer,
  StoreEnhancer,
  Action,
  Dispatch
} from 'redux'

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

export interface EnhancedStore<S> extends Store<S> {
  registerFX(id: string, handler: FXHandler<S>): void
}

const reduxDataFX = <S>(createStore: StoreEnhancerStoreCreator<S>) => (
  reducer: Reducer<S>,
  initialState: S
): EnhancedStore<S> => {
  let q: QueuedFX[] = []
  let fx: RegisteredFXs<S> = {}

  const liftReducer = (reducer: Reducer<S>) => (state: S, action: Action) => {
    const result = reducer(state, action)

    if (hasFX(result)) {
      let { _fx, state } = result
      forEach(_fx, (params, id) => {
        q.push([id, params])
      })
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

export { reduxDataFX }
