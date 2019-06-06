import './jquery-3.4.1.js'

const apiUrl = "https://ru.wikiversity.org/w/api.php";
const userName = "Isbur@mmtool";
const password = "sf5vmfng5e1gp1hoi17jf9hpc5d9ddpq"


console.log("test my nuts");


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
		
		mwjs.send({action: 'edit', page: 'Участник:Isbur', appendtext: 'wikitext'}, function (data) {
					console.log(data);
		});
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

