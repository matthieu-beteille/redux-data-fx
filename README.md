# Redux Data FX 

## Declarative Side Effects for Redux.a

There are many options out there to handle side effects with Redux (redux-coco, redux-blabla, redux-gnagna, redux-hiprx...). I didn't quite find what I wanted so I decided I'd made this small store enhancer..

The idea is very similar to `redux-loop`, mostly inspired by the elm architecture, but I'd say this very implementation's idea comes from what re-frame is doing in cljs with its effectful handlers.

(re-frame is an awesome project, you should definitely check its readme/docs if you have time https://github.com/Day8/re-frame/)

## How does it work?

Usual reducer signature:

```(Action, State) -> State```

With redux-data-fx, it becomes:

```(Action, State) -> State | { newState: State, _fx: Effects }```

Your reducer can either return just a new state as usual (same as first signature), or a combination of a new state and another data structure: the description of some side effects that you want to run.

## 1. Declaratively describe side effects in your reducers.

One of your reducer could now look like this:

```javascript
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
      return {
        newState: { ...state, isFetching: true },
        _fx: {
          fetch: {
            url: 'http://some-api.com/data/1',
            method: 'GET',
            onSuccess: 'fetch/success',
            onError: 'fecth/error',
          },
        }};

    default:
      return state;
  }
}
```

The 'fetch-some-data' action is what we can call an effectful action, it sets a flag in the state, and returns a description of the side effects we want to run.

As you probably have understood already, if we want to run some side effects we return a map with two fields: 
```javascript
{
  newState: 'the new state of your app (what you usually returns from your reducer)',
  _fx: 'a map containing the description of all the side effects you want to perform'
}
```

*IMPORTANT NOTE*: if your real app state is a map containing a `_fx` field and `newState` field, then that won't work. This is a trade off I am willing to accept for now, since I find this solution really convenient, but we can definitely discuss new approaches (similar to redux-loop for instance).

## 2. How to run those described side effects ?

In order to actually run these side effects you'll need to register some effects handlers.

This is where the effectful nasty code will run (at the border of the system).

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

The first argument is the handler's id, it needs to be the same as the key used in the `_fx` map to describe the side effect you want to perfor. In this case 'fetch'.

The second argument is the effect handler, the effectful function that will perform this side effect.
It takes 3 parameters: 
- the description of the effect to run (from the _fx object you returned in the reducer)
- getState useful if you need to access your state here
- dispatch so you can dispatch new actions from there

## 3 How to use it?

As simple as this:

```npm install --save redux-data-fx```

```javascript
import  reduxDataFX from 'redux-data-fx'
import someMiddleware from 'some-middleware';

const enhancer = compose(
  applyMiddleware(someMiddleware),
  reduxDataFx
);

const store = createStore(reducer, initialState, enhancer);

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

## Testing

You can keep testing your reducers the same way you were doing before, except that now you can also make sure that effectful actions return the right effects descriptions. Since these descriptions are just data, it's really easy to verify that they are what you expect them to be.

Then you can test your effect handlers independantly, to make sure they run the right side effects given the right inputs.

## TODO: Default FX

Create some default effect handlers like: fetch, localStorage, sessionStorage, dispatchLater, dispatch...