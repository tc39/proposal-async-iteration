/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Validate %AsyncGeneratorFunction%'s `name` property and its
             property descriptors
---*/

const AsyncGeneratorFunction = async function* () {}.constructor;
assert.sameValue(AsyncGeneratorFunction.name, 'AsyncGeneratorFunction');

verifyNotEnumerable(AsyncGeneratorFunction, 'name');
verifyNotWritable(AsyncGeneratorFunction, 'name');
verifyConfigurable(AsyncGeneratorFunction, 'name');
