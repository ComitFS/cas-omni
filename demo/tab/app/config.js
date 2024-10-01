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
	
    await microsoftTeams.app.initialize();	
	const context = await microsoftTeams.app.getContext();	
	
	microsoftTeams.pages.config.registerOnSaveHandler((saveEvent) => {
		const url = "https://comitfs.github.io/cas-omni/demo/tab/app/index.html";
		
		const configPromise = microsoftTeams.pages.config.setConfig({
			websiteUrl: url,
			contentUrl: url,
			entityId: "cas-serve",
			suggestedDisplayName: "CAS Companion"
		});
		configPromise.then((result) => {saveEvent.notifySuccess()}).catch((error) => {saveEvent.notifyFailure("failure message")});
	});	
	
	document.querySelector("#save").addEventListener("click", async (evt) => {
		microsoftTeams.settings.setValidityState(true);		
	});
	
});	