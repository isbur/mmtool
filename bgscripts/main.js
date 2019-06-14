import './jquery-3.4.1.js'
import {apiUrl, userName, password, baseWikiPage} from './settings.js'
import * as jswikibot from './jswikibot.js'
import * as browserbot from './browserbot.js'


export var cardName
async function universalCommandHandler(command){
	let message = "default notification";
	let textToAdd;
	let response;
	switch(command){
		// Ctrl+Alt+T
		case "testCommand":
			console.log("test my nuts");
			message = "test";
			console.log("oh they're sweet");
			break;
			
		// Ctrl+Alt+V	
		case "startCreatingCard":
			// Set card name
			cardName = await browserbot.currentTab.getSelection();
			// Add link to parent page
			//// Form link text
			let targetTitle = baseWikiPage + cardName
			textToAdd = "\n\n[[" + targetTitle + "]]"
			//// Check whether such link already exists
			////// Get parent page's wikitext
			let parentPageWikitext = jswikibot.getPageText("");
			response = jswikibot.editCard("",)
			message = "Successful card creation!\nCard path:\t"+baseWikiPage+cardName;
			break;
			
		// Ctrl+Alt+M	
		case "addSelectedText":
			console.log("STARTED ADDING SELECTED TEXT");
			textToAdd = await browserbot.currentTab.getSelection(); // defence from dumb input is needed to add
			console.log("TEXTTOADD"+textToAdd);
			response = jswikibot.editCard(cardName, "\n\n"+textToAdd+"\n\n");
			console.log("RESPONSE");
			console.log(response);
			message = "Successful card edit!\nCard path:\t"+baseWikiPage+cardName+"\nText was added:\n"+textToAdd;
			//console.log("MESSAGE"+message);
			break;
			
		default:
			console.log("Command was not found.");
	}
	//await browserbot.currentTab.notify(message);
	browserbot.currentTab.notify(command, message);
}


// First we need to login
browser.commands.onCommand.addListener(async function initialOnCommandHandler() {
	let response = await jswikibot.login();
	console.log(response);
	browser.commands.onCommand.removeListener(initialOnCommandHandler);
});
// Now we are ready to execute commands
browser.commands.onCommand.addListener((command) => {universalCommandHandler(command)});


