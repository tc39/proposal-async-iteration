#### Runtime Semantics: EvaluateBody

With parameters _functionObject_ and List _argumentsList_.

*GeneratorBody : FunctionBody*

1. Perform ? FunctionDeclarationInstantiation(_functionObject_, _argumentsList_).
1. Let _generator_ be ? OrdinaryCreateFromConstructor(_functionObject_, `"%AsyncGeneratorPrototype%"`, « [[AsyncGeneratorState]], [[AsyncGeneratorContext]], [[AsyncGeneratorQueue]] »).
1. Perform ! AsyncGeneratorStart(_generator_, _FunctionBody_).
1. Return Completion{[[type]]: ~return~, [[value]]: _generator_, [[target]]: ~empty~}.

#### GetGeneratorContextKind

1. Let _genContext_ be the running execution context.
1. Let _generator_ be the Generator component of _genContext_.
1. If _generator_ has an [[AsyncGeneratorState]] internal slot, return ~async~.
1. Else, return ~normal~.

#### GetAsyncIterator ( _obj_ )

The abstract operation GetAsyncIterator with argument _obj_ performs the following steps:

1. Let _method_ be ? GetMethod(_obj_, @@asyncIterator).
1. If _method_ is *undefined*, let *method* be ? GetMethod(_obj_, @@iterator).
1. Let _iterator_ be ? Call(_method_, _obj_).
1. If Type(_iterator_) is not Object, throw a *TypeError* exception.
1. Return _iterator_.

#### IteratorClose( _iterator_, _completion_, _iteratorKind_ )

The abstract operation IteratorClose with arguments _iterator_ and _completion_ and optional argument _iteratorKind_ is used to notify an iterator that it should perform any actions it would normally perform when it has reached its completed state.  The value of _iteratorKind_ is either ~normal~ or ~async~.

1. Assert: Type(_iterator_) is Object.
1. Assert: _completion_ is a Completion Record.
1. If _iteratorKind_ was not passed, let _iteratorKind_ be ~normal~.
1. Let _return_ be ? GetMethod(_iterator_, `"return"`).
1. If _return_ is *undefined*, then
    1. Return Completion(_completion_).
1. Let _innerResult_ be Call(_return_, _iterator_, « »).
1. If _innerResult_ is not an abrupt completion and _iteratorKind_ is ~async~, then
    1. Let _innerResult_ be AsyncFunctionAwait(_innerResult_).
1. If _completion_.[[type]] is ~throw~, return Completion(_completion_).
1. If _innerResult_.[[type]] is ~throw~, return Completion(_innerResult_).
1. If Type(_innerResult_.[[value]]) is not Object, throw a *TypeError* exception.
1. Return Completion(_completion_).

#### AsyncGeneratorStart ( _generator_, _generatorBody_ )

The abstract operation GeneratorStart with arguments _generator_ and _generatorBody_ performs the following steps:

1. Assert: _generator_ is an AsyncGenerator instance.
1. Assert: The value of the [[AsyncGeneratorState]] internal slot of _generator_ is *undefined*.
1. Let _genContext_ be the running execution context.
1. Set the Generator component of _genContext_ to _generator_.
1. Set the code evaluation state of _genContext_ such that when evaluation is resumed for that execution context the following steps will be performed:
    1. Let _result_ be the result of evaluating _generatorBody_.
    1. Assert: If we return here, the async generator either threw an exception or performed either an implicit or explicit return.
    1. Remove _genContext_ from the execution context stack and restore the execution context that is at the top of the execution context stack as the running execution context.
    1. Set _generator_'s [[AsyncGeneratorState]] internal slot to `"completed"`.
    1. If _result_ is a normal completion, then
        1. Let _resultValue_ be *undefined*.
    1. Else,
        1. Let _resultValue_ be _result_.[[value]].
        1. If _result_.[[type]] is not ~return~, then
            1. Return ! AsyncGeneratorReject(_generator_, _resultValue_).
    1. Let _result_ be AsyncFunctionAwait(_resultValue_).
    1. Let _resultValue_ be _result_.[[value]].
    1. If _result_ is an abrupt completion, then
        1. Return ! AsyncGeneratorReject(_generator_, _resultValue_).
    1. Return ! AsyncGeneratorFulfill(_generator_, CreateIterResultObject(_resultValue_, *true*)).
1. Set _generator_'s [[AsyncGeneratorContext]] internal slot to _genContext_.
1. Set _generator_'s [[AsyncGeneratorState]] internal slot to `"suspendedStart"`.
1. Set _generator_'s [[AsyncGeneratorQueue]] internal slot to a new empty List.
1. Return *undefined*.

#### AsyncGeneratorFulfill ( _generator_, _iterationResult_ )

1. Assert: _generator_ is an AsyncGenerator instance.
1. Assert: _iterationResult_ is an Object that implements the IteratorResult interface.
1. Let _queue_ be the value of the [[AsyncGeneratorQueue]] internal slot of _generator_.
1. Remove the first element from _queue_ and let _next_ be the value of that element.
1. Let _capability_ be _next_.[[Capability]].
1. Perform ! Call(_capability_.[[Resolve]], *undefined*, « _iterationResult_ »).
1. Perform ! AsyncGeneratorResumeNext(_generator_).
1. Return *undefined*.

#### AsyncGeneratorReject ( _generator_, _exception_ )

1. Assert: _generator_ is an AsyncGenerator instance.
1. Let _queue_ be the value of the [[AsyncGeneratorQueue]] internal slot of _generator_.
1. Remove the first element from _queue_ and let _next_ be the value of that element.
1. Let _capability_ be _next_.[[Capability]].
1. Perform ! Call(_capability_.[[Reject]], *undefined*, « _exception_ »).
1. Perform ! AsyncGeneratorResumeNext(_generator_).
1. Return *undefined*.

#### AsyncGeneratorResumeNext ( _generator_ )

1. Assert: _generator_ is an AsyncGenerator instance.
1. Let _state_ be the value of _generator_'s [[AsyncGeneratorState]] internal slot.
1. Assert: _state_ is not `"executing"`.
1. Let _queue_ be the value of _generator_'s [[AsyncGeneratorQueue]] internal slot.
1. If _queue_ is an empty List, return *undefined*.
1. Let _next_ be the value of the first element of _queue_.
1. Assert: _next_ is an AsyncGeneratorRequest record.
1. Let _completion_ be _next_.[[Completion]].
1. If _completion_ is an abrupt completion, then
    1. If _state_ is `"suspendedStart"`, then
        1. Set _generator_'s [[GeneratorState]] internal slot to `"completed"`.
        1. Let _state_ be `"completed"`.
    1. If _state_ is `"completed"`, then
        1. If _completion_.[[type]] is ~return~, then
            1. Let _result_ be CreateIterResultObject(_completion_.[[value]], *true*).
            1. Return AsyncGeneratorFulfill(_generator_, _result_).
        1. Return AsyncGeneratorReject(_generator_, _completion_.[[value]]).
1. Else,
    1. If _state_ is `"completed"`, then
        1. Return AsyncGeneratorFulfill(_generator_, CreateIterResultObject(*undefined*, *true*)).
1. Assert: _state_ is either `"suspendedStart"` or `"suspendedYield"`.
1. Let _genContext_ be the value of _generator_'s [[AsyncGeneratorContext]] internal slot.
1. Let _callerContext_ be the running execution context.
1. Suspend _callerContext_.
1. Set _generator_'s [[AsyncGeneratorState]] internal slot to `"executing"`.
1. Push _genContext_ onto the execution context stack; _genContext_ is now the running execution context.
1. Resume the suspended evaluation of _genContext_ using _completion_ as the result of the operation that suspended it. Let _result_ be the completion record returned by the resumed computation.
1. Assert: _result_ is never an abrupt completion.
1. Assert: When we return here, _genContext_ has already been removed from the execution context stack and _callerContext_ is the currently running execution context.
1. Return *undefined*.

#### AsyncGeneratorRequest Records

The AsyncGeneratorRequest is a Record value used to store information about how an async generator should be resumed and contains capabilities for fulfilling or rejecting the corresponding promise.

They have the following fields:

- [[Completion]]: A Completion record.  The completion which should be used to resume the async generator.
- [[Capability]]: A PromiseCapability record.  The capabilities of the promise for which this record provides a reaction handler.

#### AsyncGeneratorEnqueue ( _generator_, _completion_ )

1. Assert: _generator_ is an AsyncGenerator instance.
1. Assert: _completion_ is a Completion Record.
1. Let _queue_ be the value of _generator_'s [[AsyncGeneratorQueue]] internal slot.
1. Let _capability_ be ! NewPromiseCapability(%Promise%).
1. Let _request_ be AsyncGeneratorRequest{[[Completion]]: _completion_, [[Capability]]: _capability_}.
1. Append _request_ to the end of _queue_.
1. Let _state_ be the value of _generator_'s [[AsyncGeneratorState]] internal slot.
1. If _state_ is not `"executing"`, then
    1. Perform ! AsyncGeneratorResumeNext(_generator_).
1. Return NormalCompletion(_capability_.[[Promise]]).

#### AsyncGeneratorYield ( _iterationResult_ )

The abstract operation AsyncGeneratorYield with argument _iterationResult_ performs the following steps:

1. Assert: _iterationResult_ is an Object that implements the IteratorResult interface.
1. Let _genContext_ be the running execution context.
1. Assert: _genContext_ is the execution context of an async generator.
1. Let _generator_ be the value of the Generator component of _genContext_.
1. Set the value of _generator_'s [[AsyncGeneratorState]] internal slot to `"suspendedYield"`.
1. Remove _genContext_ from the execution context stack and restore the execution context that is at the top of the execution context stack as the running execution context.
1. Set the code evaluation state of _genContext_ such that when evaluation is resumed with a Completion _resumptionValue_ the following steps will be performed:
    1. Return _resumptionValue_.
    1. NOTE: This returns to the evaluation of the YieldExpression production that originally called this abstract operation.
1. Perform ! AsyncGeneratorFulfill(_generator_, _iterationResult_).
1. Return *undefined*.
1. NOTE: This returns to the evaluation of the operation that had most previously resumed evaluation of _genContext_.

#### AsyncGeneratorAwaitResult ( _asyncResult_ )

1. Let _result_ be ? AsyncFunctionAwait(_asyncResult_).
1. Let _value_ be ? IteratorValue(_result_).
1. If Type(_value_) is Object, then
    1. If ? IsCallable(? Get(_value_, `"then"`)) is *true*, then
        1. Let _done_ be ? IteratorComplete(_result_).
        1. Let _value_ be ? AsyncFunctionAwait(_value_).
        1. Let _result_ be CreateIterResultObject(_value_, _done_).
1. Return _result_.

```
YieldExpression : yield
```

1. Let _resultObject_ be CreateIterResultObject(*undefined*, *false*).
1. If ! GetGeneratorContextKind() is ~async~, then
    1. TODO: For consistency, should we await here?  Kinda silly, but...
    1. Return AsyncGeneratorYield(_resultObject_).
1. Return GeneratorYield(_resultObject_).

```
YieldExpression : yield AssignmentExpression
```

1. Let _exprRef_ be the result of evaluating |AssignmentExpression|.
1. Let _value_ be ? GetValue(_exprRef_).
1. If ! GetGeneratorContextKind() is ~async~, then
    1. Let _value_ be ? AsyncFunctionAwait(_value_).
    1. Return AsyncGeneratorYield(CreateIterResultObject(_value_, *false*)).
1. Return GeneratorYield(CreateIterResultObject(_value_, *false*)).

```
yield * AssignmentExpression
```

1. Let _exprRef_ be the result of evaluating |AssignmentExpression|.
1. Let _value_ be ? GetValue(_exprRef_).
1. Let _iteratorKind_ be ! GetGeneratorContextKind().
1. If _iteratorKind_ is ~async~, let _iterator_ be ? GetAsyncIterator(_value_).
1. Else, let _iterator_ be ? GetIterator(_value_).
1. Let _received_ be NormalCompletion(*undefined*).
1. Repeat
    1. If _received_.[[type]] is ~normal~, then
        1. Let _innerResult_ be ? IteratorNext(_iterator_, _received_.[[value]]).
        1. If _iteratorKind_ is ~async~, then
            1. Let _innerResult_ be ? AsyncGeneratorAwaitResult(_innerResult_).
        1. Let _done_ be ? IteratorComplete(_innerResult_).
        1. If _done_ is *true*, then
            1. Return IteratorValue(_innerResult_).
        1. If _iteratorKind_ is ~async~, let _recieved_ be AsyncGeneratorYield(_innerResult_).
        1. Else, let _received_ be GeneratorYield(_innerResult_).
    1. Else if _received_.[[type]] is ~throw~, then
        1. Let _throw_ be ? GetMethod(_iterator_, `"throw"`).
        1. If _throw_ is not *undefined*, then
            1. Let _innerResult_ be ? Call(_throw_, _iterator_, « _received_.[[value]] »).
            1. If _iteratorKind_ is ~async~, then
                1. Let _innerResult_ be ? AsyncGeneratorAwaitResult(_innerResult_).
            1. NOTE: Exceptions from the inner iterator `throw` method are propagated. Normal completions from an inner `throw` method are processed similarly to an inner `next`.
            1. If Type(_innerResult_) is not Object, throw a *TypeError* exception.
            1. Let _done_ be ? IteratorComplete(_innerResult_).
            1. If _done_ is *true*, then
                1. Let _value_ be ? IteratorValue(_innerResult_).
                1. Return Completion{[[type]]: ~return~, [[value]]: _value_, [[target]]: ~empty~}.
            1. If _iteratorKind_ is ~async~, let _recieved_ be AsyncGeneratorYield(_innerResult_).
            1. Else, let _received_ be GeneratorYield(_innerResult_).
        1. Else,
            1. NOTE: If _iterator_ does not have a `throw` method, this throw is going to terminate the `yield*` loop. But first we need to give _iterator_ a chance to clean up.
            1. Let _closeResult_ be ? IteratorClose(_iterator_, Completion{[[type]]: ~normal~, [[value]]: ~empty~, [[target]]: ~empty~}, _iteratorKind_).
            1. NOTE: The next step throws a *TypeError* to indicate that there was a `yield*` protocol violation: _iterator_ does not have a `throw` method.
            1. Throw a *TypeError* exception.
    1. Else,
        1. Assert: _received_.[[type]] is ~return~.
        1. Let _return_ be ? GetMethod(_iterator_, `"return"`).
        1. If _return_ is *undefined*, return Completion(_received_).
        1. Let _innerReturnResult_ be ? Call(_return_, _iterator_, « _received_.[[value]] »).
        1. If _iteratorKind_ is ~async~, then
            1. Let _innerResult_ be ? AsyncGeneratorAwaitResult(_innerResult_).
        1. If Type(_innerReturnResult_) is not Object, throw a *TypeError* exception.
        1. Let _done_ be ? IteratorComplete(_innerReturnResult_).
        1. If _done_ is *true*, then
            1. Let _value_ be ? IteratorValue(_innerReturnResult_).
            1. Return Completion{[[type]]: ~return~, [[value]]: _value_, [[target]]: ~empty~}.
        1. If _iteratorKind_ is ~async~, let _recieved_ be AsyncGeneratorYield(_innerResult_).
        1. Else, let _received_ be GeneratorYield(_innerResult_).

#### AsyncGenerator Objects

An AsyncGenerator object is an instance of an async generator function and conforms to both the AsyncIterator and AsyncIterable interfaces.

AsyncGenerator instances directly inherit properties from the object that is the value of the `prototype` property of the AsyncGenerator function that created the instance. AsyncGenerator instances indirectly inherit properties from the AsyncGenerator Prototype intrinsic, %AsyncGeneratorPrototype%.

#### Properties of AsyncGenerator Prototype

The AsyncGenerator prototype object is the %AsyncGeneratorPrototype% intrinsic. It is also the initial value of the `prototype` property of the %AsyncGenerator% intrinsic (the AsyncGeneratorFunction.prototype).

The AsyncGenerator prototype is an ordinary object. It is not an AsyncGenerator instance and does not have an [[AsyncGeneratorState]] internal slot.

The value of the [[Prototype]] internal slot of the AsyncGenerator prototype object is the intrinsic object %AsyncIteratorPrototype%. The initial value of the [[Extensible]] internal slot of the AsyncGenerator prototype object is *true*.

All AsyncGenerator instances indirectly inherit properties of the AsyncGenerator prototype object.

#### AsyncGenerator.prototype.constructor

The initial value of `AsyncGenerator.prototype.constructor` is the intrinsic object %AsyncGenerator%.

This property has the attributes { [[Writable]]: *false*, [[Enumerable]]: *false*, [[Configurable]]: *true* }.

#### AsyncGenerator.prototype.next ( _value_ )

The `next` method performs the following steps:

1. Let _generator_ be the `this` value.
1. Let _completion_ be NormalCompletion(_value_).
1. Return AsyncGeneratorEnqueue(_generator_, _completion_).

#### AsyncGenerator.prototype.return ( _value_ )

The `return` method performs the following steps:

1. Let _generator_ be the `this` value.
1. Let _completion_ be Completion{[[type]]: ~return~, [[value]]: _value_, [[target]]: ~empty~}.
1. Return AsyncGeneratorEnqueue(_generator_, _completion_).

#### AsyncGenerator.prototype.throw ( _exception_ )

The `throw` method performs the following steps:

1. Let _generator_ be the `this` value.
1. Let _completion_ be Completion{[[type]]: ~throw~, [[value]]: _exception_, [[target]]: ~empty~}.
1. Return AsyncGeneratorEnqueue(_generator_, _completion_).

#### AsyncGenerator.prototype [ @@toStringTag ]

The initial value of the @@toStringTag property is the String value `"AsyncGenerator"`.

This property has the attributes { [[Writable]]: *false*, [[Enumerable]]: *false*, [[Configurable]]: *true* }.

#### Properties of AsyncGenerator Instances

AsyncGenerator instances are initially created with the internal slots described below:

- [[AsyncGeneratorState]]: The current execution state of the async generator. The possible values are: *undefined*, `"suspendedStart"`, `"suspendedYield"`, `"executing"`, and `"completed"`.
- [[AsyncGeneratorContext]]: The execution context that is used when executing the code of this async generator.
- [[AsyncGeneratorQueue]]: A List of AsyncGeneratorRequest records which represent requests to resume the async generator.

```
IterationStatement :
    for await ( ForDeclaration of AssignmentExpression ) Statement
```

1. Let _keyResult_ be the result of performing ? ForIn/OfHeadEvaluation(BoundNames of |ForDeclaration|, |AssignmentExpression|, ~async-iterate~).
1. Return ForIn/OfBodyEvaluation(|ForDeclaration|, |Statement|, _keyResult_, ~lexicalBinding~, _labelSet_, ~async~).

#### Runtime Semantics: ForIn/OfHeadEvaluation ( _TDZnames_, _expr_, _iterationKind_ ) #

The abstract operation ForIn/OfHeadEvaluation is called with arguments _TDZnames_, _expr_, _iterationKind_, and _async_. The value of _iterationKind_ is ~enumerate~, ~iterate~, or ~async-iterate~.

1. Let _oldEnv_ be the running execution context's LexicalEnvironment.
1. If _TDZnames_ is not an empty List, then
    1. Assert: _TDZnames_ has no duplicate entries.
    1. Let _TDZ_ be NewDeclarativeEnvironment(_oldEnv_).
    1. Let _TDZEnvRec_ be _TDZ_'s EnvironmentRecord.
    1. For each string _name_ in _TDZnames_, do
        1. Let _status_ be _TDZEnvRec_.CreateMutableBinding(_name_, *false*).
        1. Assert: _status_ is never an abrupt completion.
    1. Set the running execution context's LexicalEnvironment to _TDZ_.
1. Let _exprRef_ be the result of evaluating the production that is _expr_.
1. Set the running execution context's LexicalEnvironment to _oldEnv_.
1. Let _exprValue_ be ? GetValue(_exprRef_).
1. If _iterationKind_ is ~enumerate~, then
    1. If _exprValue_.[[value]] is *null* or *undefined*, then
        1. Return Completion{[[type]]: ~break~, [[value]]: ~empty~, [[target]]: ~empty~}.
    1. Let _obj_ be ToObject(_exprValue_).
    1. Return ? _obj_.[[Enumerate]]().
1. Else, if _iterationKind_ is ~async-iterate~, then
    1. Return ? GetAsyncIterator(_exprValue_).
1. Else,
    1. Assert: _iterationKind_ is ~iterate~.
    1. Return ? GetIterator(_exprValue_).

#### Runtime Semantics: ForIn/OfBodyEvaluation ( _lhs_, _stmt_, _iterator_, _lhsKind_, _labelSet_, _iteratorKind_ )

The abstract operation ForIn/OfBodyEvaluation is called with arguments _lhs_, _stmt_, _iterator_, _lhsKind_, _labelSet_, and optional argument _iteratorKind_. The value of _lhsKind_ is either ~assignment~, ~varBinding~ or ~lexicalBinding~.  The value of _iteratorKind_ is either ~normal~ or ~async~.

1. If _iteratorKind_ was not passed, let _iteratorKind_ be ~normal~.
1. Let _oldEnv_ be the running execution context's LexicalEnvironment.
1. Let _V_ be *undefined*.
1. Let _destructuring_ be IsDestructuring of _lhs_.
1. If _destructuring_ is *true* and if _lhsKind_ is ~assignment~, then
    1. Assert: _lhs_ is a |LeftHandSideExpression|.
    1. Let _assignmentPattern_ be the parse of the source text corresponding to _lhs_ using |AssignmentPattern| as the goal symbol.
1. Repeat
    1. Let _nextResult_ be ? IteratorNext(_iterator_).
    1. If _iteratorKind_ is ~async~, then
        1. Let _nextResult_ be ? AsyncGeneratorAwaitResult(_nextResult_).
    1. Let _done_ be ? IteratorComplete(_iterator_).
    1. If _done_ is *true*, return NormalCompletion(_V_).
    1. Let _nextValue_ be ? IteratorValue(_nextResult_).
    1. If _lhsKind_ is either ~assignment~ or ~varBinding~, then
        1. If _destructuring_ is *false*, then
            1. Let _lhsRef_ be the result of evaluating _lhs_ (it may be evaluated repeatedly).
    1. Else,
        1. Assert: _lhsKind_ is ~lexicalBinding~.
        1. Assert: _lhs_ is a |ForDeclaration|.
        1. Let _iterationEnv_ be NewDeclarativeEnvironment(_oldEnv_).
        1. Perform BindingInstantiation for _lhs_ passing _iterationEnv_ as the argument.
        1. Set the running execution context's LexicalEnvironment to _iterationEnv_.
        1. If _destructuring_ is *false*, then
            1. Assert: _lhs_ binds a single name.
            1. Let _lhsName_ be the sole element of BoundNames of _lhs_.
            1. Let _lhsRef_ be ResolveBinding(_lhsName_).
            1. Assert: _lhsRef_ is not an abrupt completion.
    1. If _destructuring_ is *false*, then
        1. If _lhsRef_ is an abrupt completion, then
            1. Let _status_ be _lhsRef_.
        1. Else if _lhsKind_ is ~lexicalBinding~, then
            1. Let _status_ be InitializeReferencedBinding(_lhsRef_, _nextValue_).
        1. Else,
            1. Let _status_ be PutValue(_lhsRef_, _nextValue_).
    1. Else,
        1. If _lhsKind_ is ~assignment~, then
            1. Let _status_ be the result of performing DestructuringAssignmentEvaluation of _assignmentPattern_ using _nextValue_ as the argument.
        1. Else if _lhsKind_ is ~varBinding~, then
            1. Assert: _lhs_ is a |ForBinding|.
            1. Let _status_ be the result of performing BindingInitialization for _lhs_ passing _nextValue_ and *undefined* as the arguments.
        1. Else,
            1. Assert: _lhsKind_ is ~lexicalBinding~.
            1. Assert: _lhs_ is a |ForDeclaration|.
            1. Let _status_ be the result of performing BindingInitialization for _lhs_ passing _nextValue_ and _iterationEnv_ as arguments.
    1. If _status_ is an abrupt completion, then
        1. Set the running execution context's LexicalEnvironment to _oldEnv_.
        1. Return ? IteratorClose(_iterator_, _status_, _iteratorKind_).
    1. Let _result_ be the result of evaluating _stmt_.
    1. Set the running execution context's LexicalEnvironment to _oldEnv_.
    1. If LoopContinues(_result_, _labelSet_) is *false*, return ? IteratorClose(_iterator_, UpdateEmpty(_result_, _V_), _iteratorKind_).
    1. If _result_.[[value]] is not ~empty~, let _V_ be _result_.[[value]].
