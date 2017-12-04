# Asynchronous Iterators for JavaScript

## Overview and motivation

The iterator interface (introduced in ECMAScript 2015) is a sequential data access protocol which enables the development of generic and composable data consumers and transformers. Their primary interface is a `next()` method which returns a `{ value, done }` tuple, where `done` is a boolean indicating whether the end of the iterator has been reached, and `value` is the yielded value in the sequence.

Since both the next value in the sequence and the "done" state of the data source must be known at the time that the iterator method returns, iterators are only suitable for representing *synchronous* data sources. While many data sources encountered by the JavaScript programmer are synchronous (such as in-memory lists and other data structures), many others are not. For instance, any data source which requires I/O access will be typically represented using an event-based or streaming *asynchronous* API. Unfortunately, iterators cannot be used to represent such data sources.

(Even an iterator of promises is not sufficient, since that only allows asynchronous determination of the value, but requires synchronous determination of the "done" state.)

In order to provide a generic data access protocol for asynchronous data sources, we introduce the **AsyncIterator** interface, an asynchronous iteration statement (`for`-`await`-`of`), and async generator functions.

## Async iterators and async iterables

An async iterator is much like an iterator, except that its `next()` method returns a promise for a `{ value, done }` pair. As noted above, we must return a promise for the iterator result pair because both the next value and the "done" state of the iterator are potentially unknown at the time the iterator method returns.

```js
const { value, done } = syncIterator.next();

asyncIterator.next().then(({ value, done }) => /* ... */);
```

Furthermore, we introduce a new symbol used for obtaining an async iterator from a given object, `Symbol.asyncIterator`. This allows arbitrary objects to advertise that they are _async iterables_, similar to how `Symbol.iterator` allows you to advertise being a normal, synchronous iterable. An example of a class that might use this is a [readable stream](https://streams.spec.whatwg.org/#rs-class).

Implicit in the concept of the async iterator is the concept of a **request queue**. Since iterator methods may be called many times before the result of a prior request is resolved, each method call must be queued internally until all previous request operations have completed.

## The async iteration statement: `for`-`await`-`of`

We introduce a variation of the `for-of` iteration statement which iterates over async iterable objects. An example usage would be:

```js
for await (const line of readLines(filePath)) {
  console.log(line);
}
```

Async for-of statements are only allowed within async functions and async generator functions (see below for the latter).

During execution, an async iterator is created from the data source using the `[Symbol.asyncIterator]()` method.

Each time we access the next value in the sequence, we implicitly `await` the promise returned from the iterator method.

## Async generator functions

Async generator functions are similar to generator functions, with the following differences:

- When called, async generator functions return an object, an _async generator_ whose methods (`next`, `throw`, and `return`) return promises for `{ value, done }`, instead of directly returning `{ value, done }`. This automatically makes the returned async generator objects _async iterators_.
- `await` expressions and `for`-`await`-`of` statements are allowed.
- The behavior of `yield*` is modified to support delegation to async iterables.

For example:

```js
async function* readLines(path) {
  let file = await fileOpen(path);

  try {
    while (!file.EOF) {
      yield await file.readLine();
    }
  } finally {
    await file.close();
  }
}
```

This function then returns an async generator object, which can be consumed with `for`-`await`-`of` as shown in the previous example.

## Implementation Status

### Native implementations

- Chakra: [outstanding issue](https://github.com/Microsoft/ChakraCore/issues/2720)
- JavaScriptCore: [shipping in Safari Tech Preview 40](https://github.com/tc39/proposal-async-iteration/issues/63#issuecomment-330929480)
- SpiderMonkey: [shipping in Firefox 57](https://github.com/tc39/proposal-async-iteration/issues/63#issuecomment-330978069); [launch bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1352312)
- V8: [shipping in Chrome 63](https://blog.chromium.org/2017/10/chrome-63-beta-dynamic-module-imports_27.html); [launch bug](https://crbug.com/v8/5855)

### Polyfills/transpilers

The [Regenerator](https://github.com/facebook/regenerator) project provides a working [polyfill](https://github.com/facebook/regenerator/blob/f87d654f85c9925c4db3f74806f7615a71297f40/runtime.js#L136) for the `AsyncIterator` interface and transforms `async` generator functions into plain ECMAScript 5 functions that return `AsyncIterator` objects: [examples](https://github.com/facebook/regenerator/blob/f87d654f85c9925c4db3f74806f7615a71297f40/test/async.es6.js#L259). Regenerator does not yet support the `for await`-`of` async iteration statement syntax.

The [Babylon parser](https://github.com/babel/babel/tree/master/packages/babylon) project supports parsing async generator functions and `for`-`await`-`of` statements (since v6.8.0). You can use it with the [`asyncGenerators` plugin](https://github.com/babel/babel/tree/master/packages/babylon#plugins).

```js
require("babylon").parse("code", {
  sourceType: "module",
  plugins: [
    "asyncGenerators"
  ]
});
```

Additionally, as of 6.16.0, async iteration is included in [Babel](https://babeljs.io/) under the the name [`"babel-plugin-transform-async-generator-functions"`](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-async-generator-functions) as well as with [`babel-preset-stage-3`](http://babeljs.io/docs/plugins/preset-stage-3/). Note that the semantics implemented there are slightly out of date compared to the current spec text in various edge cases.

```js
require("babel-core").transform("code", {
  plugins: [
    "transform-async-generator-functions"
  ]
});
```
