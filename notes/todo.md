## TODO

- (Related, but not essential) Remove IteratorStep, which is weird and difficult to understand.  Replace with IteratorNext + IteratorComplete.
- CreateDynamicFunction
- Refactoring of \*FunctionCreate abstract operations.  In general, the function "kind" stuff is convoluted and confusing and needs a good wipe down.
- Look for ways to reduce the duplication between the runtime semantics for async generators and regular generators.  This might be a bigger project involving regular functions as well.
- Introductory text.
