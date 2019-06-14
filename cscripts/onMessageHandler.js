//var i = 0;
function notify(request) {
	//var notification = new Notification(message);
	var notification = new Notification(
		request.title,
		{
			body: request.message
		}
	);
	//i = i+1;
}


function onMessageHandler(request, sender, sendResponse){
	console.log("onMessageHandler is acivated.");
	switch (request.command) {
		case "getSelection":
			sendResponse({data: window.getSelection().toString()})
			break;
		
		case "notify":
			console.log("NOTIFY OR DIE");
			// Let's check whether notification permissions have already been granted
			if (Notification.permission === "granted") {
				// If it's okay let's create a notification
				notify(request);
			}
			// Otherwise, we need to ask the user for permission
			else if (Notification.permission !== "denied") {
				Notification.requestPermission().then(function (permission) {
				  // If the user accepts, let's create a notification
				  if (permission === "granted") {
					notify(request);
				  }
				});
			}
			break;
		
		default:
			console.log("No such command was found.");
			sendResponse("failure");
	}	
}


function main(){
	
	console.log("onMessageHandler.js is loaded.");
	
	browser.runtime.onMessage.addListener((request, sender, sendResponse) => onMessageHandler(request, sender, sendResponse));	
	
}

//notify("test");
main();