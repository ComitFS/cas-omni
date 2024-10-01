let callAdapter, currentCall;


window.onload = async () => {
	const urlParam = (name) => {
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (!results) { return undefined; }
		return unescape(results[1] || undefined);
	};  

	let destination;
	const content = document.querySelector('#call-container');
	const dataString = urlParam("data");
	
	if (dataString) {
		const data = JSON.parse(atob(dataString));	
		console.debug("video-call", data); 
		
		const displayName = data.displayName;	
		const userId = data.userId;		
		const token = data.token;		
		const locator = data.locator;
		
		callAdapter = await callComposite.loadCallComposite({displayName, locator,	userId,	token}, content, {formFactor: 'desktop',	key: new Date()	});		
		destination = data.destination;
		
	} else {
		const userId = { communicationUserId: '8:acs:7278b90e-91bb-4a42-8913-9233b5d4ad4f_0000000d-ce88-0aa9-0cf9-9c3a0d004831' };
		const authorization = btoa("jjgartland:Welcome123");
		const url = location.protocol + "//" + location.host + "/plugins/casapi/v1/companion/config/global";			
		const response = await fetch(url, {method: "GET", headers: {authorization}});
		const config = await response.json();				
		const client = new ACS.CommunicationIdentityClient(config.acs_endpoint);	
		const response2 = await client.getToken(userId, ["chat", "voip"]);		
		const token = response2.token;	
		
		const url2 = location.protocol + "//" + location.host + "/plugins/casapi/v1/companion/meeting/adviser/dele?subject=JJ Gartland Calling FA";			
		const response3 = await fetch(url2, {method: "POST", headers: {authorization}});
		const meetingLink = await response3.text();		
		const locator = {meetingLink};
		
		console.debug("meeting coords", locator, userId, token, content);
		callAdapter = await callComposite.loadCallComposite({displayName: "JJ Gartland", locator,	userId,	token}, content, {formFactor: 'desktop',	key: new Date()	});			
		destination = { microsoftTeamsUserId: '83ec482c-3bc5-4116-acee-e081cc720630'};	
	}
	
	currentCall = await callAdapter.joinCall();			
	currentCall.addParticipant(destination, {});	
}

window.onbeforeunload = () => {
	try {
		if (currentCall) currentCall.hangUp();
	} catch (e) {}
	
	if (callAdapter) callAdapter.dispose();
};		


