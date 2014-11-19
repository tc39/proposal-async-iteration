## Asynchronous Iterators for ECMAScript


### Overview and Motivation

The iterator interface (introduced in ECMAScript version 6) is a sequential data access
protocol which enables the development of generic and composable data consumers and
transformers.  Generator functions (also introduced in ECMAScript 6) provide a
convenient way to write iterator-based data sources using resumable functions.

```
interface Iterator {
    IteratorResult next(value);
    [optional] IteratorResult throw(value);
    [optional] IteratorResult return(value);
}

interface IteratorResult {
    any value;
    bool done;
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

A prototype of this proposal is available in the [esdown online REPL](http://esparse.org/esdown/repl/).

[ES Specification Changes](es7.md)


### The AsyncIterator Interface

The **AsyncIterator** interface is identical to the **Iterator** interface, except that
each of the iterator methods returns a promise for an iterator result pair.

*NOTE: We must return a promise for the `{next, done}` pair because both the next value
and the "done" state of the iterator are potentially unknown at the time the iterator
method returns.*

```
interface AsyncIterator {
    Promise<IteratorResult> next(value);
    [optional] Promise<IteratorResult> throw(value);
    [optional] Promise<IteratorResult> return(value);
}
```

For example:

```js
asyncIterator.next().then(value => console.log(value));
```

Furthermore, we introduce a new symbol used for obtaining an async iterator from a given
object.

```
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
    for async ( LeftHandSideExpression of AssignmentExpression ) Statement

IterationStatement :
    for async ( var ForBinding of AssignmentExpression ) Statement

IterationStatement :
    for async ( ForDeclaration of AssignmentExpression ) Statement
```

For example:

```js
for async (let line of readLines(filePath)) {
    print(line);
}
```

Async for-of statements are only allowed within async functions and async generator
functions.

During execution, an async iterator is created from the data source using the
**Symbol.asyncIterator** method.  If the data source object does not have such a method,
but does have a **Symbol.iterator** method, then a synchronous iterator is created and
then converted to an async iterator.

Each time we access the next value in the sequence, we implicitly **await** the promise
returned from the iterator method.


### Async Generator Functions

Async generator functions are similar to generator functions, with the following
differences:

- When called, async generator functions return an object implementing the
  **AsyncIterator** interface.
- Await expressions and async for-of statements are allowed.
- The behavior of `yield *` is modified to support delegation to async iterators.

For example:

```js
async function *readLines(path) {

    let file = await fileOpen(path);

    try {

        while (!file.EOF)
            yield await file.readLine();

    } finally {

        await file.close();
    }
}
```

To implement `await` within async generator functions, we introduce the
**IterAwaitResult** object. An **IterAwaitResult** is an iterator result object which is
branded to indicate that it is the result of an await expression and not a yield
expression.  The async generator "runner" uses this brand to tell whether it should
resolve the result value and continue or return the result value to the generator client.

### Async Generator Function Rewrite

```
async function * <Name>? <ArgumentList> <Body>

=>

function <Name>? <ArgumentList> {

    return asyncGeneratorStart(function*() <Body>.apply(this, arguments));
}
```

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

            if (!current)
                next();
        });
    }

    function next() {

        if (queue.length > 0) {

            current = queue.shift();
            resume(current.type, current.value);

        } else {

            current = null;
        }
    }

    function resume(type, value) {

        let result;

        try {

            result = generator[type](value);

            if (IsIterAwaitResultObject(result)) {

                Promise.resolve(result.value).then(
                    x => resume("next", x),
                    x => resume("throw", x));

                return;

            } else {

                current.resolve(result);
            }

        } catch (x) {

            current.reject(x);
        }

        next();
    }
}
```
