    async function * <Name>? <ArgumentList> <Body>

    =>

    function <Name>? <ArgumentList> {

        return asyncGen(function*() <Body>.apply(this, arguments));
    }

    UnaryExpression :
        await UnaryExpression

- Let exprRef be the result of evaluating UnaryExpression.
- Let value be GetValue(exprRef).
- ReturnIfAbrupt(value).
- Return GeneratorYield(CreateIterAwaitObject(value)).

    YieldExpression:
        yield * AssignmentExpression

- Let exprRef be the result of evaluating AssignmentExpression.
- Let value be GetValue(exprRef).
- If context is "async", then
  - Let iterator be GetAsyncIterator(ToObject(value)).
- Else
  - Let iterator be GetIterator(ToObject(value)).
- ReturnIfAbrupt(iterator).
- Let received be NormalCompletion(undefined).
- Repeat
  - If received.[[type]] is normal, then
    - Let innerResult be IteratorNext(iterator, received.[[value]]).
    - ReturnIfAbrupt(innerResult).
    - If context is "async", then
      - Let innerResult be GeneratorYield(CreateIterAwaitObject(innerResult)).
      - ReturnIfAbrupt(innerResult).
    - Let done be IteratorComplete(innerResult).
    - ReturnIfAbrupt(done).
    - If done is true, then
      - Return IteratorValue (innerResult).
    - Let received be GeneratorYield(innerResult).
  - Else if received.[[type]] is throw, then
    - Let hasThrow be HasProperty(iterator, "throw").
    - ReturnIfAbrupt(hasThrow).
    - If hasThrow is true, then
      - Let innerResult be Invoke(iterator, "throw", (received.[[value]])).
      - ReturnIfAbrupt(innerResult).
      - If context is "async", then
        - Let innerResult be GeneratorYield(CreateIterAwaitObject(innerResult)).
        - ReturnIfAbrupt(innerResult).
      - NOTE: Exceptions from the inner iterator throw method are propagated.
    - Return received.
  - Else,
    - Assert: received.[[type]] is return.
    - Let hasReturn be HasProperty(iterator, "return").
    - ReturnIfAbrupt(hasReturn).
    - If hasReturn is false, then return received.
    - Let innerReturnValue be Invoke(iterator, "return", (received.[[value]])).
    - ReturnIfAbrupt(innerReturnValue).
    - If context is "async", then
      - Let innerReturnValue be GeneratorYield(CreateIterAwaitObject(innerReturnValue)).
      - ReturnIfAbrupt(innerReturnValue).
    - If Type(innerReturnValue) is not Object, then throw a TypeError exception.
    - Let returnValue be IteratorValue(innerReturnValue).
    - ReturnIfAbrupt(returnValue).
    - Return Completion{[[type]]: return , [[value]]: returnValue , [[target]]:empty}.



function asyncGen(generator) {

    let state = "paused",
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

            if (state === "paused")
                next();
        });
    }

    function next() {

        if (queue.length > 0) {

            state = "running";
            let first = queue[0];
            resume(first.type, first.value);

        } else {

            state = "paused";
        }
    }

    function resume(type, value) {

        let result;

        try {

            result = generator[type](value);

        } catch (x) {

            queue.shift().reject(x);
            next();
            return;
        }

        if (IsIterAwaitObject(result)) {

            Promise.resolve(result.value).then(
                x => resume("next", x),
                x => resume("throw", x));

        } else {

            queue.shift().resolve(result);
            next();
        }
    }
}
