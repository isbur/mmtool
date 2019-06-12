console.log("I am launched!");



browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse){
		console.log("I'm still alive!");
		
		if(request.command = "getSelection"){
			console.log("I'm alive!");
			var selObj = window.getSelection();
			console.log(selObj());
			sendResponse({data: selObj.toString()});
		} 
		else {
			sendResponse({});
		}
		
	}
)

