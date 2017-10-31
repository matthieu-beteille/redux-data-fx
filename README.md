# Redux Data FX 

Declarative Side Effects for Redux.

There are many options out there to handle side effects with Redux (redux-saga, redux-loop...). I didn't quite find what I wanted so I decided I'd made this small store enhancer.

The idea is very simple: in addition of the new state, your reducers can now also return a data structure describing some side effects you want to run. (Your reducers remain pure functions.)
 
This is very similar to `redux-loop`, mostly inspired by the elm architecture. But I'd say this very   implementation's idea comes from re-frame in cljs and its effectful handlers.

(re-frame is an awesome project, you should definitely check it out https://github.com/Day8/re-frame/)

## Overview

Usual reducer signature:

```(Action, State) -> State```

With redux-data-fx, it becomes:

```(Action, State) -> State | { state: State, effects: Effects }```

Your reducer can either return only a new state as usual (same as first signature), or a combination of a new state and another data structure: the description of some side effects that you want to run.

## 1. Declaratively describe side effects in your reducers.

One of your reducer could now look like this:

```javascript
import { fx } from 'redux-data-fx';

function reducer(state = initialState, action) {
  switch(action.type) {
    'noop': 
      return state;
    
    'fetch/success': 
      return { 
        ...state, 
        data: action.payload.data, 
        isFetching: false 
      };

    'fetch/error': 
      return { 
        ...state, 
        error: 'Oops something wrong happened...',
        isFetching: false 
      };

    'fetch-some-data':
      return fx(
        { ...state, isFetching: true },
        {
          fetch: {
            url: 'http://some-api.com/data/1',
            method: 'GET',
            onSuccess: 'fetch/success',
            onError: 'fecth/error',
          },
        });

    default:
      return state;
  }
}
```

The 'fetch-some-data' action is what we call an effectful action, it updates the state and returns a description of some side effects to run as a result (here an http call).

As you probably have understood already, if we want to run some side effects we need to return the result of the `fx` function (```from 'redux-data-fx'```) called with your app new state and a data structure describing the side effects you want to perform.


```javascript
fx(NewState, Effects)
```

- *NewState:* the new state of your app (what you usually return from your reducer)

- *Effects:* a map containing the description of all the side effects you want to run. The keys of this map are the id/names of the side effects. The values are any data structures containing the data required to actually perform the side effect. (for instance for an api call, you might want to put the url, the HTTP method, and some parameters in there)

## 2. Run side effects

In order to actually run these side effects you'll need to register some effects handlers.

This is where the effectful code will be run (at the border of the system).

For instance to run our fetch side effects we could register the following handler:

```javascript
store.registerFX('fetch', (params, getState, dispatch) => {
  fetch(params.url, {
    method: params.method,
    body: params.body,
    ...,
  }).then(res => dispatch({ type: params.onSuccess, payload: res }))
  .catch(res => dispatch({ type: params.onError, payload: res }))
});
```

The first argument is the handler's id, it needs to be the same as the key used in the Effects map to describe the side effect you want to perform. In this case 'fetch'.

The second argument is the effect handler, the effectful function that will perform this side effect.
This function will take 3 parameters when called:
- the description of the effect to run (from the Effects map you returned in the reducer)
- getState: useful if you need to access your state here
- dispatch: so you can dispatch new actions from there

## 3. How to use it?

As simple as this:

```npm install --save redux-data-fx```

```javascript
import { reduxDataFX } from 'redux-data-fx'
import someMiddleware from 'some-middleware';

const enhancer = compose(
  applyMiddleware(someMiddleware),
  reduxDataFX
);

const store = createStore(reducer, initialState, enhancer);

// or createStore(reducer, enhancer); if you don't want to provide the initialState here
// or createStore(reducer, initialState, reduxDataFx); if no middleware

// then you can register as many FX as you want
store.registerFX('fetch', (params, getState, dispatch) => {
...
});

store.registerFX('localStorage', (params, getState, dispatch) => {
 ...
});

store.registerFX('dispatchLater', (params, getState, dispatch) => {
 ...
});
```

You can import ```createStore``` from 'redux'. But if you are using typescript you should import it from 'redux-data-fx' (it's the same thing except the types will be right).

### Use with ```combineReducers```

If you want this to work with the popular ```combineReducers``` function from redux, you just have to use the one from ```redux-data-fx```. You'll now be able to return effects from the reducers you're combining.

```javascript
import { reduxDataFX, combineReducers } from 'redux-data-fx'

const reducer = combinerReducers({
  reducer1: reducer1,
  ...
});

const store = createStore(reducer, reduxDataFx);
```

## Testing

You can keep testing your reducers the same way you were doing before, except that now you can also make sure that effectful actions return the right effects descriptions. Since these descriptions are just data, it's really easy to verify that they are what you expect them to be.

Then you can test your effect handlers independantly, to make sure they run the right side effects given the right inputs.

## TODO: Default FX

Make it work with combineReducers.
Create some default effect handlers like: fetch, localStorage, sessionStorage, dispatchLater, dispatch...