let joinWebUrl;

window.addEventListener("unload", () => {
	console.debug("unload");
});

window.addEventListener("load", async () =>  {
	const origin = JSON.parse(localStorage.getItem("configuration.cas_server_url"));
	const authorization = JSON.parse(localStorage.getItem("configuration.cas_server_token"));
 
	console.debug("window.load", window.location.hostname, origin, authorization);
	
	const urlParam = (name) => {
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (!results) { return undefined; }
		return unescape(results[1] || undefined);
	}; 	
	
	if (!!microsoftTeams) {
		microsoftTeams.initialize();
		microsoftTeams.appInitialization.notifyAppLoaded();

		microsoftTeams.getContext(async context => {
			microsoftTeams.appInitialization.notifySuccess();
			console.log("cas companion logged in user", context.userObjectId, context.subEntityId, context);
			document.getElementById("cas-top-page").src = origin + "/casweb/main/index.html?userid=" + context.userObjectId;	
			
			setup(context.userObjectId);
		});

		microsoftTeams.registerOnThemeChangeHandler(function (theme) {
			console.log("change theme", theme);
		});	
	}

	function setup(userid) {
		console.log("setup", origin, authorization, userid);
							
		document.querySelector("button").addEventListener("click", async (evt) => {	
			const body = "Calling Client";
			const url2 = origin + "/plugins/casapi/v1/companion/meeting/client/%2B441634251467";			
			const response3 = await fetch(url2, {method: "POST", headers: {authorization}, body});
			joinWebUrl = await response3.text();
		
			microsoftTeams.executeDeepLink(joinWebUrl);
		})
	}	
});	

