let config = {userPrincipalName: "dele@olajide.net", token: "1234567890", url: "https://pade.chat:5443"};

window.addEventListener("unload", () => {
	console.debug("unload");
});

window.addEventListener("load", async () =>  {
	console.debug("window.load", window.location.hostname, window.location.origin);
	
	const urlParam = (name) => {
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (!results) { return undefined; }
		return unescape(results[1] || undefined);
	}; 	
	
	if (microsoftTeams in window) {
		microsoftTeams.initialize();
		microsoftTeams.appInitialization.notifyAppLoaded();

		microsoftTeams.getContext(async context => {
			microsoftTeams.appInitialization.notifySuccess();
			//if (context.subEntityId) config = JSON.parse(context.subEntityId);
			//config.userPrincipalName = context.userPrincipalName
			console.log("cas teams crm demo logged in user", context, context.subEntityId);
		});

		microsoftTeams.registerOnThemeChangeHandler(function (theme) {
			console.log("change theme", theme);
		});	
	}	
});	

async function sendEmail(email) {
	const callbackUrl = "https://comitfs.github.io/cas-omni/demo/client/?u=https://pade.chat:5443";
	const body = `Hi JJ Gartland,\n\nPlease take a look at ${callbackUrl} and call me back if interested\n\n${config.userPrincipalName}`;
	
	await fetch(config.url + `/teams/api/openlink/email/Interesting Offer/${email}`, {method: "POST", headers: {authorization: config.token}, body})	
	alert("Email Sent!!");
}