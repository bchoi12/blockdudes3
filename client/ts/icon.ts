export namespace Icon {
	export function person() : HTMLElement {
		const html = document.createElement("i");
		html.classList.add("fa-solid");
		html.classList.add("fa-user");
		return html;
	}

	export function microphone() : HTMLElement {
		const html = document.createElement("i");
		html.classList.add("fa-solid");
		html.classList.add("fa-microphone");
		return html;
	}
}