function debug(msg) {
    if (dev) {
        console.log(msg);
    }
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
function audioElm(id) {
    return document.getElementById(id);
}
function sid(space, id) {
    return space + "," + id;
}
function space(sid) {
    return Number(sid.split(",")[0]);
}
function id(sid) {
    return Number(sid.split(",")[1]);
}
function arrayToString(array) {
    return array.join(",");
}
function normalize(radians) {
    if (radians >= 2 * Math.PI) {
        radians -= Math.floor(radians / (2 * Math.PI)) * 2 * Math.PI;
    }
    if (radians < 0) {
        radians += (Math.floor(-radians / (2 * Math.PI)) + 1) * 2 * Math.PI;
    }
    return radians;
}
function sanitizeWasmData(msg) {
    if (msg.hasOwnProperty(keysProp)) {
        const keys = Object.keys(msg[keysProp]);
        if (keys.length > 0) {
            msg[keysProp] = arrayToString(keys);
        }
    }
}
