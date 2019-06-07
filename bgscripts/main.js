import './jquery-3.4.1.js'

const apiUrl = "https://ru.wikiversity.org/w/api.php";
const userName = "Isbur@mmtool";
const password = "sf5vmfng5e1gp1hoi17jf9hpc5d9ddpq"
const baseWikiPage = "Участник:Isbur/Комплексный анализ II/Карточки/"


console.log("test my nuts");
var selObj = document.getSelection();
console.log(selObj);
console.log("oh they're sweet")


var jswikibot = {
	
	
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
	
	
	createCard: function(){
		
		$.ajax({
			type: "GET",
			url: apiUrl,
			data: {action: "query", format: "json", meta: "tokens"},
			dataType: "json",
			success: function(data){
				console.log(data);
				var edittoken = data.query.tokens.csrftoken;
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
						var cardName = response.data;
						console.log("cardName:\t"+cardName);
						
						var targetTitle = baseWikiPage.concat("",cardName);
						
						$.ajax({
							type: "POST",
							url: apiUrl,
							data: {action: "edit", format: "json", title: targetTitle, appendtext: "\n\nhello world\n\n", token: edittoken},
							success: function(data){
								console.log(data);
							}
							
						})
					})
				})
				
				
			}
			
		})
	},
	
	
	addToCard: function(){
		
	}
}


jswikibot.login()


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
	}
}


function entryPoint() {
	console.log("Starting scripts...")
			
	jswikibot.login()
	
	browser.commands.onCommand.addListener(function(command) {
	  if (command == "toggleCreateOrAddCard") {
		console.log("toggling the feature!");
		MMTool.contextMenu.createCard.start()
	  }
	});
	
}


browser.runtime.onMessage.addListener(
	(message) => {
		console.log("Some message was received");
		if (message.command === "start") {
			entryPoint(null);
		}
		else if (message.command === "stop") {
			console.log("Stoping scripts...");
		}
	}
);

browser.commands.onCommand.addListener(function onCommandHandler(command) {
	  if (command == "toggleCreateOrAddCard") {
		browser.commands.onCommand.removeListener(onCommandHandler)
		entryPoint();
	  }
});

