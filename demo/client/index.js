window.addEventListener("load", async function(){
	const urlParam = (name) => {
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (!results) { return undefined; }
		return unescape(results[1] || undefined);
	}; 
	
	var open = false;
	const button = document.querySelector('.widget');
	const content = document.querySelector('.callWidget');
	const buttonIcon = button.innerHTML;
	
	const destination = { microsoftTeamsUserId: '83ec482c-3bc5-4116-acee-e081cc720630'};
	const userId = { communicationUserId: '8:acs:7278b90e-91bb-4a42-8913-9233b5d4ad4f_0000000d-ce88-0aa9-0cf9-9c3a0d004831' };

	const url = urlParam("u") ? urlParam("u") : "";
	let casUrl = url + "/teams/api/openlink/config/global";	
	
	let response = await fetch(casUrl, {method: "GET"});
	const config = await response.json();				
	const client = new ACS.CommunicationIdentityClient(config.acs_endpoint);	
	const response2 = await client.getToken(userId, ["chat", "voip"]);		
	const token = response2.token;	
	
	const locator = {meetingLink: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_OTY1NmJlMTQtOWJlOC00NDM3LWI5YjEtOWRkM2U4MDVlNjBl%40thread.v2/0?context=%7b%22Tid%22%3a%22a83ec96f-82b0-456e-90a2-a6ba1ce7fc4e%22%2c%22Oid%22%3a%2283ec482c-3bc5-4116-acee-e081cc720630%22%7d"};
	const callAdapter = await callComposite.loadCallComposite({displayName: "JJ Gartland", locator,	userId,	token}, content, {formFactor: 'desktop',	key: new Date()	});	
		
	button.addEventListener('click', async function() 	{	
		console.debug("click", open);
		
		if(!open){
			open = !open;
			content.style.display = 'block';
			button.innerHTML = 'X';
			
			const currentCall = await callAdapter.startCall([destination]);		
			
		} else if (open) {
			open = !open;
			content.style.display = 'none';
			button.innerHTML = buttonIcon;
		}
	});
	
    window.onbeforeunload = () => {
      callAdapter.dispose();
    };	
});
