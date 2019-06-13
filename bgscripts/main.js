import './jquery-3.4.1.js'

const apiUrl = "https://ru.wikiversity.org/w/api.php";
const userName = "Isbur@mmtool";
const password = "sf5vmfng5e1gp1hoi17jf9hpc5d9ddpq"
const baseWikiPage = "Участник:Isbur/MMToolTestPage/" // Please don't forget to add "/" to the end

var auxiliaryStepsCompleted = false;


var jswikibot = {
	
	cardName:"initialName",
	
	login: function(){
		
		var logintoken = "foo";
		return new Promise((resolve, reject) => {
			$.ajax({
				type: "GET",
				url: apiUrl,
				data: {action: "query", format: "json", meta: "tokens", type: "login"},
				dataType: "json",
				success: function(data){
					console.log(data);
					logintoken = data.query.tokens.logintoken;
					$.ajax({
						type: "POST",
						url: apiUrl,
						data: {action: "login", format: "json", lgname: userName, lgpassword: password, lgtoken: logintoken},
						dataType: "json",
						success: function(data){
							console.log(data);
							resolve(data);
						}
					})
				}
			})
		})
		
	},
	
	
	startCreatingCard: function(){
		// sequence of requests to content script injected to browser tab
		return new Promise((resolve, reject) => {
			MMTool.currentTab.getSelection().then((response)=>{
				jswikibot.cardName = response
				resolve({
					errorCode: 0,
					cardName: response
				});
			});
			
		});
	},
	
	editCard: function(textToAdd){
		
		return new Promise((resolve, reject) => {
			$.ajax({
				type: "GET",
				url: apiUrl,
				data: {action: "query", format: "json", meta: "tokens"},
				dataType: "json",
				success: function(data){
					console.log(data);
					var edittoken = data.query.tokens.csrftoken;
					
					var targetTitle = baseWikiPage.concat("",jswikibot.cardName);
					
					$.ajax({
						type: "POST",
						url: apiUrl,
						data: {action: "edit", format: "json", title: targetTitle, appendtext: textToAdd, token: edittoken},
						success: function(data){
							console.log(data);
						}	
					})
				}
			})
		})
	},
}


// Browser specific tasks
var MMTool = {
	contextMenu: {
		createCard: {
			
			
			start: function(){
				console.log("Creating menu item...");
				browser.menus.create({
					id: "createCard",
					title: "Create a card"
				});
				jswikibot.createCard()
				
				
			},
			
			
			stop: function(){
				console.log("Removing menu item...");
				browser.menus.remove("createCard");
			}
			
			
		}
	},
	
	currentTab: {
		
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
			return new Promise(function(resolve, reject){
				var returnValue;
				console.log("Here I am!");
				browser.tabs.query({
					currentWindow: true,
					active: true
				}).then( function(tabs){
					console.log(tabs[0].id);
					browser.tabs.sendMessage(
						tabs[0].id,
						{command:"getSelection"}
					).then(function(response) {
						console.log(response);
						if (response.data.length === 0) {
							console.log(-2);
							reject(-2);
						}
						returnValue = response.data;
						console.log("gotSelectionText:\t"+returnValue);
						resolve(returnValue);
					})
				})
			});
		},
		
		notify: async function(textToSend){
			var targetTabId = await MMTool.currentTab.getId();
			await browser.tabs.sendMessage(targetTabId, {
				command: "notify",
				message: textToSend
			});
			return new Promise((resolve) => {resolve(textToSend)})
		}
	}
	

}


function fullIniialize() {
	console.log("Starting scripts...")
			
	var loginPromise = new Promise((resolve, reject) => {
		jswikibot.login().then(((response) =>{auxiliaryStepsCompleted = true;}));
	})
	
	loginPromise.then((response) => {resolve("Success")});
	
	return loginPromise;
	
}


var listeners = {
	
	
	onCommandHandler: async function(command) {
		if (auxiliaryStepsCompleted === false) {
			await fullIniialize();
			return;
		}
		else if (command === "testCommand"){
			// two cases: first time use during the session and
			console.log("test my nuts");
			//await jswikibot.startCreatingCard();
			//await jswikibot.editCard("\n\nhello world\n\n");
			var test = await MMTool.currentTab.notify("kjdkshbj");
			console.log("TEST:\t" + test);
			console.log("oh they're sweet");
		}
		else if (command === "startCreatingCard"){
			var response = await jswikibot.startCreatingCard();
			MMTool.currentTab.notify("Successful card creation!\nCard path:\t"+baseWikiPage+response.cardName);
		}
		else if (command === "addSelectedText"){
			console.log("STARTED ADDING SELECTED TEXT");
			var textToAdd = await MMTool.currentTab.getSelection(); // defence from dumb input is needed to add
			console.log(textToAdd);
			var response = await jswikibot.editCard("\n\n"+textToAdd+"\n\n");
			console.log(response);
			//MMTool.notify("Successful card edit!\nCard path:\t"+baseWikiPage+response.cardName);//+"\nText was added:\n"+textToAdd);
			MMTool.currentTab.notify("test");
		}
		MMTool.currentTab.notify("test");
	},
	
	onMessageHandler: function(message){
		console.log("Some message was received");
		if (message.command === "start") {
			fullIniialize();
		}
		else if (message.command === "stop") {
			console.log("Stoping scripts...");
		}
	}
	
}


browser.runtime.onMessage.addListener((message) => {listeners.onMessageHandler(message)});
browser.commands.onCommand.addListener((command) => {listeners.onCommandHandler(command)});


