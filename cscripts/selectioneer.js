browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse){
		if(request.command = "getSelection"){
			console.log("I'm alive!");
			var selObj = window.getSelection();
			console.log(selObj);
			sendResponse({data: selObj.toString()});
		} 
		else {
			sendResponse({});
		}
	}
)