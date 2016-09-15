# Async Generator Function Rewrite

```
async function * <Name>? <ArgumentList> <Body>

=>

function <Name>? <ArgumentList> {
    return asyncGeneratorStart(function*() <Body>.apply(this, arguments));
}
```

To desugar `await` within async generator functions, we introduce the **IterAwaitResult** object. An **IterAwaitResult** is an iterator result object which is branded to indicate that it is the result of an await expression and not a yield expression. The async generator "runner" uses this brand to tell whether it should resolve the result value and continue or return the result value to the generator client.

Such an object would not be necessary in the actual specification.

```js
function asyncGeneratorStart(generator) {
  let current = null, queue = [];

  return {
    next(value) { return enqueue("next", value) },
    throw(value) { return enqueue("throw", value) },
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
  try {
    let result = generator[type](value);

    if (IsIterAwaitResultObject(result)) {
      Promise.resolve(result.value).then(
        x => resume("next", x),
        x => resume("throw", x));
      } else {
        settle(result.done ? "return" : "normal", x);
      }
    } catch (x) {
      settle("throw", x);
    }
  }
}
```
