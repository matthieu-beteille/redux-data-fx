import { combineReducers as reduxCombineReducers, Action } from 'redux'
import { hasFX, fx, StateWithFx } from './helpers'
import { FXReducer, Effects } from './types'
import mapValues from 'lodash.mapvalues'

export interface ReducersMapObject {
  [key: string]: FXReducer<any>
}

function combineReducers<A extends Action>(reducers: ReducersMapObject) {
  let reducer = reduxCombineReducers(reducers)

  return function(state: any, action: A): StateWithFx<any> {
    const newStateWithFx = reducer(state, action)
    let batchEffects: Effects = []

    const newState = mapValues(newStateWithFx, (value: any) => {
      if (hasFX(value)) {
        let { state, effects } = value
        batchEffects = batchEffects.concat(effects)

        return state
      }

      return value
    })

    return fx(newState, batchEffects)
  }
}

export { combineReducers }
