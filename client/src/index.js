import { LogUtil, HtmlUtil, Util } from './util.js';
import { connection } from './connection.js';
import { game } from './game.js';
import { ui } from './ui.js';
const go = new Go();
const inputName = "input-name";
const inputRoom = "input-room";
const formLogin = "form-login";
const buttonLogin = "button-login";
let wasmLoaded = false;
document.addEventListener('DOMContentLoaded', (event) => {
    HtmlUtil.displayNone("js-check");
    if (Util.isDev()) {
        LogUtil.d("Dev mode enabled!");
        HtmlUtil.inputElm(inputName).value = "b";
    }
    HtmlUtil.inputElm(inputRoom).value = "test_room";
    WebAssembly.instantiateStreaming(fetch("./game.wasm"), go.importObject).then((result) => {
        go.run(result.instance);
        wasmLoaded = true;
        ui.setup();
        game.setup();
        HtmlUtil.displayNone("wasm-check");
        HtmlUtil.elm(buttonLogin).style.display = "inline-block";
    });
});
HtmlUtil.elm(formLogin).onsubmit = () => {
    if (!wasmLoaded)
        return;
    const room = HtmlUtil.trimmedValue(inputRoom);
    const name = HtmlUtil.trimmedValue(inputName);
    connection.connect(room, name, () => { }, () => {
        game.start();
        ui.displayGame();
    });
};
