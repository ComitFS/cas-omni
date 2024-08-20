let callAdapter, currentCall;


window.onload = async () => {
	const urlParam = (name) => {
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (!results) { return undefined; }
		return unescape(results[1] || undefined);
	};  

	const content = document.querySelector('#call-container');
	const data = JSON.parse(atob(urlParam("data")));	
	console.debug("video-call", data); 
	
	const displayName = data.displayName;	
	const destination = data.destination;
	const userId = data.userId;		
	const token = data.token;		
	const locator = data.locator;
	
	callAdapter = await callComposite.loadCallComposite({displayName, locator,	userId,	token}, content, {formFactor: 'desktop',	key: new Date()	});	
	currentCall = await callAdapter.startCall([destination]);		
}

window.onbeforeunload = () => {
	if (currentCall) currentCall.hangUp();
	if (callAdapter) callAdapter.dispose();
};		


