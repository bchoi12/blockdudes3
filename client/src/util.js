const dev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
export var Util;
(function (Util) {
    function defined(object) {
        return typeof object != 'undefined' && object != null;
    }
    Util.defined = defined;
    function arrayToString(array) {
        return array.join(",");
    }
    Util.arrayToString = arrayToString;
    function getOr(msg, prop, or) {
        if (msg.hasOwnProperty(prop)) {
            return msg[prop];
        }
        return or;
    }
    Util.getOr = getOr;
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
    function trimmedValue(id) {
        return inputElm(id).value.trim();
    }
    HtmlUtil.trimmedValue = trimmedValue;
    function hide(id) {
        elm(id).style.visibility = "hidden";
    }
    HtmlUtil.hide = hide;
    function show(id) {
        elm(id).style.visibility = "visible";
    }
    HtmlUtil.show = show;
    function displayNone(id) {
        elm(id).style.display = "none";
    }
    HtmlUtil.displayNone = displayNone;
    function displayBlock(id) {
        elm(id).style.display = "block";
    }
    HtmlUtil.displayBlock = displayBlock;
    function unselectable(id) {
        elm(id).classList.add("no-select");
    }
    HtmlUtil.unselectable = unselectable;
    function selectable(id) {
        elm(id).classList.remove("no-select");
    }
    HtmlUtil.selectable = selectable;
    function slightlyOpaque(id) {
        elm(id).classList.add("slightly-opaque");
    }
    HtmlUtil.slightlyOpaque = slightlyOpaque;
    function notSlightlyOpaque(id) {
        elm(id).classList.remove("slightly-opaque");
    }
    HtmlUtil.notSlightlyOpaque = notSlightlyOpaque;
    function isVisible(id) {
        return elm(id).style.visibility !== "hidden";
    }
    HtmlUtil.isVisible = isVisible;
})(HtmlUtil || (HtmlUtil = {}));
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
    function signPos(n) {
        if (n == 0) {
            return 1;
        }
        return Math.sign(n);
    }
    MathUtil.signPos = signPos;
    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    MathUtil.randomRange = randomRange;
})(MathUtil || (MathUtil = {}));
