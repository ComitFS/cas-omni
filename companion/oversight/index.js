let callAgent, calls;

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
	
	const url = origin + "/plugins/casapi/v1/companion/config/global";			
	const response = await fetch(url, {method: "GET", headers: {authorization}});
	config = await response.json();	
	
	console.debug("setupACS", config, origin, userId, authorization);
	
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
	
	calls = [];	
	callAgent = await callClient.createTeamsCallAgent(tokenCredential);	

	callAgent.on('incomingCall', async event => {
		console.debug("incomingCall", event);
	});	

	callAgent.on('callsUpdated', event => 	{
		console.debug("callsUpdated", event); 	
		
		event.removed.forEach(removedCall => {	// happens before state change
			console.debug("removedCall", removedCall.callEndReason, removedCall.callerInfo);	
			delete calls[removedCall.id];			
		})
		
		event.added.forEach(addedCall => {
			console.debug("addedCall", addedCall, addedCall.callerInfo);
			calls[addedCall.id] = {call: addedCall};			
			
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
			makeCall(request.destination);	
		}
		else
			
		if (request.action == "intercomCall") 	{						
		
		}
		else
			
		if (request.action == "requestAction") {	
			const call = calls[request.call_id]?.call;
			
			if (call) {	
				if (request.request_action == "AnswerCall") 		acceptCall(call.id);
				if (request.request_action == "RejectCall") 		rejectCall(call.id);			
				if (request.request_action == "ClearConnection") 	hangupCall(call.id);			
				if (request.request_action == "HoldCall") 			holdCall(call.id);
				if (request.request_action == "RetrieveCall") 		resumeCall(call.id);
				if (request.request_action == "TransferCall") 		transferCall(call.id, request.destination);			
				if (request.request_action == "AddThirdParty") 		addThirdParty(call.id, request.destination);						
				if (request.request_action == "RemoveThirdParty") 	removeThirdParty(call.id, request.destination);						
				if (request.request_action == "StartScreenShare") 	startScreenShare(call.id);	
				if (request.request_action == "StopScreenShare") 	stopScreenShare(call.id);							
			} else {
				console.error("call not found", request.call_id, calls);
			}				
		}		
	});			
}

async function makeCall(destination) { 
	console.debug("makeCall", destination);

	if (destination.startsWith("+"))  {			
		call = await callAgent.startCall([{phoneNumber: destination.replaceAll(" ", "")}]);	  			
	} 
	else
		
	if (destination.startsWith("8:acs")) {
		call = await callAgent.startCall([{communicationUserId: destination }], {});					
	} 	
	else {
		call = await callAgent.startCall([{ microsoftTeamsUserId: destination }],	{});
	}
}

function hangupCall(id) {
	console.debug("hangupCall", id);
	
	if (!id || id == "all") {
		const existingCalls = Object.getOwnPropertyNames(calls);

		for (let i in existingCalls) {	
			const call = calls[existingCalls[i]].call;
			if (call) call.hangUp();
		}
	} else {	
		if (calls[id]?.call) {
			calls[id].call.hangUp();							
		}
	}
}