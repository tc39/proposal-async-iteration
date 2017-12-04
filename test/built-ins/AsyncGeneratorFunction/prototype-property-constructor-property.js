/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Check if %AsyncGeneratorFunction% function's `prototype`
             object's `constructor` property is %AsyncGeneratorFunction%
             itself
---*/

const AsyncGeneratorFunction = async function* () {}.constructor;
const AGFPrototype = AsyncGeneratorFunction.prototype;
assert.sameValue(AGFPrototype.constructor, AsyncGeneratorFunction);

verifyNotEnumerable(AGFPrototype, 'constructor');
verifyNotWritable(AGFPrototype, 'constructor');
verifyConfigurable(AGFPrototype, 'constructor');
