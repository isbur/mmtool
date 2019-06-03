function notify(message){
	browser.notifications.create({
		"type": "basic",
		"title": "Debug message",
		"message": message
	  })
}


/*
window.addEventListener("click", notifyExtension);

function notifyExtension(e) {
  if (e.target.tagName != "A") {
    return;
  }
  browser.runtime.sendMessage({"url": e.target.href});
}
*/
notify("Script has started")

document.addEventListener("click", (e) => {
	if (e.target.id === "turn on button") {
		browser.runtime.sendMessage("start")
		notify("start")
	}
	else if (e.target.id === "turn off button") {
		browser.runtime.sendMessage("stop")
		notify("stop")
	}
})
