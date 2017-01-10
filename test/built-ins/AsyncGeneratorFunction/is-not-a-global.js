/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Make sure %AsyncGeneratorFunction% is not a global function
---*/

assert.throws(ReferenceError, function() {
  AsyncGeneratorFunction
}, 'AsyncGeneratorFunction should not be available in global scope');
