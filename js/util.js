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
