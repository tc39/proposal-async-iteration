/*---
author: Sakthipriyan Vairamani (thefourtheye) <thechargingvolcano@gmail.com>
description: Validate %AsyncGeneratorFunction% function's prototype
             property.
---*/

const AsyncGeneratorFunction = async function* () {}.constructor;

verifyNotEnumerable(AsyncGeneratorFunction, 'prototype');
verifyNotWritable(AsyncGeneratorFunction, 'prototype');
verifyNotConfigurable(AsyncGeneratorFunction, 'prototype');
