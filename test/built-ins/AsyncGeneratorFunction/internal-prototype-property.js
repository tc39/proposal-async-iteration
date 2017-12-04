/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Check if %AsyncGeneratorFunction% function derives from
             `Function` object.
---*/

async function* foo() {};
const AsyncGeneratorFunction = async function* () {}.constructor;

assert.sameValue(Object.getPrototypeOf(AsyncGeneratorFunction), Function);
assert.sameValue(
  Object.getPrototypeOf(AsyncGeneratorFunction.prototype),
  Function.prototype
);
assert(foo instanceof Function);
