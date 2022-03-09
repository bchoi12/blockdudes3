export var Icon;
(function (Icon) {
    function person() {
        const html = document.createElement("i");
        html.classList.add("fa-solid");
        html.classList.add("fa-user");
        return html;
    }
    Icon.person = person;
    function microphone() {
        const html = document.createElement("i");
        html.classList.add("fa-solid");
        html.classList.add("fa-microphone");
        return html;
    }
    Icon.microphone = microphone;
})(Icon || (Icon = {}));
