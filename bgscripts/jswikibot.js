import {apiUrl, userName, password, baseWikiPage} from './settings.js'
import {cardName} from './main.js'

export function login(){
		
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
		
	}
	
	
export function editCard(textToAdd){
		
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