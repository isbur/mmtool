import './jquery-3.4.1.js'

const apiUrl = "https://ru.wikiversity.org/w/api.php";
const userName = "Isbur@mmtool";
const password = "sf5vmfng5e1gp1hoi17jf9hpc5d9ddpq"
const baseWikiPage = "Участник:Isbur/Комплексный анализ II/Карточки/"

var auxiliaryStepsCompleted = false;


var jswikibot = {
	
	cardName:"initialName",
	
	login: function(){
		
		var logintoken = "foo";
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
					}
				})
			}
		})
		
		
	},
	
	
	startCreatingCard: function(){
		// sequence of requests to content script injected to browser tab
		this.cardName = MMTool.currentTab.getSelection();
		
	},
	
	editCard: function(textToAdd){
		
		$.ajax({
			type: "GET",
			url: apiUrl,
			data: {action: "query", format: "json", meta: "tokens"},
			dataType: "json",
			success: function(data){
				console.log(data);
				var edittoken = data.query.tokens.csrftoken;
				
				var targetTitle = baseWikiPage.concat("",this.cardName);
				
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
	},
	
	
	addToCard: function(){
		
	}
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
		
		getSelection: function(){
			
			var returnValue;
			
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
						return -2;
					}
					returnValue = response.data;
					console.log("gotSelectionText:\t"+returnValue);
					return returnValue;
				})
			})
		}
		
	}
}


function fullIniialize() {
	console.log("Starting scripts...")
			
	jswikibot.login();
	
	auxiliaryStepsCompleted = true;
}


var listeners = {
	
	
	onCommandHandler: function(command) {
		if (auxiliaryStepsCompleted === false) {
			fullIniialize();
			return;
		}
		if (command === "testCommand"){
			// two cases: first time use during the session and
			console.log("test my nuts");
			var testvar = MMTool.currentTab.getSelection();
			console.log("oh they're sweet")
		}
		//else if (command === "startCreatingCard"){
		//	entryPoint();
		//}
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


