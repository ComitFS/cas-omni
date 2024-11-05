window.addEventListener("unload", () => {
	console.debug("unload");
});

window.addEventListener("load", async () =>  {
	const origin = JSON.parse(localStorage.getItem("configuration.cas_server_url"));
	const authorization = JSON.parse(localStorage.getItem("configuration.cas_server_token"));	
	
	console.debug("window.load", window.location.hostname, window.location.origin, origin, authorization);
	
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
			console.log("cas companion logged in user", context, context.subEntityId, context.userObjectId);
			document.getElementById("cas-top-page").src = "../main/index.html?userid=" + context.userObjectId;		
		});

		microsoftTeams.registerOnThemeChangeHandler(function (theme) {
			console.log("change theme", theme);
		});	
	}	
});	