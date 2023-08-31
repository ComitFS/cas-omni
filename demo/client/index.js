window.addEventListener("load", async function()
{
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
	const userId = { communicationUserId: '8:acs:7278b90e-91bb-4a42-8913-9233b5d4ad4f_0000001a-e206-aa5f-0cf9-9c3a0d002bf8' };
	
	const acs_endpoint = 'endpoint=https://smartcall-acs.communication.azure.com/;accesskey=XkUIJFy58CNmLxWnsXK4q2t7oMlMvivOlTwurKoiPVp5TSdHFqW3jIV7Ee/EJZCPxCV91ZcPfXQBnQ22JBRaaA==';
	const client = new ACS.CommunicationIdentityClient(acs_endpoint);	
	const response2 = await client.getToken(userId, ["chat", "voip"]);		
	const token = response2.token;	
	
	const resp1 = await fetch("/teams/api/openlink/sharedline/cas-omni-jjgartland", {method: "GET", headers: {authorization: "1234567890"}});	
	const line = await resp1.json();	
	const locator = {meetingLink: line.joinWebUrl};	
		
	button.addEventListener('click', async function() 	{	
		console.debug("click", open);
		
		if(!open){
			open = !open;
			content.style.display = 'block';
			button.innerHTML = 'X';
			
			const callAdapter = await callComposite.loadCallComposite({displayName: "JJ Gartland", locator,	userId,	token}, content, {formFactor: 'mobile',	key: new Date()	});
			const currentCall = await callAdapter.startCall([destination]);	
			
		} else if (open) {
			open = !open;
			content.style.display = 'none';
			button.innerHTML = buttonIcon;
		}
	});
});
