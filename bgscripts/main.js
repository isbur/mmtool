import {apiUrl, userName, password, baseWikiPage} from './settings.js'
import {path} from '../node_modules/path-browserify/ES6wrapper.js'
import * as jswikibot from './jswikibot.js'
import * as browserbot from './browserbot.js'


export var cardName;
function universalCommandHandler(command){
	new Promise((resolve)=>{
		let message = "default notification";
		let targetTitle;
		let textToAdd;
		let textToFind;
		switch(command){
			// Ctrl+Alt+T
			case "testCommand":
				console.log("test my nuts");
				message = "test";
				
				//browserbot.currentTab.getSelection()
				//.then((data)=>{
				//	let textToFind = data;
				//	jswikibot.find(textToFind,"");
				console.log("oh they're sweet");
				resolve(message);
				break;
				
			// Ctrl+Alt+V	
			case "startCreatingCard":
			
				// Set card name
				browserbot.currentTab.getSelection()
				// Add card link to parent page
				//// Form link text
				.then((data)=>{
					cardName = data;
					targetTitle = path.join(baseWikiPage, data);
					textToFind = "[[" + targetTitle + "]]";
					console.log(textToFind);
					textToAdd = "\n\n[[" + targetTitle + "]]";
					return textToFind;
				})
				//// Check whether such link already exists
				.then((textToFind) => {
					return jswikibot.find(textToFind,"");
				})
				.then((response)=>{
					console.log(response);
					if (response) {
						console.log("Link on parent page already exists.");
					} else {
						jswikibot.editCard("",textToAdd);
						console.log("Link successfully added");
					}
					message = "Successful card creation!\nCard path:\t"+targetTitle;
					resolve(message);
				})

				break;
				
			// Ctrl+Alt+M	
			case "addSelectedText":
				console.log("STARTED ADDING SELECTED TEXT");
				browserbot.currentTab.getSelection() // defence from dumb input is needed to add
				.then((response)=>{
					textToAdd = response;
					console.log("TEXTTOADD"+textToAdd);
					let returnValue = jswikibot.editCard(cardName, "\n\n"+textToAdd+"\n\n");
					console.log("RETURN_VALUE:\t"+returnValue);
					return returnValue.then((response)=>{return response}); // ну пошло костыляние
				})
				.then((response)=>{
					console.log("FINISHED EDITING");
					console.log(response);
					message = "Successful card edit!\nCard path:\t"+path.join(baseWikiPage,cardName)+"\nText was added:\n"+textToAdd;
					resolve(message);
				});
				
				//console.log("MESSAGE"+message);
				break;
				
			default:
				console.log("Command was not found.");
		}
	})
	.then((message)=>{
		browserbot.currentTab.notify(command,message);
	});
}


// First we need to login
browser.commands.onCommand.addListener(async function initialOnCommandHandler() {
	// But check also whether we alredy are logged in
	let response = await jswikibot.getUserinfo();
	if ("anon" in response.query.userinfo.name){
		await jswikibot.login();
	}
	browser.commands.onCommand.removeListener(initialOnCommandHandler);
});
// Now we are ready to execute commands
browser.commands.onCommand.addListener((command) => {universalCommandHandler(command)});


