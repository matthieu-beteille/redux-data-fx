import { reduxDataFX, EnhancedStore } from '../src/library'
import { createStore, applyMiddleware } from 'redux'
import _ from 'lodash'

jest.setTimeout(10000)

type State = {
  value: number
}

type Action = { type: 'wait' } | { type: 'increment' } | { type: 'global' }

const initialState: State = {
  value: 1
}

let window = {
  ok: null,
  test: null
}

function reducer(state: State = initialState, action: Action) {
  switch (action.type) {
    case 'wait':
      return {
        state,
        _fx: {
          timeout: {
            value: 50,
            action: 'increment',
            payload: {}
          }
        }
      }

    case 'increment':
      return { value: state.value + 1 }

    case 'global':
      return {
        _fx: {
          global: {
            test: 1,
            ok: 'cool'
          }
        },
        state
      }

    default:
      return state
  }
}

const store = createStore(reducer, initialState, reduxDataFX)

store.registerFX('global', function(toStore, getState) {
  _.forEach(toStore, (val, key) => (window[key] = val))
})

store.registerFX('timeout', function(params, getState, dispatch) {
  setTimeout(() => {
    dispatch({ type: params.action, ...params.payload })
  }, params.value)
})

describe('basic tests', () => {
  it('global side fx', () => {
    store.dispatch({ type: 'global' })
    expect(window.test).toBe(1)
    expect(window.ok).toBe('cool')
    expect(true).toBeTruthy()
  })

  it('timeout side fx', () => {
    store.dispatch({ type: 'timeout' })
    expect(store.getState().value).toBe(1)
  })
})
