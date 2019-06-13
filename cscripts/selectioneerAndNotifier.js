console.log("I am launched!");



browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse){
		console.log("I'm still alive!");
		
		if(request.command = "getSelection"){
			console.log("I'm alive!");
			var selObj = window.getSelection();
			response = selObj.toString()
			console.log(response);
			sendResponse({data: response});
		} 
		/*
		else if(request.command = "notify"){
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
		}
		*/
		else {
			sendResponse({});
		}
		
	}
)

