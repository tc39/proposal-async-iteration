## Asynchronous Iterators for ECMAScript


### Overview and Motivation

The iterator interface (introduced in ECMAScript version 6) is a sequential data access
protocol which enables the development of generic and composable data consumers and
transformers.  Generator functions (also introduced in ECMAScript 6) provide a
convenient way to write iterator-based data sources using resumable functions.

```js
interface Iterator {
    next(value) : IteratorResult;
    [optional] throw(value) : IteratorResult;
    [optional] return(value) : IteratorResult;
}

interface IteratorResult {
    value : any;
    done : bool;
}
```

Since both the next value in the sequence and the "done" state of the data source must be
known at the time that the iterator method returns, iterators are only suitable for
representing *synchronous* data sources.  While many data sources encountered by the
Javascript programmer are synchronous (such as in-memory lists and other data structures),
many are not.  For instance, any data source which requires IO access will be typically
represented using a callback or event-based *asynchronous* API. Unfortunately, iterators
cannot be used to represent such data sources.

In order to provide a generic data access protocol for asynchronous data sources, we
introduce the **AsyncIterator** interface, an asynchronous iteration statement, and
async generator functions.

### The AsyncIterator Interface

The **AsyncIterator** interface is identical to the **Iterator** interface, except that
each of the iterator methods returns a promise for an iterator result pair.

*NOTE: We must return a promise for the `{next, done}` pair because both the next value
and the "done" state of the iterator are potentially unknown at the time the iterator
method returns.*

```js
interface AsyncIterator {
    next(value) : Promise<IteratorResult>;
    [optional] throw(value) : Promise<IteratorResult>;
    [optional] return(value) : Promise<IteratorResult>;
}
```

For example:

```js
asyncIterator.next().then(value => console.log(value));
```

Furthermore, we introduce a new symbol used for obtaining an async iterator from a given
object.

```js
interface AsyncIterable {
    [Symbol.asyncIterator]() : AsyncIterator
}
```

Implicit in the concept of the async iterator is the concept of a **request queue**.
Since iterator methods may be called many times before the result of a prior request is
resolved, each method call must be queued internally until all previous request operations
have completed.


### The Async Iteration Statement

We introduce a variation of the `for-of` iteration statement which iterates over
**AsyncIterator** objects.

```
IterationStatement :
    for await ( LeftHandSideExpression of AssignmentExpression ) Statement

IterationStatement :
    for await ( var ForBinding of AssignmentExpression ) Statement

IterationStatement :
    for await ( ForDeclaration of AssignmentExpression ) Statement
```

For example:

```js
for await (let line of readLines(filePath)) {
    print(line);
}
```

Async for-of statements are only allowed within async functions and async generator
functions.

During execution, an async iterator is created from the data source using the
**Symbol.asyncIterator** method.

Each time we access the next value in the sequence, we implicitly **await** the promise
returned from the iterator method.

### Async Generator Functions

Async generator functions are similar to generator functions, with the following
differences:

- When called, async generator functions return an object implementing the
  *AsyncIterator* interface.
- Await expressions and for-await statements are allowed.
- Yielded promises are implicitly unwrapped before they are packed into an *IteratorResult* object.
- The behavior of `yield*` is modified to support delegation to async iterators.

For example:

```js
async function *readLines(path) {

    let file = await fileOpen(path);

    try {

        while (!file.EOF)
            yield file.readLine();

    } finally {

        await file.close();
    }
}
```

### Async Generator Function Rewrite

```
async function * <Name>? <ArgumentList> <Body>

=>

function <Name>? <ArgumentList> {

    return asyncGeneratorStart(function*() <Body>.apply(this, arguments));
}
```

To desugar `await` within async generator functions, we introduce the **IterAwaitResult**
object. An **IterAwaitResult** is an iterator result object which is branded to indicate
that it is the result of an await expression and not a yield expression.  The async
generator "runner" uses this brand to tell whether it should resolve the result value and
continue or return the result value to the generator client.

Such an object would not be necessary in the actual specification.

```js
function asyncGeneratorStart(generator) {

    let current = null,
        queue = [];

    return {

        next(value)   { return enqueue("next", value) },
        throw(value)  { return enqueue("throw", value) },
        return(value) { return enqueue("return", value) },
        [Symbol.asyncIterator]() { return this },
    };

    function enqueue(type, value) {

        return new Promise((resolve, reject) => {

            queue.push({ type, value, resolve, reject });
            next();
        });
    }

    function next() {

        if (current || queue.length === 0)
            return;

        current = queue.shift();
        resume(current.type, current.value);
    }

    function settle(type, value) {

        let capability = current;
        current = null;

        switch (type) {

             case "throw":
                capability.reject(value);
                break;

            case "return":
                capability.resolve({ value, done: true });
                break;

            default:
                capability.resolve({ value, done: false });
                break;
        }

        next();
    }

    function resume(type, value) {

        let result;

        try {

            result = generator[type](value);

            if (IsIterAwaitResultObject(result)) {

                Promise.resolve(result.value).then(
                    x => resume("next", x),
                    x => resume("throw", x));

            } else {

                Promise.resolve(result.value).then(
                    x => settle(result.done ? "return" : "normal", x),
                    x => settle("throw", x));
            }

        } catch (x) {

            settle("throw", x);
        }
    }
}
```

### Implementation Status

The [Regenerator](https://github.com/facebook/regenerator) project provides a working [polyfill](https://github.com/facebook/regenerator/blob/f87d654f85c9925c4db3f74806f7615a71297f40/runtime.js#L136) for the `AsyncIterator` interface and transforms `async` generator functions into plain ECMAScript 5 functions that return `AsyncIterator` objects: [examples](https://github.com/facebook/regenerator/blob/f87d654f85c9925c4db3f74806f7615a71297f40/test/async.es6.js#L259).

Note that Regenerator does not yet support the `for await`-`of` async iteration statement syntax.
