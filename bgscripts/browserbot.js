export var currentTab = {
		
	getId: () => {
		return new Promise(async function(resolve){
			var tabs = await browser.tabs.query({
				currentWindow: true,
				active: true
			})
			resolve(tabs[0].id)
		});
	},
	
	getSelection: () => {
		return new Promise(
			async function(resolve, reject){
				let targetTabId = await currentTab.getId();
				let tabResponse = await browser.tabs.sendMessage(
					targetTabId,
					{command:"getSelection"}
				);
				console.log(tabResponse);
				if (tabResponse.data.length === 0) {
					console.log("Nothing was selected");
					reject(-2);
				} else {
					resolve(tabResponse.data);
				}
			}
		);
	},
	
	/*
	notify: function(textToSend){
		browser.notifications.create({
			type: "basic",
			title: "MMTool",
			message: textToSend
		})
	}
	*/
	notify: (textToSend) => {
		return new Promise(
			async function(resolve){
				let targetTabId = await currentTab.getId();
				let tabResponse = await browser.tabs.sendMessage(
					targetTabId,
					{command:"notify",
					message: textToSend}
				);
				resolve("Success!");
			}
		);
	}
}