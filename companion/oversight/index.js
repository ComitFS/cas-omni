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
			setupACS(context);
		});

		microsoftTeams.registerOnThemeChangeHandler(function (theme) {
			console.log("change theme", theme);
		});	
	}	
});	

window.addEventListener("unload", function() {
	console.debug("window.unload", window.location.hostname);	
});

async function setupACS(context) {
	const origin = JSON.parse(localStorage.getItem("configuration.cas_server_url"));
	const authorization = JSON.parse(localStorage.getItem("configuration.cas_server_token"));
	const userId = context.userObjectId;
	
	console.debug("setupACS", origin, userId, authorization);
	
	async function fetchTokenFromServerForUser() {			
		const client = new ACS.CommunicationIdentityClient(config.acs_endpoint);			
		const url2 = origin + "/plugins/casapi/v1/companion/msal/token";				
		const resp = await fetch(url2, {method: "GET", headers: {authorization}});	
		const json = await resp.json();	
		const response2 = await client.getTokenForTeamsUser({teamsUserAadToken: json.access_token, clientId: config.client_id, userObjectId: userId});		
		const token = response2.token;	
		console.debug("fetchTokenFromServerForUser", token);
		return token;
	}		

	const token = await fetchTokenFromServerForUser();
	const callClient = new ACS.CallClient();
	const tokenCredential = new ACS.AzureCommunicationTokenCredential({tokenRefresher: async () => fetchTokenFromServerForUser(), token, refreshProactively: true});					
	
	callAgent = await callClient.createTeamsCallAgent(tokenCredential);	

	callAgent.on('incomingCall', async event => {
		console.debug("incomingCall", event);
	});	

	callAgent.on('callsUpdated', event => 	{
		console.debug("callsUpdated", event); 	
		
		event.removed.forEach(removedCall => {	// happens before state change
			console.debug("removedCall", removedCall.callEndReason, removedCall.callerInfo);				
		})
		
		event.added.forEach(addedCall => {
			console.debug("addedCall", addedCall, addedCall.callerInfo);
			
			addedCall.on('remoteParticipantsUpdated', e => {
				e.added.forEach(remoteParticipant => { 
				
				});
				
				e.removed.forEach(remoteParticipant => {
	
				});
			});	

			addedCall.on('isScreenSharingOnChanged', () => {
				console.debug("addedCall isScreenSharingOnChanged");
			});
			
			addedCall.on('stateChanged', async () => {
				console.debug("addedCall state", addedCall.state, addedCall.lobby, addedCall._lastTsCallMeetingDetails?.joinUrl);
				
				if (addedCall.state == "Connected")  {	

				}				
			});				
		});			
		
	});
	
	setupEventSource(origin, authorization, userId, token);	
}


async function setupEventSource(origin, casToken, userId, teamsToken) {
	const url = origin + "/plugins/casapi/sse?uid=" + userId + "&token=" + casToken;
	console.debug("setupEventSource", url);

	const source = new EventSource(url);
	
	source.onerror = event => {
		console.debug("onError", event);					
	};

	source.addEventListener('onSMSNotify', async event => {
		const data = JSON.parse(event.data);
		console.debug("onSMSNotify", data);
	});
	
	source.addEventListener('onMessage', async event => {
		const msg = JSON.parse(event.data);
		console.debug("onMessage", msg);
	});
	
	source.addEventListener('onCallListStatus', async event => {
		const data = JSON.parse(event.data);
		console.debug("onCallListStatus", data);		
	});
	
	source.addEventListener('onConnect', async event => {
		const profile = JSON.parse(event.data);	
		console.debug("onConnect", profile);		
	});
	
	source.addEventListener('onSignIn', async event => {
		const json = JSON.parse(event.data);	
		console.debug("onSignIn", json);		
	});
		
	source.addEventListener('onAction', event => {
		const request = JSON.parse(event.data);
		console.debug("onAction", request);			
		
		if (request.action == "makeCall") 	{	
				
		}
		else
			
		if (request.action == "intercomCall") 	{						
		
		}
		else
			
		if (request.action == "requestAction") {	
					
		}		
	});			
}