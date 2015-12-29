## TODO

- (Related, but not essential) Remove IteratorStep, which is weird and difficult to understand.  Replace with IteratorNext + IteratorComplete.
- ToAsyncIterator
- AsyncGeneratorFunctionCreate
- Update FunctionAllocate to deal with async generators
- CreateDynamicFunction
- AsyncGeneratorFunction constructor
- Wrapped normal iterators should probably unwrap the result value, if it's a promise.  If so, then what happens if there is another request before the original one has completed?  Maybe the resulting object needs to be a full-on AsyncGenerator instance.  If so, we'll need to invent spec techniques for describing that.
