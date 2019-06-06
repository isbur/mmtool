var bot = require('nodemw');


console.log("test my nuts");


var client = new bot({
    protocol: 'https',           // Wikipedia now enforces HTTPS
    server: 'en.wikipedia.org',  // host name of MediaWiki-powered site
    path: '/w',                  // path to api.php script
    debug: true                 // is more verbose when set to true
  });
  
client.getArticle('Main_page', function(err, data) {
    // error handling
    if (err) {
      console.error(err);
      return;
    }

    // ...
	
	console.log(data);
	
  });




var jswikibot = {
	
	
	login: function(){
		/*
		mwjs.send(
			{
				action: 'query',
				meta: 'tokens',
				type: 'login',
				origin: '
			},
			function(data){
				console.log(data)
				var logintoken = data.query.tokens.logintoken
			}
		);
		*/
		
		var logintoken = "16163ef86a4b52b2cb735722c68f499f5cf8fdff+\\"
		
		mwjs.send(
			{
				action: 'login',
				lgname: 'Isbur@mmtool',
				lgpassword: 'sf5vmfng5e1gp1hoi17jf9hpc5d9ddpq',
				lgtoken: logintoken
			},
			function(data){
				console.log(data);
			}
		)
		
	},
	
	
	createCard: function(){
		
		mwjs.send({action: 'edit', page: 'Участник:Isbur', appendtext: 'wikitext'}, function (data) {
					console.log(data);
		});
	},
	
	
	addToCard: function(){
		
	}
}


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

