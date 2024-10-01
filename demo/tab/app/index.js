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
    setTheme(context.app.theme);

    microsoftTeams.registerOnThemeChangeHandler((theme) => {
        setTheme(theme);
    });
});	

function setTheme(theme) {
    const el = document.documentElement;
    el.setAttribute('data-theme', theme); // switching CSS
};