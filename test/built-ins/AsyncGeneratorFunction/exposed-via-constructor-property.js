/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Make sure %AsyncGeneratorFunction% is exposed via the
             `.constructor` property.
---*/

const AsyncGeneratorFunction = async function* () {}.constructor;
assert.sameValue(typeof AsyncGeneratorFunction, 'function');
