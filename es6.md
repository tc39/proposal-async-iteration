### IteratorNext(iterator, value)

- If value was not passed,
    - Let result be Invoke(iterator, "next", ( )).
- Else,
    - Let result be Invoke(iterator, "next", (value)).
- ReturnIfAbrupt(result).
- If Type(result) is not Object, then throw a TypeError exception.
- Return result.


### IteratorStep(iterator)

- Let result be IteratorNext(iterator).
- ReturnIfAbrupt(result).
- Let done be IteratorComplete(result).
- ReturnIfAbrupt(done).
- If done is true, then return false.
- Return result.


### IteratorClose(iterator, completion)

- Assert: Type(iterator) is Object.
- Assert: completion is a Completion Record.
- Let hasReturn be HasProperty(iterator, "return").
- ReturnIfAbrupt(hasReturn).
- If hasReturn is true, then
    - Let innerResult be Invoke(iterator, "return", ( )).
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
    - Let keys be GetIterator(obj).
- If keys is an abrupt completion, then
    - If LoopContinues(keys,labelSet) is false, then return keys.
    - Assert: keys.[[type]] is continue
    - Return Completion{[[type]]: break, [[value]]: empty, [[target]]: empty}.
- Return keys.


### ForIn/OfBodyEvaluation

- Let oldEnv be the running execution context’s LexicalEnvironment.
- Let V = undefined.
- Repeat
    - Let nextResult be IteratorStep(iterator).
    - ReturnIfAbrupt(nextResult).
    - If nextResult is false, then return NormalCompletion(V).
    - Let nextValue be IteratorValue(nextResult).
    - ReturnIfAbrupt(nextValue).
    - If lhsKind is assignment, then
        - Assert: lhs is a LeftHandSideExpression.
        - If lhs is neither an ObjectLiteral nor an ArrayLiteral then
            - Let lhsRef be the result of evaluating lhs ( it may be evaluated repeatedly).
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
        - Return IteratorClose(iterator, status).
    - Let status be the result of evaluating stmt.
    - If status.[[type]] is normal and status.[[value]] is not empty, then
        - Let V = status.[[value]].
    - Set the running execution context’s LexicalEnvironment to oldEnv.
    - If LoopContinues(status, labelSet) is false, then
        - Return IteratorClose(iterator, status).


### Yield Delegation

    YieldExpression :
        yield * AssignmentExpression

- Let exprRef be the result of evaluating AssignmentExpression.
- Let value be GetValue(exprRef).
- Let iterator be GetIterator(ToObject(value)).
- Let received be NormalCompletion(undefined).
- Repeat
    - If received.[[type]] is normal, then
        - Let innerResult be IteratorNext(iterator, received.[[value]]).
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
            - NOTE: Exceptions from the inner iterator throw method are propagated.
        - Return received.
    - Else,
        - Assert: received.[[type]] is return.
        - Let hasReturn be HasProperty(iterator, "return").
        - ReturnIfAbrupt(hasReturn).
        - If hasReturn is false, then return received.
        - Let innerReturnValue be Invoke(iterator, "return", (received.[[value]])).
        - ReturnIfAbrupt(innerReturnValue).
        - If Type(innerReturnValue) is not Object, then throw a TypeError exception.
        - Let returnValue be IteratorValue(innerReturnValue).
        - ReturnIfAbrupt(returnValue).
        - Return Completion{[[type]]: return , [[value]]: returnValue , [[target]]:empty}.
