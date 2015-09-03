"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.defaultMemoize = defaultMemoize;
exports.createSelectorCreator = createSelectorCreator;
exports.createSelector = createSelector;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function defaultValuesEqual(a, b) {
    return a === b;
}
function isPlainObject(obj) {
    return obj && (obj.constructor === Object || obj.constructor === undefined);
}

var values = function values(obj, keys) {
    return keys.map(function (key) {
        return obj[key];
    });
};

var objectFn = function objectFn(keys) {
    return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return keys.reduce(function (val, key, i) {
            val[key] = args[i];
            return val;
        }, {});
    };
};

// TODO: Reintroduce comment about cache size, slightly rewritten

function defaultMemoize(func) {
    var valuesEqual = arguments.length <= 1 || arguments[1] === undefined ? defaultValuesEqual : arguments[1];

    var lastArgs = null;
    var lastResult = null;
    return function () {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        if (lastArgs !== null && args.every(function (value, index) {
            return valuesEqual(value, lastArgs[index]);
        })) {
            return lastResult;
        }
        lastArgs = args;
        lastResult = func.apply(undefined, args);
        return lastResult;
    };
}

function createSelectorCreator(memoize) {
    for (var _len3 = arguments.length, memoizeOptions = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        memoizeOptions[_key3 - 1] = arguments[_key3];
    }

    return function () {
        for (var _len4 = arguments.length, funcs = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            funcs[_key4] = arguments[_key4];
        }

        var recomputations = 0;
        var objectKeys = isPlainObject(funcs[0]) ? Object.keys(funcs[0]) : undefined;
        var resultFunc = objectKeys ? objectFn(objectKeys) : funcs.pop();
        var dependencies = objectKeys ? values(funcs[0], objectKeys) : Array.isArray(funcs[0]) ? funcs[0] : funcs;

        var memoizedResultFunc = memoize.apply(undefined, [function () {
            recomputations++;
            return resultFunc.apply(undefined, arguments);
        }].concat(memoizeOptions));

        var selector = function selector(state, props) {
            for (var _len5 = arguments.length, args = Array(_len5 > 2 ? _len5 - 2 : 0), _key5 = 2; _key5 < _len5; _key5++) {
                args[_key5 - 2] = arguments[_key5];
            }

            var params = dependencies.map(function (dependency) {
                return dependency.apply(undefined, [state, props].concat(args));
            });
            return memoizedResultFunc.apply(undefined, _toConsumableArray(params));
        };

        selector.recomputations = function () {
            return recomputations;
        };
        return selector;
    };
}

function createSelector() {
    return createSelectorCreator(defaultMemoize).apply(undefined, arguments);
}