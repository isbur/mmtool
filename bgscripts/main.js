console.log("test my nuts");


browser.runtime.onMessage.addListener(
	(message) => {
		console.log("Some message was received");
		if (message.command === "start") {
			console.log("Starting scripts...")
		}
		else if (message.command === "stop") {
			console.log("Stoping scripts...")
		}
	}
)
