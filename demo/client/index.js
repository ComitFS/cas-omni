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
	let casUrl = url + "/config/global";	
	
	let response = await fetch(casUrl, {method: "GET"});
	const config = await response.json();				
	const client = new ACS.CommunicationIdentityClient(config.acs_endpoint);	
	const response2 = await client.getToken(userId, ["chat", "voip"]);		
	const token = response2.token;	
	
	const locator = {group: '83ec482c-3bc5-4116-acee-e081cc720630'};
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
