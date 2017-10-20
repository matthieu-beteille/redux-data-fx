import { reduxDataFX, EnhancedStore } from '../src/redux-data-fx'
import { createStore, applyMiddleware, compose } from 'redux'
import forEach from 'lodash.foreach'
import reduxLogger from 'redux-logger'

jest.setTimeout(1000)

type State = {
  value: number
}

type Action =
  | { type: 'wait' }
  | { type: 'increment' }
  | { type: 'global' }
  | { type: 'storageSet' }
  | { type: 'storageRemove' }

const initialState: State = {
  value: 1
}

let window = {
  ok: null,
  test: null
}

function Storage() {
  this.store = {}
}
Storage.prototype.setItem = function(id, item) {
  this.store[id] = item
}
Storage.prototype.getItem = function(id) {
  return this.store[id]
}
Storage.prototype.removeItem = function(id) {
  delete this.store[id]
}

let localStorage = new Storage()

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

    case 'storageSet':
      return {
        _fx: {
          localStorage: {
            set: {
              key1: 'value1',
              key2: 'value2'
            }
          }
        },
        state
      }

    case 'storageRemove':
      return {
        _fx: {
          localStorage: {
            remove: ['key1', 'key2']
          }
        },
        state
      }

    default:
      return state
  }
}

const enhancer = compose(applyMiddleware(reduxLogger), reduxDataFX)

const store = createStore(reducer, initialState, enhancer)

store.registerFX('global', function(toStore, getState) {
  forEach(toStore, (val, key) => (window[key] = val))
})

store.registerFX('timeout', function(params, getState, dispatch) {
  setTimeout(() => {
    dispatch({ type: params.action, ...params.payload })
  }, params.value)
})

store.registerFX('localStorage', function(params, getState, dispatch) {
  if (params.set) {
    forEach(params.set, (value, key) => {
      localStorage.setItem(key, value)
    })
  }
  if (params.remove && Array.isArray(params.remove)) {
    params.remove.forEach(key => {
      localStorage.removeItem(key)
    })
  }
})

describe('Simple FX tests', () => {
  it('should trigger global fx and create two global variables', () => {
    store.dispatch({ type: 'global' })
    expect(window.test).toBe(1)
    expect(window.ok).toBe('cool')
    expect(true).toBeTruthy()
  })

  // it("should trigger timeout side fx", done => {
  //   store.dispatch({ type: "timeout" });
  //   expect(store.getState().value).toBe(1);
  //   setTimeout(() => {
  //     expect(store.getState().value).toBe(2);
  //     done();
  //   }, 100);
  // });

  it('should use localStorage side fx', () => {
    store.dispatch({ type: 'storageSet' })
    expect(localStorage.getItem('key1')).toBe('value1')
    expect(localStorage.getItem('key2')).toBe('value2')
    store.dispatch({ type: 'storageRemove' })
    expect(localStorage.getItem('key1')).toBe(undefined)
    expect(localStorage.getItem('key2')).toBe(undefined)
  })
})
