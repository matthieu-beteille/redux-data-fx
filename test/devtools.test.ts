import { reduxDataFX, fx, createStore } from '../src/redux-data-fx'
import {
  DEVTOOLS_ID,
  DEVTOOLS_MSG_TYPE,
  APP_ID,
  Messages
} from '../src/devtools'
import { applyMiddleware, compose } from 'redux'
import forEach from 'lodash.foreach'
import { JSDOM } from 'jsdom'

global.window = new JSDOM('')

function createMessage(payload) {
  return { type: DEVTOOLS_MSG_TYPE, source: DEVTOOLS_ID, to: APP_ID, payload }
}

type State = {
  value: number
}

const initialState = {
  value: 0
}

type Action =
  | { type: 'increment' }
  | { type: 'testSideFx1'; payload: { [key: string]: any } }
  | { type: 'testSideFx2'; data: { [key: string]: any } }

const State = {
  value: 1
}

function reducer(state: State = initialState, action: Action) {
  switch (action.type) {
    case 'increment':
      return { value: state.value + 1 }
    case 'testSideFx1':
      return fx(state, [{ effect: 'sideFx1', ...action.payload }])
    case 'testSideFx2':
      return fx(state, [{ effect: 'sideFx2', ...action.data }])
    default:
      return state
  }
}

const store = createStore(reducer, reduxDataFX({ devtools: true }))

const sideFx1 = jest.fn()
store.registerFX('sideFx1', sideFx1)

const sideFx2 = jest.fn()
store.registerFX('sideFx2', sideFx2)

describe('ReduxDataFx', () => {
  it('should post INIT(timeline, effects) on startup', done => {
    window.addEventListener('message', e => {
      if (
        e.data.type === DEVTOOLS_MSG_TYPE &&
        e.data.to === DEVTOOLS_ID &&
        e.data.source === APP_ID
      ) {
        console.log(e.data)
        done()
      }
    })
    window.postMessage(createMessage({ type: Messages.CONNECT }), '*')
    expect(true).toBe(true)
  })
  // it("should post INIT(timelinem, effects) on CONNECT request", () => {});
  // it("should post the right message to devtools when registering a new effect", () => {});
  // it("should post the right message to devtools when triggering an effect", () => {});
  // it("devtools should be able to trigger a side effect using postMessage", () => {});
})
