document.addEventListener("click", (e) => {
	if (e.target.id === "turn on button") {
		browser.runtime.sendMessage({command: "start"})
	}
	else if (e.target.id === "turn off button") {
		browser.runtime.sendMessage({command: "stop"})
	}
})
