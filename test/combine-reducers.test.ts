import {
  combineReducers,
  reduxDataFX,
  fx,
  createStore
} from '../src/redux-data-fx'

type Action =
  | { type: 'increment' }
  | { type: 'push'; value: number }
  | { type: 'testFx1'; payload: any }
  | { type: 'testFx2'; payload: any }
  | { type: 'batchedFx'; payload: any }

const classicReducer = combineReducers({
  counter: (state: number = 0, action: Action) =>
    action.type === 'increment' ? state + 1 : state,
  stack: (state = [], action: Action) =>
    action.type === 'push' ? [...state, action.value] : state
})

const classicStore = createStore(classicReducer, reduxDataFX())

const effectfulReducer = combineReducers({
  counter(state: number = 0, action: Action) {
    return action.type === 'increment' ? state + 1 : state
  },
  stack: (state = [], action: Action) =>
    action.type === 'push' ? [...state, action.value] : state,
  reducer1: (state: number = 0, action: Action) => {
    switch (action.type) {
      case 'testFx1':
        return fx(state + 1, [{ effect: 'sideFx1', ...action.payload }])
      case 'testFx2':
        return fx(state + 1, [{ effect: 'sideFx2', ...action.payload }])
      case 'batchedFx':
        return fx(state, [
          { effect: 'sideFx1' },
          { effect: 'sideFx1' },
          { effect: 'sideFx2' },
          { effect: 'sideFx2' },
          { effect: 'sideFx2' }
        ])
      default:
        return state
    }
  }
})

const effectfulStore = createStore(effectfulReducer, reduxDataFX())

const sideFx1 = jest.fn()
const sideFx2 = jest.fn()

effectfulStore.registerFX('sideFx1', sideFx1)
effectfulStore.registerFX('sideFx2', sideFx2)

describe('Classic Reducer', () => {
  it('returns a composite reducer that maps the state keys to given reducers', () => {
    classicStore.dispatch({ type: 'increment' })
    expect(classicStore.getState()).toEqual({ counter: 1, stack: [] })
    classicStore.dispatch({ type: 'push', value: 'a' })
    expect(classicStore.getState()).toEqual({ counter: 1, stack: ['a'] })
  })
})

describe('Effectful Reducer', () => {
  it('updates the state and runs side effects returned from one of the different child reducers', () => {
    expect(effectfulStore.getState()).toEqual({
      counter: 0,
      stack: [],
      reducer1: 0
    })
    const payload = { a: 1, b: [1, 2, 3], c: 'string' }
    effectfulStore.dispatch({ type: 'testFx1', payload })
    expect(sideFx1.mock.calls.length).toBe(1)
    expect(sideFx1.mock.calls[0][0]).toEqual(payload)
    expect(effectfulStore.getState()).toEqual({
      counter: 0,
      stack: [],
      reducer1: 1
    })
    effectfulStore.dispatch({ type: 'testFx2', payload })
    expect(sideFx2.mock.calls.length).toBe(1)
    expect(sideFx2.mock.calls[0][0]).toEqual(payload)
    expect(effectfulStore.getState()).toEqual({
      counter: 0,
      stack: [],
      reducer1: 2
    })
  })

  it('runs batch of effects too', () => {
    expect(effectfulStore.getState()).toEqual({
      counter: 0,
      stack: [],
      reducer1: 2
    })
    effectfulStore.dispatch({ type: 'batchedFx' })
    expect(effectfulStore.getState()).toEqual({
      counter: 0,
      stack: [],
      reducer1: 2
    })
    expect(sideFx1.mock.calls.length).toBe(3)
    expect(sideFx2.mock.calls.length).toBe(4)
  })

  it('runs classic actions properly and update the state as expected', () => {
    expect(effectfulStore.getState()).toEqual({
      counter: 0,
      stack: [],
      reducer1: 2
    })
    effectfulStore.dispatch({ type: 'increment' })
    expect(effectfulStore.getState()).toEqual({
      counter: 1,
      stack: [],
      reducer1: 2
    })
    effectfulStore.dispatch({ type: 'push', value: 1 })
    expect(effectfulStore.getState()).toEqual({
      counter: 1,
      stack: [1],
      reducer1: 2
    })
    effectfulStore.dispatch({ type: 'push', value: 2 })
    expect(effectfulStore.getState()).toEqual({
      counter: 1,
      stack: [1, 2],
      reducer1: 2
    })
  })
})
