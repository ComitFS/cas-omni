let userId, identityClient, callAgent, calls, requests, origin, authorization, testLog;

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
			
	testLog = document.getElementById("test-log");
	testLog.innerHTML = "";		
	
	if (!!microsoftTeams) {
		microsoftTeams.initialize();
		microsoftTeams.appInitialization.notifyAppLoaded();

		microsoftTeams.getContext(async context => {
			microsoftTeams.appInitialization.notifySuccess();

			userId = context.userObjectId;			
			origin = context.subEntityId.cas_server_url;
			authorization = context.subEntityId.cas_server_token;	
			console.log("cas companion logged in user", context, userId, origin, authorization);			
	
			if (origin && authorization && userId) {
				setupACS(context);
			}
		});

		microsoftTeams.registerOnThemeChangeHandler(function (theme) {
			console.log("change theme", theme);
		});	
	}	
});	

async function setupACS(context) {
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

	logData("Ready For Business Testing preparing...");		
	const token = await fetchTokenFromServerForUser();
	logData("Fetched access token from CAS Server");
	
	const callClient = new ACS.CallClient();
	const tokenCredential = new ACS.AzureCommunicationTokenCredential({tokenRefresher: async () => fetchTokenFromServerForUser(), token, refreshProactively: true});					
	
	requests = [];
	calls = [];	
	callAgent = await callClient.createTeamsCallAgent(tokenCredential);	
	logData("Created ACS CallAgent");	

	callAgent.on('incomingCall', async event => {
		console.debug("incomingCall", event);
		const incomingCall = event.incomingCall;
		postCallStatus(incomingCall, "Notified");
		
		calls[incomingCall.id] = {call: incomingCall};				
		setTimeout(() => acceptCall(incomingCall.id), 2000);
		logData("Incoming call with ID " + incomingCall.id + " received");		

		incomingCall.on('callEnded', endedCall => {
			console.debug("endedCall", endedCall.callEndReason.code);	
			
			if (endedCall.callEndReason.code != 0) 
			{
				if (endedCall.callEndReason.subCode == 0 || (endedCall.callEndReason.subCode == 540487)) {
					postCallStatus(incomingCall, "Missed");	
					delete calls[incomingCall.id];
				}
				else
					
				if (endedCall.callEndReason.subCode == 10003) 
				{
					incomingCall.info.getServerCallId().then(result => {
						console.debug("incomingCall server call id", result, incomingCall.id);	
						calls[incomingCall.id].serverCallId = result;				
						postCallStatus(incomingCall, "Elsewhere");		
						delete calls[incomingCall.id];						
						
					}).catch(err => {
						console.error(err);		
						postCallStatus(incomingCall, "Elsewhere");
						delete calls[incomingCall.id];						
					});
				}					
			} else {
				delete calls[incomingCall.id];				
			}
				
			incomingCall.off('stateChanged', () => {});		
			logData("Incoming call with ID " + incomingCall.id + " has ended");		
		});			
	});	

	callAgent.on('callsUpdated', event => 	{
		console.debug("callsUpdated", event); 	
		
		event.removed.forEach(removedCall => {	// happens before state change
			console.debug("removedCall", removedCall.callEndReason, removedCall.callerInfo);	
			delete calls[removedCall.id];	
			logData("Call with ID " + removedCall.id + " has ended");				
		})
		
		event.added.forEach(addedCall => {
			console.debug("addedCall", addedCall, addedCall.callerInfo);
			calls[addedCall.id] = {call: addedCall};
			logData("Call with ID " + addedCall.id + " is now active");	
			
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
				logData("Call with ID " + addedCall.id + " is in state " + addedCall.state);					
				
				if (addedCall.state == "Connected")  
				{	
					addedCall.info.getServerCallId().then(result => {
						console.debug("addedCall server call id", result, addedCall.id);
						calls[addedCall.id].serverCallId = result;
						postCallStatus(addedCall);							
						
					}).catch(err => {
						console.error(err);
						postCallStatus(addedCall);							
					});
				}
				else 					
					
				if (addedCall.state == "Disconnected") 	{					
					addedCall.off('stateChanged', () => {});					
					if (calls[addedCall.id]?.serverCallId) delete calls[calls[addedCall.id].serverCallId];	
					delete calls[addedCall.id];					
				}				
			});				
		});			
		
	});
	
	setupEventSource();
	logData("Created Event source connection to CAS Server");
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
		logData("Ready For Business Testing waiting..");		
	});
	
	source.addEventListener('onSignIn', async event => {
		const json = JSON.parse(event.data);	
		console.debug("onSignIn", json);		
	});
		
	source.addEventListener('onAction', event => {
		const request = JSON.parse(event.data);
		console.debug("onAction", request);	
		logData("Received request " + request.action + " from CAS Server");		

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
	logData("Sending call state " +  (state ? state : call.state) + " to CAS Server");	
			
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
		participants: participants,
		serverCallId: calls[call.id]?.serverCallId		
	};
	
	if (data.callerInfo?.displayName == "Rooney") data.callerInfo.displayName = "JJ Gartland";

	const url = origin + "/plugins/casapi/v1/companion/callstatus";		
	const response = await fetch(url, {method: "POST", headers: {authorization}, body: JSON.stringify(data)});								
}

async function makeCall(destination, request) { 
	console.debug("makeCall", destination);
	logData("Make Call  to " +  destination);	
	
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
	logData("Answer Call with ID " +  id);	
	
	if (calls[id]?.call) {
		calls[id].call = await calls[id].call.accept({});
	}
}

function rejectCall(id) {
	logData("Reject Call with ID " +  id);		
	if (calls[id]?.call) calls[id].call.reject({});
}

function holdCall(id) {
	logData("Hold Call with ID " +  id);		
	if (calls[id]?.call) calls[id].call.hold();
}

function resumeCall(id) {
	logData("Resume Call with ID " +  id);	
	if (calls[id]?.call) calls[id].call.resume({});	
}

function hangupCall(id) {
	console.debug("hangupCall", id);
	logData("Hangup Call with ID " +  id);		
	
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
	logData("Start Ready For Business ACS Diagnostics");	
	
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
	
	logData("End Ready For Business ACS Diagnostics");		
	
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
	const url = origin + "/plugins/casapi/v1/companion/rfb/teststatus";		
	const body = JSON.stringify(payload);
	console.debug("readyForBusiness", url, payload);
	const response = await fetch(url, {method: "POST", headers: {authorization}, body});
	logData("Send Ready For Business ACS Diagnostics to CAS Server");	
}

function logData(data) {
	testLog.innerHTML += data + "<br/>";
}