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
		else {
			sendResponse({});
		}
		
	}
)

