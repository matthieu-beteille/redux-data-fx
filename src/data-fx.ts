import 'babel-polyfill'
import { each, isObject } from 'lodash'

function hasFX(obj) {
  return obj && obj._fx && isObject(obj._fx) && obj.state !== undefined
}

export default function reduxDataFx() {
  return createStore => (reducer, initialState, enhancer) => {
    let q = []
    let fx = {}

    const liftReducer = reducer => (state, action) => {
      const result = reducer(state, action)

      if (hasFX(result)) {
        let { _fx, state } = result
        each(_fx, (params, id) => {
          q.push([id, params])
        })

        return state
      }
      return result
    }

    const store = createStore(liftReducer(reducer), initialState, enhancer)

    const dispatch = action => {
      store.dispatch(action)

      q.forEach(([id, params]) => {
        if (fx[id] !== undefined) {
          fx[id](params, store.getState, store.dispatch)
        } else {
          console.warn(
            'Trying to use fx: ' +
              id +
              '. None has been registered. Doing nothing.'
          )
        }
      })

      return Promise.resolve()
    }

    const replaceReducer = reducer => {
      return store.replaceReducer(liftReducer(reducer))
    }

    return {
      ...store,
      replaceReducer,
      dispatch,
      registerFx(id, handler) {
        fx[id] = handler
      }
    }
  }
}

export { reduxDataFx }
