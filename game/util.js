function debug(msg) {
	if (dev) {
		console.log(msg)
	}
}

function debugDiv(msg) {
    if (dev) {
        $("#debug").css("display", "block");
        $("#debug").append("DEBUG: " + msg + "<br>");
    }
}

function waitUntilTrue(predicate, retryTime, callback) {
    setTimeout(
        function () {
            if (predicate) {
                if (callback != null){
                    callback();
                }
            } else {
                waitUntilTrue(predicate, retryTime, callback);
                return;
            }
        }, retryTime);
}

function defined(object) {
    return typeof object != 'undefined';
}