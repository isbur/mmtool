import {path} from '../node_modules/path-browserify/ES6wrapper.js'
import {apiUrl, userName, password, baseWikiPage} from './settings.js'


function typicalAjax(requieredType, dataToSend){
	return new Promise((resolve, reject) => {
		if ("format" in dataToSend === false) {
			dataToSend.format = "json";
		}
		console.log(dataToSend);
		$.ajax({
			type: requieredType,
			url: apiUrl,
			data: dataToSend,
			dataType: "json",
			success: (data) => {
				console.log("success!");
				console.log(data);
				resolve(data);
			},
			error: (response, type)=>{
				console.log(response);
				console.log(type);
				throw "OK, so there was an error...";
			},
			
			complete: (data) => {
				console.log("Request completed...");
				console.log(data);
			}
			
		});
	});
}


function getToken(desiredType){
	return new Promise((resolve)=>{
		let data = {action: "query", format: "json", meta: "tokens", type: desiredType};
		resolve(typicalAjax("GET",data));
	})
}


export function login(){

		return new Promise(async function (resolve) {
			let response = await getToken("login");
			let logintoken = response.query.tokens.logintoken;
			let data = {action: "login", format: "json", lgname: userName, lgpassword: password, lgtoken: logintoken};
			resolve(typicalAjax("POST", data));
		})
		
	}
	

// Needs to be refactored	
// С другой стороны, работает - не тронь...
export function editCard(cardName, textToAdd){
		
	return new Promise((resolve, reject) => {
		let edittoken;
		getToken("csrf")
		.then((response)=>{
			edittoken = response.query.tokens.csrftoken;
			console.log(response);
		})
		.then(()=>{
			let targetTitle = path.join(baseWikiPage,cardName);
			let data = {action: "edit", title: targetTitle, appendtext: textToAdd, token: edittoken};
			typicalAjax("POST", data);
		})
		.then((data)=>{
			console.log(data);
			resolve(data);
		});
	})
}


export function getPageText(cardName) {
	return new Promise((resolve) => {
		let targetPage = path.join(baseWikiPage,cardName);
		//console.log(targetPage);
		let data = {action: "parse", page: targetPage, prop: "wikitext"};
		typicalAjax("GET", data)
		.then((response)=>{
			if ('error' in response) {
				throw "Something went wrong...\n\nMaybe there is no such page?";
			} else {
				resolve(response);
			}
		})
	});
}


export function find(textToFind, cardName) {
	return new Promise((resolve) => {
		console.log("Find Promise is queued");
		// Get page's wikitext
		getPageText(cardName) // no semicolon!!!
		.then((response)=>{
			let pageText = response.parse.wikitext['*']
			console.log("textToFind:\t"+textToFind+"\nin\n"+pageText);
			resolve(pageText.includes(textToFind));
		});
	})
}