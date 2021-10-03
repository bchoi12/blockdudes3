function debug(msg) {
    if (dev) {
        console.log(msg);
    }
}
function waitUntilTrue(predicate, retryTime, callback) {
    setTimeout(function () {
        if (predicate) {
            if (callback != null) {
                callback();
            }
        }
        else {
            waitUntilTrue(predicate, retryTime, callback);
            return;
        }
    }, retryTime);
}
function defined(object) {
    return typeof object != 'undefined';
}
function elm(id) {
    return document.getElementById(id);
}
function inputElm(id) {
    return document.getElementById(id);
}