## TODO

- (Related, but not essential) Remove IteratorStep, which is weird and difficult to understand.  Replace with IteratorNext + IteratorComplete.
- ToAsyncIterator:  What are the semantics?  Can we just return a regular iterator?
- AsyncGeneratorFunctionCreate
- Update FunctionAllocate to deal with async generators
- CreateDynamicFunction
- AsyncGeneratorFunction constructor
- For ToAsyncIterator, we want to wrap the normal iterator with a custom-constructed object, similar to ListIterator in the spec.  We'll only add the "throw" and "return" methods if the underlying iterator supports them.  Within each method, we'll want to await the value component of the returned iteration result object.
