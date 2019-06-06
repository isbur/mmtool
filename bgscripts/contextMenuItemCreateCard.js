console.log("test my card");


browser.runtime.onMessage.addListener(
	(message) => {
		console.log("CardCreator has received some message")
		if (message.command === "start_contextMenuItem_createCard") {
			console.log("Creating contextMenuItem createCard...")
			
			browser.menus.create({
				id: "createCard",
				title: "Create a card"
			})

		}
		else if (message.command === "stop") {
			console.log("Stoping scripts...")
		}
	}
)
