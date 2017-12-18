export const DEVTOOLS_MSG_TYPE = 'REDUX_DATA_FX_DEVTOOLS'
export const APP_ID = '@redux-data-fx-app'
export const DEVTOOLS_ID = '@redux-data-fx-devtools'
const timeline = []

function ns(id) {
  return 'REDUX_DATA_FX_DEVTOOLS/' + id
}

export function createMessage(payload) {
  return { type: DEVTOOLS_MSG_TYPE, source: APP_ID, to: DEVTOOLS_ID, payload }
}

export const Messages = {
  CONNECT: ns('CONNECT'),
  INIT: ns('INIT'),
  REPLAY: ns('REPLAY')
}

function replayEffect(effect, effects, dispatch, getState) {
  console.log(effect)
}

function initDevtools(effects, timeline) {
  window.postMessage(
    createMessage({ type: Messages.INIT, effects, timeline }),
    '*'
  )
}

function handleMessage(msg, effects, dispatch, getState) {
  switch (msg.type) {
    case Messages.CONNECT:
      initDevtools(effects, timeline)
      break
    case Messages.REPLAY:
      replayEffect(msg.effect, effects, dispatch, getState)
      break
  }
}

export function instrument(effects, dispatch, getState) {
  // enable devtools
  window.__REDUX_DATA_FX_DEVTOOLS_GLOBAL_HOOK__ = true
  // listen to messages from devtools
  window.addEventListener('message', e => {
    if (
      e.data.type === DEVTOOLS_MSG_TYPE &&
      e.data.to &&
      e.data.to === APP_ID &&
      e.data.source &&
      e.data.source === DEVTOOLS_ID
    ) {
      handleMessage(e.data.payload, effects, dispatch, getState)
    }
  })
}
