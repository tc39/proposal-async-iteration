/*

async function * <Name>? <ArgumentList> <Body>

=>

function <Name>? <ArgumentList> {

    return asyncGeneratorStart(function*() <Body>.apply(this, arguments));
}

*/

function asyncGeneratorStart(generator) {

    let state = "paused",
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

            if (state === "paused")
                next();
        });
    }

    function next() {

        if (queue.length > 0) {

            state = "running";
            let first = queue[0];
            resume(first.type, first.value);

        } else {

            state = "paused";
        }
    }

    function resume(type, value) {

        let result;

        try {

            result = generator[type](value);

        } catch (x) {

            queue.shift().reject(x);
            next();
            return;
        }

        if (IsIterAwaitResultObject(result)) {

            Promise.resolve(result.value).then(
                x => resume("next", x),
                x => resume("throw", x));

        } else {

            queue.shift().resolve(result);
            next();
        }
    }
}
