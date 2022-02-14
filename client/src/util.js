const dev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
export var Util;
(function (Util) {
    function defined(object) {
        return typeof object != 'undefined';
    }
    Util.defined = defined;
    function arrayToString(array) {
        return array.join(",");
    }
    Util.arrayToString = arrayToString;
    function isDev() {
        return dev;
    }
    Util.isDev = isDev;
})(Util || (Util = {}));
export var LogUtil;
(function (LogUtil) {
    function d(msg) {
        if (dev) {
            console.log(msg);
        }
    }
    LogUtil.d = d;
})(LogUtil || (LogUtil = {}));
export var HtmlUtil;
(function (HtmlUtil) {
    function elm(id) {
        return document.getElementById(id);
    }
    HtmlUtil.elm = elm;
    function inputElm(id) {
        return document.getElementById(id);
    }
    HtmlUtil.inputElm = inputElm;
    function audioElm(id) {
        return document.getElementById(id);
    }
    HtmlUtil.audioElm = audioElm;
})(HtmlUtil || (HtmlUtil = {}));
export var GameUtil;
(function (GameUtil) {
    function sid(space, id) {
        return space + "," + id;
    }
    GameUtil.sid = sid;
    function space(sid) {
        return Number(sid.split(",")[0]);
    }
    GameUtil.space = space;
    function id(sid) {
        return Number(sid.split(",")[1]);
    }
    GameUtil.id = id;
})(GameUtil || (GameUtil = {}));
export var MathUtil;
(function (MathUtil) {
    function normalize(radians) {
        if (radians >= 2 * Math.PI) {
            radians -= Math.floor(radians / (2 * Math.PI)) * 2 * Math.PI;
        }
        if (radians < 0) {
            radians += (Math.floor(-radians / (2 * Math.PI)) + 1) * 2 * Math.PI;
        }
        return radians;
    }
    MathUtil.normalize = normalize;
})(MathUtil || (MathUtil = {}));
