document.addEventListener('DOMContentLoaded', (event) => {
    if (dev) {
        inputElm("name").value = "b";
        inputElm("room").value = "room";
    }
    elm("js-check").style.display = "none";
});
function connect() {
    const room = "room";
    const name = inputElm("name").value.trim();
    const connection = new Connection(room, name);
    const ui = new UI("div-game", connection);
    ui.displayGame();
    const game = new Game(elm("renderer"), connection);
}
