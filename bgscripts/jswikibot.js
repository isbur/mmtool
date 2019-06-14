import {apiUrl, userName, password, baseWikiPage} from './settings.js'


function typicalAjax(requieredType, dataToSend){
	return new Promise((resolve) => {
		$.ajax({
			type: requieredType,
			url: apiUrl,
			data: dataToSend,
			dataType: "json",
			success: (data) => {
				console.log(data);
				resolve(data);
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
	
	
export function editCard(cardName, textToAdd){
		
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "GET",
			url: apiUrl,
			data: {action: "query", format: "json", meta: "tokens"},
			dataType: "json",
			success: function(data){
				console.log(data);
				var edittoken = data.query.tokens.csrftoken;
				
				var targetTitle = baseWikiPage.concat("",cardName);
				
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
}


export async function getPageText(cardName) {
	
}