var MediaWiki = require("mediawiki");
var bot = new MediaWiki.Bot();

bot.settings.endpoint = "https://ru.wikiversity.org/w/api.php";
bot.settings.rate = 60e3 / 10;
bot.settings.userAgent = "ExampleBot <https://en.wiktionary.org/wiki/User:Example>";
bot.settings.byeline = "(example bot edit)";

console.log("test my nuts");








var jswikibot = {
	
	
	login: function(){
		/*
		// get login token
		var request = bot.get({
			action: "query",
			meta: "tokens",
			type: "login"
		});

		var logintoken="foo";
		request.complete(function (response) {
			console.log(response);
			logintoken = response.query.tokens.logintoken;
			console.log(logintoken);
		});
		
		
		// login
		var request = bot.post({
			action: 'login',
			lgname: 'Isbur@mmtool',
			lgpassword: 'sf5vmfng5e1gp1hoi17jf9hpc5d9ddpq',
			lgtoken: logintoken
		});
		
		request.complete(function (response) {
			console.log(response);
		});	
		*/
		const user = "Isbur@mmtool";
		const password = "sf5vmfng5e1gp1hoi17jf9hpc5d9ddpq"
		bot.login(user, password).complete(function (username) {
			console.log("Logged in as " + username);
		});
	},
	
	
	createCard: function(){
		
		mwjs.send({action: 'edit', page: 'Участник:Isbur', appendtext: 'wikitext'}, function (data) {
					console.log(data);
		});
	},
	
	
	addToCard: function(){
		
	}
}


jswikibot.login();


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

