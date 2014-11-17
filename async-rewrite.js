/*

async function <Name>? <ArgumentList> <Body>

=>

function <Name>? () {

    return asyncStart(function* <ArgumentList> <Body>.apply(this, arguments));
}

*/

function asyncStart(generator) {

    return new Promise((resolve, reject) => {

        resume("next", void 0);

        function resume(type, value) {

            try {

                var result = generator[type](value);

                if (result.done) {

                    resolve(result.value);

                } else {

                    Promise.resolve(result.value).then(
                        x => resume("next", x),
                        x => resume("throw", x));
                }

            } catch (x) {

                reject(x);
            }
        }
    });
}

/*

async function * <Name>? <ArgumentList> <Body>

=>

function <Name>? () {

    return asyncGeneratorStart(function* <ArgumentList> <Body>.apply(this, arguments));
}

*/

function asyncGeneratorStart(generator) {

    let current = null,
        queue = [];

    return {

        next(value)   { return enqueue("next", value) },
        throw(value)  { return enqueue("throw", value) },
        return(value) { return enqueue("return", value) },
        [Symbol.asyncIterator]() { return this },
    };

    function enqueue(type, value) {

        return new Promise((resolve, reject) => {

            queue.push({ type, value, resolve, reject });

            if (!current)
                next();
        });
    }

    function next() {

        if (queue.length > 0) {

            current = queue.shift();
            resume(current.type, current.value);

        } else {

            current = null;
        }
    }

    function resume(type, value) {

        let result;

        try {

            result = generator[type](value);

            if (IsIterAwaitResultObject(result)) {

                Promise.resolve(result.value).then(
                    x => resume("next", x),
                    x => resume("throw", x));

                return;

            } else {

                current.resolve(result);
            }

        } catch (x) {

            current.reject(x);
        }

        next();
    }
}
