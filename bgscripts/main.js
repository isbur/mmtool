browser.notifications.create({
    "type": "basic",
    "title": "You clicked a link!",
    "message": "Main.js is loaded!"
  })

browser.runtime.onMessage.addListener(notify);

function notify(message) {
  browser.notifications.create({
    "type": "basic",
    "iconUrl": browser.extension.getURL("link.png"),
    "title": "You clicked a link!",
    "message": message.url
  });
}
/*
(
	function() {
		alert("The bgscript is loaded")
		browser.runtime.onMessage(
			(message) => {
				console.log("Some message was received")
			}
		)
	}
)
*/