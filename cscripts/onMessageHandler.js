async function main(){
	
	console.log("onMessageHandler.js is loaded.");
	
	
	browser.runtime.onMessage.addListener(
		function(request, sender, sendResponse){
			switch (request.command) {
				case "getSelection":
					sendResponse({data: window.getSelection().toString()})
					break;
				
				case "notify":
					console.log("NOTIFY OR DIE");
					// Let's check whether notification permissions have already been granted
					if (Notification.permission === "granted") {
						// If it's okay let's create a notification
						var notification = new Notification(request.message);
					}
					// Otherwise, we need to ask the user for permission
					else if (Notification.permission !== "denied") {
						Notification.requestPermission().then(function (permission) {
						  // If the user accepts, let's create a notification
						  if (permission === "granted") {
							var notification = new Notification(request.message);
						  }
						});
					}
					break;
				
				default:
					console.log("No such command was found.");
					sendResponse("failure");
			}	
		}
	)	
	
}


main();