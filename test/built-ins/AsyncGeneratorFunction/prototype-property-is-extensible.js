/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Check if %AsyncGeneratorFunction% function's `prototype` object
             is extensible, by adding and removing properties to it.
---*/

const AGFPrototype = async function* () {}.constructor.prototype;
AGFPrototype.testProperty = 'thefourtheye';

assert.sameValue(AGFPrototype.testProperty, 'thefourtheye');
assert(delete AGFPrototype.testProperty);
