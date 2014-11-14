### IteratorNext(iterator, value, isAsync)

- If value was not passed,
    - Let result be Invoke(iterator, "next", ( )).
- Else,
    - Let result be Invoke(iterator, "next", (value)).
- ReturnIfAbrupt(result).
- If isAsync is true, then
    - Let result be GeneratorYield(CreateIterAwaitResultObject(result)).
    - ReturnIfAbrupt(result).
- If Type(result) is not Object, then throw a TypeError exception.
- Return result.


### IteratorStep(iterator, isAsync)

- Let result be IteratorNext(iterator, isAsync).
- ReturnIfAbrupt(result).
- Let done be IteratorComplete(result).
- ReturnIfAbrupt(done).
- If done is true, then return false.
- Return result.


### IteratorClose(iterator, completion, isAsync)

- Assert: Type(iterator) is Object.
- Assert: completion is a Completion Record.
- Let hasReturn be HasProperty(iterator, "return").
- ReturnIfAbrupt(hasReturn).
- If hasReturn is true, then
    - Let innerResult be Invoke(iterator, "return", ( )).
    - If isAsync is true and innerResult.[[type]] is normal, then
        - Let innerResult be GeneratorYield(CreateIterAwaitResultObject(innerResult)).
    - If completion.[[type]] is not throw and innerResult.[[type]] is throw, then
        - Return innerResult.
- Return completion.


### ForIn/OfExpressionEvaluation

- Let oldEnv be the running execution context’s LexicalEnvironment.
- If TDZnames is not an empty List, then
    - Assert: TDZnames has no duplicate entries.
    - Let TDZ be NewDeclarativeEnvironment(oldEnv).
    - For each string name in TDZnames, do
        - Let status be the result of calling TDZ’s CreateMutableBinding concrete method passing name and false as the arguments.
        - Assert: status is never an abrupt completion.
    - Set the running execution context’s LexicalEnvironment to TDZ.
- Let exprRef be the result of evaluating the production that is expr.
- Set the running execution context’s LexicalEnvironment to oldEnv.
- Let exprValue be GetValue(exprRef).
- If exprValue is an abrupt completion,
    - If LoopContinues(exprValue,labelSet) is false, then return exprValue.
    - Else, return Completion{[[type]]: break, [[value]]: empty, [[target]]: empty}.
- If iterationKind is enumerate, then
    - If exprValue.[[value]] is null or undefined, then
        - Return Completion{[[type]]: break, [[value]]: empty, [[target]]: empty}.
- Let obj be ToObject(exprValue).
- If iterationKind is enumerate, then
    - Let keys be the result of calling the [[Enumerate]] internal method of obj with no arguments.
- Else,
    - Assert: iterationKind is iterate.
    - If isAsync is true, let keys be GetAsyncIterator(obj)
    - Else let keys be GetIterator(obj).
- If keys is an abrupt completion, then
    - If LoopContinues(keys,labelSet) is false, then return keys.
    - Assert: keys.[[type]] is continue
    - Return Completion{[[type]]: break, [[value]]: empty, [[target]]: empty}.
- Return keys.


### ForIn/OfBodyEvaluation

- Let oldEnv be the running execution context’s LexicalEnvironment.
- Let V = undefined.
- Repeat
    - Let nextResult be IteratorStep(iterator, isAsync).
    - ReturnIfAbrupt(nextResult).
    - If nextResult is false, then return NormalCompletion(V).
    - Let nextValue be IteratorValue(nextResult).
    - ReturnIfAbrupt(nextValue).
    - If lhsKind is assignment, then
        - Assert: lhs is a LeftHandSideExpression.
        - If lhs is neither an ObjectLiteral nor an ArrayLiteral then
            - Let lhsRef be the result of evaluating lhs (it may be evaluated repeatedly).
            - Let status be PutValue(lhsRef, nextValue).
        - Else
            - Let assignmentPattern be the parse of the source code corresponding to lhs using AssignmentPattern as the goal symbol.
            - Let nextValueObject be ToObject(nextValue).
            - ReturnIfAbrupt(nextValueObject).
            - Let status be the result of performing DestructuringAssignmentEvaluation of assignmentPattern using nextValueObject as the argument.
    - Else if lhsKind is varBinding, then
        - Assert: lhs is a ForBinding.
        - Let status be the result of performing BindingInitialization for lhs passing nextValue and undefined as the arguments.
    - Else,
        - Assert: lhsKind is lexicalBinding.
        - Assert: lhs is a ForDeclaration.
        - Let iterationEnv be NewDeclarativeEnvironment(oldEnv).
        - Set the running execution context’s LexicalEnvironment to iterationEnv.
        - Let status be the result of performing BindingInstantiation for lhs passing nextValue and iterationEnv as arguments.
    - If status is an abrupt completion, then
        - Set the running execution context’s LexicalEnvironment to oldEnv.
        - Return IteratorClose(iterator, status, isAsync).
    - Let status be the result of evaluating stmt.
    - If status.[[type]] is normal and status.[[value]] is not empty, then
        - Let V = status.[[value]].
    - Set the running execution context’s LexicalEnvironment to oldEnv.
    - If LoopContinues(status, labelSet) is false, then
        - Return IteratorClose(iterator, status, isAsync).


### Yield Delegation

    YieldExpression :
        yield * AssignmentExpression

- Let exprRef be the result of evaluating AssignmentExpression.
- Let value be GetValue(exprRef).
- If isAsync is true, then let iterator be GetAsyncIterator(ToObject(value)).
- Else, let iterator be GetIterator(ToObject(value)).
- Let received be NormalCompletion(undefined).
- Repeat
    - If received.[[type]] is normal, then
        - Let innerResult be IteratorNext(iterator, received.[[value]], isAsync).
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
            - If isAsync is true, then
                - Let innerResult be GeneratorYield(CreateIterAwaitResultObject(innerResult)).
                - ReturnIfAbrupt(innerResult).
                - If Type(innerResult) is not Object, then throw a TypeError exception.
            - NOTE: Exceptions from the inner iterator throw method are propagated.
        - Return received.
    - Else,
        - Assert: received.[[type]] is return.
        - Let hasReturn be HasProperty(iterator, "return").
        - ReturnIfAbrupt(hasReturn).
        - If hasReturn is false, then return received.
        - Let innerReturnValue be Invoke(iterator, "return", (received.[[value]])).
        - ReturnIfAbrupt(innerReturnValue).
        - If isAsync is true, then
            - Let innerReturnValue be GeneratorYield(CreateIterAwaitResultObject(innerReturnValue)).
            - ReturnIfAbrupt(innerReturnValue).
        - If Type(innerReturnValue) is not Object, then throw a TypeError exception.
        - Let returnValue be IteratorValue(innerReturnValue).
        - ReturnIfAbrupt(returnValue).
        - Return Completion{[[type]]: return , [[value]]: returnValue , [[target]]:empty}.


### IsIterAwaitResultObject(x)

- If Type(x) is not Object, return false.
- If x does not have a [[AwaitResultBrand]] internal slot, return false.
- Return true.


### CreateIterAwaitResultObject(value)

- Let obj be ObjectCreate(%ObjectPrototype%, ([[AwaitResultBrand]])).
- Perform CreateDataProperty(obj, "value", value).
- Perform CreateDataProperty(obj, "done", false).
- Return obj.


### CheckAsyncIterable(obj)

- If Type(obj) is not Object, then return undefined.
- Return Get(obj, @@asyncIterator).


### GetAsyncIterator(obj, method)

- ReturnIfAbrupt(obj).
- If method was not passed, then
    - Let method be CheckAsyncIterable(obj).
    - ReturnIfAbrupt(method).
    - If method is undefined, then
        - Let iterator be GetIterator(obj).
        - return CreateWrappedAsyncIterator(iterator).
- If IsCallable(method) is false, then throw a TypeError exception.
- Let iterator be the result of calling the [[Call]] internal method of method with obj as thisArgument and an empty List as argumentsList.
- ReturnIfAbrupt(iterator).
- If Type(iterator) is not Object, then throw a TypeError exception.
- Return iterator.


### WrappedAsyncIteratorMethod Functions

A WrappedAsyncIteratorMethod function is an anonymous built-in function with [[Inner]] and [[Method]]
internal slots.

When a WrappedAsyncIteratorMethod function F is called with argument value the following steps are taken:

- Assert: F has a [[Inner]] internal slot.
- Assert: F has a [[Method]] internal slot.
- Let resultValue be the result of calling the [[Call]] internal method of [[Method]], with [[Inner]] as thisArgument and (value) as argumentList.
- If resultValue is an abrupt completion, then
    - return Invoke(Promise, "reject", resultValue.[[value]]).
- return Invoke(Promise, "resolve", resultValue.[[value]]).


### CreateWrappedAsyncIteratorMethod(inner, name)

- Let method be Get(inner, name).
- ReturnIfAbrupt(method).
- If IsCallable(method) is false, then return false.
- Let asyncMethod be new built-in function object as defined in WrappedAsyncIteratorMethod.
- Set the [[Inner]] internal slot of asyncMethod to inner.
- Set the [[Method]] internal slot of asyncMethod to method.
- return asyncMethod.


### CreateWrappedAsyncIterator(inner)

- Let iterator be ObjectCreate(%AsyncIteratorPrototype%, [[InnerIterator]]).
- Let method be CreateWrappedAsyncIteratorMethod(inner, "next").
- ReturnIfAbrupt(method).
- If method is not false, then
    - Let status be the result of CreateDataProperty(iterator, "next", method).
- Let method be CreateWrappedAsyncIteratorMethod(inner, "throw").
- ReturnIfAbrupt(method).
- If method is not false, then
    - Let status be the result of CreateDataProperty(iterator, "throw", method).
- Let method be CreateWrappedAsyncIteratorMethod(inner, "return").
- ReturnIfAbrupt(method).
- If method is not false, then
    - Let status be the result of CreateDataProperty(iterator, "return", method).


### The %AsyncIteratorPrototype% Object


### %AsyncIteratorPrototype% \[@@asyncIterator\] ()

- Return the this value.


### Await Expressions

    UnaryExpression :
        await UnaryExpression

- Let exprRef be the result of evaluating UnaryExpression.
- Let value be GetValue(exprRef).
- ReturnIfAbrupt(value).
- Return GeneratorYield(CreateIterAwaitResultObject(value)).
