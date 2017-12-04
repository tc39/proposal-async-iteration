/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Check if %AsyncGeneratorFunction% function is extensible, by
             adding and removing properties to it.
---*/

const AsyncGeneratorFunction = async function* () {}.constructor;
AsyncGeneratorFunction.testProperty = 'thefourtheye';

assert.sameValue(AsyncGeneratorFunction.testProperty, 'thefourtheye');
assert(delete AsyncGeneratorFunction.testProperty);
