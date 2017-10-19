import { reduxDataFx } from '../src/data-fx'
import { createStore, applyMiddleware } from 'redux'
import _ from 'lodash'

const initialState = {
  value: 1
}

function reducer(state = initialState, action) {
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
      state
  }
}

const store = createStore(reducer, null, reduxDataFx())

store.registerFx('global', function(toStore, getState) {
  _.forEach(toStore, (val, key) => (window[key] = val))
})

store.registerFx('timeout', function(params, getState, dispatch) {
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

  it('timeout side fx', done => {
    store.dispatch({ type: 'wait' })
    expect(store.getState().value).toBe(1)
    setTimeout(() => {
      expect(store.getState().value).toBe(2)
      done()
    }, 100)
  })
})
