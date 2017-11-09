# Redux Data FX 

Declarative Side Effects for Redux.

It helps you keep your business logic and effectful code separate.

The idea is simple: in addition of your app's new state, your reducers can also return a data structure describing some side effects you want to run. (your reducers remain pure.)
 
This is a little similar to `redux-loop`, mostly inspired by the elm architecture. But this very implementation's idea comes from re-frame in cljs and its effectful handlers. (re-frame is an awesome project, you should definitely check it out https://github.com/Day8/re-frame/)

## Overview

Usual reducer signature is:

```(Action, State) -> State```

With redux-data-fx, it becomes:

```(Action, State) -> State | { state: State, effects: Effects }```

Your reducer can either return only a new state, or a combination of a new state and another data structure: the description of some side effects that you want to run.

### 1. Declaratively describe side effects in your reducers.

One of your reducer could look like this:

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

The action 'fetch-some-data' is what we call an effectful action, it updates the state and returns a description of some side effects to run (here an http call).

If we want to run some side effects we need to return the result of the `fx` function called with your app new state and a data structure describing the side effects you want to perform.

```javascript
fx(NewState, Effects)
```

- *NewState:* the new state of your app (what you usually return from your reducer)

- *Effects:* a map containing the description of all the side effects you want to run. The keys of this map are the id/names of the side effects. The values are any data structures containing any data required to actually perform the side effect. (for instance for an api call, you might want to provide the url, the HTTP method, and some parameters)

*Note:* the fx function just creates an object of the following shape: 
```{ state: newAppState, effects: someEffectsToRun }```
You *have to* use the ```fx``` function to create this structure just so ```redux-data-fx``` knows that you want to run some effects.
Then ```redux-data-fx``` will update the state and run the effects behind the scene.

### 2. Run side effects

In order to actually run these described side effects you'll need to register some effect handlers. This is where the effectful code will be run (at the border of the system).

For instance to run our fetch side effect we would register the following handler:

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

The second argument is the effect handler, the function that will perform this side effect.
This function will be given 3 parameters when called:
- the description of the effect to run (from the Effects map you returned in the reducer)
- getState: useful if you need to access your state here
- dispatch: so you can dispatch new actions from there

### 3. How to use it?

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

If you want this to work with ```combineReducers``` from redux, you just have to use the one from ```redux-data-fx``` instead. You'll now be able to return effects from the reducers you're combining.

```javascript
import { reduxDataFX, combineReducers } from 'redux-data-fx'

const reducer = combinerReducers({
  reducer1: reducer1,
  ...
});

const store = createStore(reducer, reduxDataFx);
```

### Testing

You can keep testing your reducers the same way but when they return some effect descriptions you have now the ability to make sure these are right too. 

As described before, the function ```fx(newState, effects)``` only creates an object with two fields: 
- state: the new state of your app
- effects: your effects

Those are only data, so it's quite easy for you to test both of them when you test your reducers.

Then you can test your effect handlers separately, to verify they run the side effects as expected given the right inputs.

#### TODO: Default FX

Create some default effect handlers like: 
- fetch
- localStorage
- sessionStorage
- dispatchLater
- dispatch