/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Validate %AsyncGeneratorFunction%'s `length` property and its
             property descriptors
---*/

const AsyncGeneratorFunction = async function* () {}.constructor;
assert.sameValue(AsyncGeneratorFunction.length, 1);

verifyNotEnumerable(AsyncGeneratorFunction, 'length');
verifyNotWritable(AsyncGeneratorFunction, 'length');
verifyConfigurable(AsyncGeneratorFunction, 'length');
