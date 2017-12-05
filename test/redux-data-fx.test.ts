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
  | { type: 'undefinedFx' }
  | { type: 'testSideFx1'; payload: { [key: string]: any } }
  | { type: 'testSideFx2'; data: { [key: string]: any } }
  | { type: 'batchStorage' }
  | { type: 'flow1' }
  | { type: 'flow2' }
  | { type: 'flow3' }

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
      return fx(state, [
        {
          effect: 'timeout',
          value: 50,
          action: 'increment',
          payload: {}
        }
      ])

    case 'increment':
      return { value: state.value + 1 }

    case 'global':
      return fx(state, [
        {
          effect: 'global',
          test: 1,
          ok: 'cool'
        }
      ])

    case 'storageSet':
      return fx(state, [
        {
          effect: 'localStorage',
          set: {
            key1: 'value1',
            key2: 'value2'
          }
        }
      ])

    case 'storageRemove':
      return fx({ value: 1000 }, [
        {
          effect: 'localStorage',
          remove: ['key1', 'key2']
        }
      ])

    case 'testSideFx1':
      return fx(state, [{ effect: 'sideFx1', ...action.payload }])

    case 'testSideFx2':
      return fx(state, [{ effect: 'sideFx2', ...action.data }])

    case 'undefinedFx':
      return fx(state, [{ effect: 'undefinedFx', a: 1 }])

    case 'batchStorage':
      return fx({ value: 50 }, [
        {
          effect: 'localStorage',
          set: {
            a: 1,
            b: 2
          }
        },
        {
          effect: 'localStorage',
          set: {
            c: 3,
            d: 4
          }
        },
        {
          effect: 'localStorage',
          set: {
            e: 5,
            f: 6
          }
        }
      ])

    case 'flow1':
      return fx({ value: 2020 }, [
        { effect: 'log', text: 'step1' },
        { effect: 'dispatch', actions: [{ type: 'flow2' }] }
      ])

    case 'flow2':
      return fx({ value: 100 }, [
        { effect: 'log', text: 'step2' },
        { effect: 'dispatch', actions: [{ type: 'flow3' }] }
      ])

    case 'flow3':
      return fx({ value: 1020 }, [{ effect: 'log', text: 'last' }])

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

store.registerFX('dispatch', (params, getState, dispatch) => {
  params.actions.forEach(action => {
    dispatch(action)
  })
})

store.registerFX('log', (params, getState, dispatch) => {
  console.log('[LOGGING EFFECT]: ', params.text)
})

const sideFx1 = jest.fn()
store.registerFX('sideFx1', sideFx1)

const sideFx2 = jest.fn()
store.registerFX('sideFx2', sideFx2)

describe('ReduxDataFx', () => {
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
    expect(localStorage.getItem('e')).toBe(5)
    expect(localStorage.getItem('f')).toBe(6)
    expect(store.getState().value).toBe(50)
  })

  it('should run sideFx1 passing the payload over to the effect handler', () => {
    const payload1 = { a: 1, b: 2, c: [3, 4, { test: 'mock' }] }
    const testLength = 1000
    expect(sideFx1.mock.calls.length).toBe(0)
    for (let i = 0; i < testLength; i++) {
      store.dispatch({ type: 'testSideFx1', payload: payload1 })
      expect(sideFx1.mock.calls.length).toBe(i + 1)
      expect(sideFx1.mock.calls[i][0]).toEqual(payload1)
      expect(sideFx1.mock.calls[i][1]()).toEqual(store.getState())
    }
    expect(sideFx1.mock.calls.length).toBe(testLength)
  })

  it('should run sideFx2 passing the payload over to the effect handler', () => {
    const data = { d: [1, 2], e: 2, f: 3 }
    const testLength = 1000
    expect(sideFx2.mock.calls.length).toBe(0)
    for (let i = 0; i < testLength; i++) {
      store.dispatch({ type: 'testSideFx2', data })
      expect(sideFx2.mock.calls.length).toBe(i + 1)
      expect(sideFx2.mock.calls[i][0]).toEqual(data)
      expect(sideFx2.mock.calls[i][1]()).toEqual(store.getState())
    }
    expect(sideFx2.mock.calls.length).toBe(testLength)
  })

  it('should warn if trying to use an unregistered effect', () => {
    const consoleSpy = jest.spyOn(console, 'warn')
    store.dispatch({ type: 'undefinedFx' })
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should trigger multiple side effects in a row', () => {
    const consoleSpy = jest.spyOn(console, 'log')
    store.dispatch({ type: 'flow1' })
    expect(store.getState().value).toBe(1020)
    expect(consoleSpy.mock.calls.length).toBe(3)
  })
})
