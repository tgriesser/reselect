function defaultValuesEqual(a, b) {
    return a === b;
}
function isPlainObject(obj) {
    return obj && (obj.constructor === Object || obj.constructor === undefined);
}

const values = (obj, keys) => keys.map(key => obj[key]);

const objectFn = keys => {
    return (...args) => {
        return keys.reduce((val, key, i) => {
            val[key] = args[i];
            return val;
        }, {});
    };
}

// TODO: Reintroduce comment about cache size, slightly rewritten
export function defaultMemoize(func, valuesEqual = defaultValuesEqual) {
    let lastArgs = null;
    let lastResult = null;
    return (...args) => {
        if (lastArgs !== null &&
            args.every((value, index) => valuesEqual(value, lastArgs[index]))) {
            return lastResult;
        }
        lastArgs = args;
        lastResult = func(...args);
        return lastResult;
    };
}

export function createSelectorCreator(memoize, ...memoizeOptions) {
    return (...funcs) => {
        let recomputations = 0;
        const objectKeys = isPlainObject(funcs[0]) ? Object.keys(funcs[0]) : undefined;
        const resultFunc = objectKeys ? objectFn(objectKeys) : funcs.pop();
        const dependencies = objectKeys ? values(funcs[0], objectKeys) : Array.isArray(funcs[0]) ? funcs[0] : funcs;

        const memoizedResultFunc = memoize(
            (...args) => {
                recomputations++;
                return resultFunc(...args);
            },
            ...memoizeOptions
        );

        const selector = (state, props, ...args) => {
            const params = dependencies.map(
                dependency => dependency(state, props, ...args)
            );
            return memoizedResultFunc(...params);
        };

        selector.recomputations = () => recomputations;
        return selector;
    };
}

export function createSelector(...args) {
    return createSelectorCreator(defaultMemoize)(...args);
}
