import { reduxDataFX, fx, createStore } from '../src/redux-data-fx'
import { applyMiddleware, compose } from 'redux'
import forEach from 'lodash.foreach'

jest.setTimeout(1000)

type State = {
  value: number
}

const initialState = {
  value: 0
}

type Action =
  | { type: 'wait' }
  | { type: 'increment' }
  | { type: 'global' }
  | { type: 'storageSet' }
  | { type: 'storageRemove' }
  | { type: 'batchStorage' }

const State = {
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
      return fx(state, {
        timeout: {
          value: 50,
          action: 'increment',
          payload: {}
        }
      })

    case 'increment':
      return { value: state.value + 1 }

    case 'global':
      return fx(state, {
        global: {
          test: 1,
          ok: 'cool'
        }
      })

    case 'storageSet':
      return fx(state, {
        localStorage: {
          set: {
            key1: 'value1',
            key2: 'value2'
          }
        }
      })

    case 'storageRemove':
      return fx(
        { value: 1000 },
        {
          localStorage: {
            remove: ['key1', 'key2']
          }
        }
      )

    case 'batchStorage':
      return fx({ value: 50 }, [
        {
          localStorage: {
            set: {
              a: 1,
              b: 2
            }
          }
        },
        {
          localStorage: {
            set: {
              c: 3,
              d: 4
            }
          }
        }
      ])

    default:
      return state
  }
}

const store = createStore(reducer, reduxDataFX)

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

  it('should run localStorage side fx, and update the state', () => {
    store.dispatch({ type: 'storageSet' })
    expect(localStorage.getItem('key1')).toBe('value1')
    expect(localStorage.getItem('key2')).toBe('value2')
    store.dispatch({ type: 'storageRemove' })
    expect(localStorage.getItem('key1')).toBe(undefined)
    expect(localStorage.getItem('key2')).toBe(undefined)
    expect(store.getState().value).toBe(1000)
  })

  it('should run a batch of localStorage side fx', () => {
    store.dispatch({ type: 'batchStorage' })
    expect(localStorage.getItem('a')).toBe(1)
    expect(localStorage.getItem('b')).toBe(2)
    expect(localStorage.getItem('c')).toBe(3)
    expect(localStorage.getItem('d')).toBe(4)
    expect(store.getState().value).toBe(50)
  })
})
