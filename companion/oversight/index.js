let userId, identityClient, callAgent, calls, requests, origin, authorization;

window.addEventListener("unload", () => {
	console.debug("unload");
});

window.addEventListener("load", async () =>  {
	origin = JSON.parse(localStorage.getItem("configuration.cas_server_url"));
	authorization = JSON.parse(localStorage.getItem("configuration.cas_server_token"));	
	
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

async function setupACS(context) {
	userId = context.userObjectId;
	
	const url = origin + "/plugins/casapi/v1/companion/config/global";			
	const response = await fetch(url, {method: "GET", headers: {authorization}});
	config = await response.json();	
	
	console.debug("setupACS", config, origin, userId, authorization);
	
	async function fetchTokenFromServerForUser() {			
		identityClient = new ACS.CommunicationIdentityClient(config.acs_endpoint);			
		const url2 = origin + "/plugins/casapi/v1/companion/msal/token";				
		const resp = await fetch(url2, {method: "GET", headers: {authorization}});	
		const json = await resp.json();	
		const response2 = await identityClient.getTokenForTeamsUser({teamsUserAadToken: json.access_token, clientId: config.client_id, userObjectId: userId});		
		const token = response2.token;	
		console.debug("fetchTokenFromServerForUser", token);
		return token;
	}		

	const token = await fetchTokenFromServerForUser();
	const callClient = new ACS.CallClient();
	const tokenCredential = new ACS.AzureCommunicationTokenCredential({tokenRefresher: async () => fetchTokenFromServerForUser(), token, refreshProactively: true});					
	
	requests = [];
	calls = [];	
	callAgent = await callClient.createTeamsCallAgent(tokenCredential);	

	callAgent.on('incomingCall', async event => {
		console.debug("incomingCall", event);
		const incomingCall = event.incomingCall;
		
		postCallStatus(incomingCall, "Notified");	

		incomingCall.on('callEnded', endedCall => {
			console.debug("endedCall", endedCall.callEndReason.code);	
			
			if (endedCall.callEndReason.code != 0) 
			{
				if (endedCall.callEndReason.subCode == 0 || (endedCall.callEndReason.subCode == 540487)) {
					postCallStatus(incomingCall, "Missed");	
				}
				else
					
				if (endedCall.callEndReason.subCode == 10003) {
					postCallStatus(incomingCall, "Elsewhere");	
				}					
			}
				
			incomingCall.off('stateChanged', () => {});		
			delete calls[incomingCall.id];
		});			
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
				
				postCallStatus(addedCall, "ParticipantUpdated");				
			});	

			addedCall.on('isScreenSharingOnChanged', () => {
				console.debug("addedCall isScreenSharingOnChanged");
			});
			
			addedCall.on('stateChanged', async () => {
				console.debug("addedCall state", addedCall.state, addedCall.lobby, addedCall._lastTsCallMeetingDetails?.joinUrl);
				
				postCallStatus(addedCall);	
				
				if (addedCall.state == "Connected")  {	

				}				
			});				
		});			
		
	});
	
	setupEventSource();	
}

async function setupEventSource() {
	const url = origin + "/plugins/casapi/sse?uid=" + userId + "&token=" + authorization;
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

		if (request.call_id) {
			requests[request.call_id] = request;		
		}
		
		if (request.action == "testCall") {		
			readyForBusiness();			
		}
		else
			
		if (request.action == "makeCall") 	{	
			makeCall(request.destination, request);	
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

async function postCallStatus(call, state)  {
	console.debug("postCallStatus", call.tsCall?.threadId, call.id, state, call.state, requests[call.id]);	
	const participants = [];
	const request = requests[call.id];
	
	for (let index in call.remoteParticipants)	{
		const participant = call.remoteParticipants[index];
		participants.push({identifier: participant.identifier, state: participant.state, muted: participant.isMuted, speaking: participant.isSpeaking, displayName: participant.displayName});
	}	
	
	const data = {
		id: call.id,
		interest: requests[call.id]?.interest,
		account: userId,		
		direction: call.direction ? call.direction : "Incoming",
		state: state ? state : call.state,
		callerInfo: call.callerInfo,
		destination: calls[call.id]?.destination,
		url: calls[call.id]?.url,	
		threadId: call.tsCall?.threadId,		
		participants: participants			
	};
	
	if (data.callerInfo?.displayName == "Rooney") data.callerInfo.displayName = "JJ Gartland";

	const url = origin + "/plugins/casapi/v1/companion/callstatus";		
	const response = await fetch(url, {method: "POST", headers: {authorization}, body: JSON.stringify(data)});								
}

async function makeCall(destination, request) { 
	console.debug("makeCall", destination);
	let call;
	
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
	
	if (call) {
		if (!calls[call.id]) calls[call.id] = {};
		calls[call.id].call = call;	
		requests[call.id] = request;		
	}	
}

function muteCall(id) {	
	if (calls[id]?.call) calls[id].call.mute({});
}

function unmuteCall(id) {	
	if (calls[id]?.call) calls[id].call.unmute({});	
}

async function acceptCall(id) {
	holdExistingCalls();
	
	if (calls[id]?.call) {
		calls[id].call = await calls[id].call.accept({});
	}
}

function rejectCall(id) {
	if (calls[id]?.call) calls[id].call.reject({});
}

function holdCall(id) {
	if (calls[id]?.call) calls[id].call.hold();
}

function resumeCall(id) {	
	if (calls[id]?.call) calls[id].call.resume({});	
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

async function readyForBusiness() {	
	const user = await identityClient.createUser();
	const userid = user.communicationUserId;				
	const response2 = await identityClient.getToken({communicationUserId: user.communicationUserId}, ["chat", "voip"]);	
	const tokenCredential = new ACS.AzureCommunicationTokenCredential(response2.token);
	const callClient = new ACS.CallClient();				
	const preCallDiagnosticsResult = await callClient.feature(ACS.Features.PreCallDiagnostics).startTest(tokenCredential);
	
	console.debug("readyForBusiness", preCallDiagnosticsResult);	
	
	const browserSupport =  await preCallDiagnosticsResult.browserSupport;
	
	if (browserSupport) {
		console.debug("readyForBusiness - browser", browserSupport.browser);
		console.debug("readyForBusiness - O/S", browserSupport.os);
	}	
	
	const deviceAccess =  await preCallDiagnosticsResult.deviceAccess;
	
	if (deviceAccess) {
		console.debug("readyForBusiness - audio", deviceAccess.audio);
		console.debug("readyForBusiness - video", deviceAccess.video);		
	}

	const deviceEnumeration = await preCallDiagnosticsResult.deviceEnumeration;
	
	if (deviceEnumeration) {
		console.debug("readyForBusiness - microphone", deviceEnumeration.microphone);
		console.debug("readyForBusiness - camera", deviceEnumeration.camera);
		console.debug("readyForBusiness - speaker", deviceEnumeration.speaker);
	}	
	
	const inCallDiagnostics =  await preCallDiagnosticsResult.inCallDiagnostics;
	
	if (inCallDiagnostics) {    
		console.debug("readyForBusiness - connected", inCallDiagnostics.connected)
		console.debug("readyForBusiness - bandwidth", inCallDiagnostics.bandWidth)
		console.debug("readyForBusiness - audio diag", inCallDiagnostics.diagnostics.audio)
		console.debug("readyForBusiness - video diag", inCallDiagnostics.diagnostics.video)
	}

	/*
	const callMediaStatistics =  await preCallDiagnosticsResult.callMediaStatistics;
	
	if (callMediaStatistics) {    
		console.debug("readyForBusiness - callMediaStatistics", callMediaStatistics);

		// Undocumented - guess work		
		const opt = {aggregationInterval: 2,  dataPointsPerAggregation: 20};
		const mediaStatsCollector = callMediaStatistics.startCollector(opt);

		mediaStatsCollector.on('mediaStatsEmitted', (mediaStats) => {
			console.debug('readyForBusiness - media stats:', mediaStats.stats);
			console.debug('readyForBusiness - media stats collectionInterval:', mediaStats.collectionInterval);
			console.debug('readyForBusiness - media stats aggregationInterval:', mediaStats.aggregationInterval);
		});		
	}	
	*/
	
	const payload = {
		account: userId,
		browser:  browserSupport.browser,
		os:  browserSupport.os,
		audio: {device: deviceAccess.audio, diagnostics: inCallDiagnostics.diagnostics.audio}, 
		video: {device: deviceAccess.video, diagnostics: inCallDiagnostics.diagnostics.video}, 		
		device: deviceEnumeration,		
		connected: inCallDiagnostics.connected,
		bandwidth: inCallDiagnostics.bandWidth		
	};	
	const url = origin + "/plugins/casapi/v1/companion/teststatus";		
	const body = JSON.stringify(payload);
	console.debug("readyForBusiness", payload);
	const response = await fetch(url, {method: "POST", body});		
}