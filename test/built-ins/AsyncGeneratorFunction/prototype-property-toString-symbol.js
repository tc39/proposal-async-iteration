/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Check if %AsyncGeneratorFunction% function's `prototype`
             object's `Symbol.toStringTag` property is
             'AsyncGeneratorFunction'
---*/

const AsyncGeneratorFunction = async function* () {}.constructor;
const AGFPrototype = AsyncGeneratorFunction.prototype;

assert.sameValue(AGFPrototype[Symbol.toStringTag], 'AsyncGeneratorFunction');

verifyNotEnumerable(AGFPrototype, Symbol.toStringTag);
verifyNotWritable(AGFPrototype, Symbol.toStringTag);
verifyConfigurable(AGFPrototype, Symbol.toStringTag);
