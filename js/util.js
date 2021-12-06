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
function mapToJSON(map) {
    const object = {};
    for (const [key, value] of Object.entries(map)) {
        object[key] = value;
    }
    return object;
}
