let client = null;
let device = null;
let profile = null;
let deviceManager = null;
let msalInstance = null;
let account = null;
let serviceWorkerRegistration = null;
let casUrl = null;
let hidDevice = null;
let streamDeck = null;
let online = false;
let graphAPIToken = null;
let remoteVideoContainer = null;
let dialerContainer = null;
let extendedCallOutgong = null;
let casChat = null;
let smsClient = null;
let authorization = null;

const chat = {messages: {}, senders: {}, calls: {}};
const calls = {};
const extended_calls = {};
const media = {};
const buttons = {};	
const speakers = {};	
const streamers = {};
const intercoms = {};
const webAppsWindow = {};

ACS.getUserMedia = function(constraints) {
	console.debug("ACS.getUserMedia", constraints);
	return navigator.mediaDevices.getUserMedia(constraints);
}
 
window.addEventListener("unload", function () {
	disconnectHidDevice();
	if (streamDeck?.device) streamDeck.disconnect();	
	closeAllWindows();
});

window.addEventListener("load", function() {
    setDefaultSetting("cas_server_url", "http://localhost:7070");
	casUrl = getSetting("cas_server_url");		
	const url = casUrl + getRootPath() + "/config/global";
		
	if (getSetting("cas_access_token", null) != null)
	{		
		setOffline();		
		
		fetch(url, {method: "GET"}).then(response => {return response.json()}).then(config => {

			if (config.acs_endpoint && config.client_id)
			{
				if (!getSetting("cas_bring_your_own_identity", false)) {
					setupGraphAPI(config);
				} else {
					setupACSComms(config);
				}
			}
		}).catch(function (error) {
			console.error("loginUser", error);
			setOffline();	
			openSettings();			
		});	
	} else {
		openSettings();
	}		
});

// -------------------------------------------------------
//
//  ACS/Teams Authentication
//
// -------------------------------------------------------		

async function setupGraphAPI(config) {
	const redirectUri = chrome.identity.getRedirectURL();
	console.debug("setupGraphAPI", redirectUri);	
	
	try {
		let token = null;
			
		msalInstance = new window.ACS.PublicClientApplication({
			auth: {
				authority: "https://login.microsoftonline.com/common/",
				clientId: config.client_id,
				redirectUri,
				postLogoutRedirectUri: redirectUri
			},
			cache: {
				cacheLocation: "localStorage"
			}
		});

		const url = await getLoginUrl();
		const result = await launchWebAuthFlow(url);
		console.debug("username=>", result.account.username);	

		const {accessToken} = await acquireToken({
			scopes: [ "Chat.Create", "Chat.ReadWrite", "user.read", "OnlineMeetingArtifact.Read.All",  "OnlineMeetings.ReadWrite", "Presence.Read.All" ], 
			account: msalInstance.getAllAccounts()[0]
		});	
		console.debug("MS Graph token", accessToken);	
		graphAPIToken = "Bearer " + accessToken;
				
		const response = await fetch("https://graph.microsoft.com/v1.0/me", {method: "GET", headers: {authorization: graphAPIToken}});
		//console.debug("setupGraphAPI", response);	
		const data = await response.json();	
		console.debug("setupGraphAPI - profile", data.displayName, data);	

		
		const response2 = await fetch("https://graph.microsoft.com/v1.0/me/chats?$expand=members", {method: "GET", headers: {authorization: graphAPIToken}});
		//console.debug("setupGraphAPI", response2);	
		const chats = await response2.json();	
		//console.debug("setupGraphAPI - chats", chats);	

		if (chats.value && chats.value.length > 0) {
			for (let chat of chats.value) {
				if ((chat.chatType == "oneOnOne" && chat.members.length  == 2) || (chat.chatType == "meeting")) {
					console.debug("setupGraphAPI - chat", chat.id, chat);
/*				
					const response3 = await fetch(`https://graph.microsoft.com/v1.0/me/chats/${chat.id}/messages?$top=50`, {method: "GET", headers: {authorization: graphAPIToken}});
					//console.debug("setupGraphAPI", response3);	
					const messages = await response3.json();

					for (let message of messages.value) {
						//console.debug("setupGraphAPI - message", message.body?.content, message);					
					}	
*/
				}					
			}
		}
		
		setupACSComms(config);
		
	} catch (e) {
		console.error("setupGraphAPI", e);		
	}
}

async function getUserProperties() {
	const webUrl = casUrl + getRootPath() + "/config/properties";	
	authorization = getSetting("cas_access_token");
	const response = await fetch(webUrl, {method: "GET", headers: {authorization}});
	return await response.json();	
}
	
async function setupACSComms(config) {
	const webUrl = casUrl + getRootPath() + "/config/properties";		
	const redirectUri = chrome.identity.getRedirectURL();
	console.debug("setupACSComms", redirectUri);	
	
	try {
		client = new ACS.CommunicationIdentityClient(config.acs_endpoint);
		let token = null;
		const property = await getUserProperties();	
			
		if (!getSetting("cas_bring_your_own_identity", false)) {
			msalInstance = new window.ACS.PublicClientApplication({
				auth: {
					authority: "https://login.microsoftonline.com/common/",
					clientId: config.client_id,
					redirectUri,
					postLogoutRedirectUri: redirectUri
				},
				cache: {
					cacheLocation: "localStorage"
				}
			});

			const url = await getLoginUrl();
			const result = await launchWebAuthFlow(url);
			console.debug("username=>", result.account.username);	

			const {accessToken} = await acquireToken({
				scopes: [ 
					"https://auth.msft.communication.azure.com/Teams.ManageCalls",
					"https://auth.msft.communication.azure.com/Teams.ManageChats"
				],
				account: msalInstance.getAllAccounts()[0]
			});	
			
			account = msalInstance.getAllAccounts()[0];			
			console.debug("AAD token", account, accessToken);			
			const response = await client.getTokenForTeamsUser({teamsUserAadToken: accessToken, clientId: config.client_id, userObjectId: account.localAccountId});
			token = response.token;			
			console.debug("loggedIn MS Teams user token", token, account, property);			
			setupChatEndpoint(config, property);
			// setupTeamsChatEndpoint(token, config, property);
			
		} else {

			if (!property.ms_teams_id) {				
				const user = await client.createUser();
				property.ms_teams_id = user.communicationUserId;				
				const body = JSON.stringify([{name: "ms_teams_id", value: user.communicationUserId}]);
				await fetch(webUrl, {method: "POST", headers: {authorization}, body});				
			}

			chrome.identity.getProfileUserInfo(async (info) => {
				console.debug("Logged-In Browser User", info);
				const body = JSON.stringify([{name: "browser_identity_email", value: info.email}, {name: "browser_identity_id", value: info.id}]);
				await fetch(webUrl, {method: "POST", headers: {authorization}, body});					
			});
					
			const response2 = await client.getToken({communicationUserId: property.ms_teams_id}, ["voip"]);
			const phoneNumber = property.ms_phone_number ? "+" + property.ms_phone_number : null;
			account = {localAccountId: property.ms_teams_id, name: property.name, phoneNumber};			
			token = response2.token;
			console.debug("loggedIn ACS user token", token, account, property);				
		}
		
		account.username = property.username;
		smsClient = new ACS.SmsClient(config.acs_endpoint);		
		if (token) setupEventSource(token, config, property);

		// TODO remove when done testing
		//readyForBusiness();		
		
	} catch (e) {
		console.error("setupACSComms", e);
		setOffline();	
		openSettings();			
	}
}

async function getLoginUrl(request, reject) {
    return new Promise((resolve) => {
        msalInstance.loginRedirect({
            ...request,
            onRedirectNavigate: (url) => {
                resolve(url);
                return false;
            }
        }).catch(reject);
    });
}

async function launchWebAuthFlow(url) {
    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
            interactive: true,
            url
        }, (responseUrl) => {
            // Response urls includes a hash (login, acquire token calls)
            if (responseUrl.includes("#")) {
                msalInstance.handleRedirectPromise(`#${responseUrl.split("#")[1]}`)
                    .then(resolve)
                    .catch(reject)
            } else {
                // Logout calls
                resolve();
            }
        })
    })
}

async function acquireToken(request) {
    return msalInstance.acquireTokenSilent(request)
        .catch(async (error) => {
            console.error(error);
            const acquireTokenUrl = await getAcquireTokenUrl(request);

            return launchWebAuthFlow(acquireTokenUrl);
        })
}

async function getAcquireTokenUrl(request) {
    return new Promise((resolve, reject) => {
        msalInstance.acquireTokenRedirect({
            ...request,
            onRedirectNavigate: (url) => {
                resolve(url);
                return false;
            }
        }).catch(reject);
    });
}

async function createCallAgent(token, config) {
	console.debug("createCallAgent token", token, config);	
	const tokenCredential = new ACS.AzureCommunicationTokenCredential(token);
	const callClient = new ACS.CallClient();
	deviceManager = await callClient.getDeviceManager();		

	media.localCameras = await deviceManager.getCameras();
	media.localMicrophones = await deviceManager.getMicrophones();
	media.localSpeakers = await deviceManager.getSpeakers();	
	console.debug("createCallAgent devices", media); 
	
	const devices = {microphones: [], speakers: []};
	for (mic in media.localMicrophones) devices.microphones.push({value: mic, text : media.localMicrophones[mic].name});
	for (spkr in media.localSpeakers) 	devices.speakers.push({value: spkr, text : media.localSpeakers[spkr].name});
	chrome.storage.local.set({devices});
	
	let paras = {};
	if (account.phoneNumber) paras = {displayName: account.name};
	device = await callClient.createCallAgent(tokenCredential, paras);
	
	setupCallHandlers(device);
}

async function readyForBusiness() {				
	const user = await client.createUser();
	const userid = user.communicationUserId;				
	const response2 = await client.getToken({communicationUserId: user.communicationUserId}, ["chat", "voip"]);	
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
		account: account.localAccountId,
		browser:  browserSupport.browser,
		os:  browserSupport.os,
		audio: {device: deviceAccess.audio, diagnostics: inCallDiagnostics.diagnostics.audio}, 
		video: {device: deviceAccess.video, diagnostics: inCallDiagnostics.diagnostics.video}, 		
		device: deviceEnumeration,		
		connected: inCallDiagnostics.connected,
		bandwidth: inCallDiagnostics.bandWidth		
	};		
	const url = casUrl + getRootPath() + "/teststatus";	
	const body = JSON.stringify(payload);
	console.debug("readyForBusiness " + account.name, body);
	const response = await fetch(url, {method: "POST", body});		
}

async function setupEventSource(msToken, config, property) {
	const source = new EventSource(casUrl + "/teams/sse?uid=" + account.localAccountId + "&token=" + getSetting("cas_access_token"));

	source.onerror = event => {
		console.debug("onError", event);			
		if (online) openSettings();	
		setOffline();		
	};

	source.addEventListener('onMessage', async event => {
		const msg = JSON.parse(event.data);
		handleChatMessage(msg);	
	});

	source.addEventListener('onRegister', async event => {
		const json = JSON.parse(event.data);
		console.debug("onRegister", json);	
		const baseUrl = json.url + "/teams/webauthn";
		openWebAppsWindow(baseUrl + "/?action=register&authorization=" + json.authorization, baseUrl, undefined, 600, 600);	
	});
	
	source.addEventListener('onRegistered', async event => {
		console.debug("onRegistered", event.data);	
		const json = JSON.parse(event.data);		
		closeWebAppsWindow(json.url + "/teams/webauthn");	
	});
	
	source.addEventListener('onIdentify', async event => {
		const json = JSON.parse(event.data);
		console.debug("onIdentify", json);	
		const baseUrl = json.url + "/teams/webauthn";
		openWebAppsWindow(baseUrl + "/?action=identify&authorization=" + json.authorization, baseUrl, undefined, 600, 600);			
	});

	source.addEventListener('onIdentified', async event => {
		console.debug("onIdentified", event.data);	
		const json = JSON.parse(event.data);		
		closeWebAppsWindow(json.url + "/teams/webauthn");	
	});
	
	source.addEventListener('onConnect', async event => {
		profile = JSON.parse(event.data);
		console.debug("onConnect", profile);	
		
		chrome.storage.local.set({profile});		

		if (device == null) {
			await createCallAgent(msToken, config);
			setupUI(property);		
			setOnline();
			setupDevices();				

		} else {
			closeAllWindows();
			setTimeout(() => {chrome.runtime.reload()}, 3000);	// wait for server to synch with Graph API
		}
	});

	source.addEventListener('onSMSNotify', async event => {
		const sms = JSON.parse(event.data);
		console.debug("onSMSNotify", sms);
		handleSMSMessage(sms);	
	});
		
	source.addEventListener('onAction', event => {
		const request = JSON.parse(event.data);
		console.debug("onAction", request);		
		
		if (request.action == "makeCall") {			
			if (request.type == "L") makeCall(request.interest, request.features);	
			if (request.type == "D") makeCall(request.destination, request.features);	
		}
		else
			
		if (request.action == "getPresence") {		
			if (graphAPIToken) getPresence();			
		}		
		else
			
		if (request.action == "testCall") {		
			if (client) readyForBusiness();			
		}
		else 
			
		if (request.action == "intercomCall") {		
			if (request.type == "L") makeCall(request.interest);		
			if (request.type == "D") intercomCall(request.destination);		
		}
		else

		if (request.action == "autoAnswer") {		
			intercoms[request.interest] = request;	
		}
		else	
			
		if (request.action == "requestAction") {
			if (request.request_action == "CaptionCall") 		captionCall(request.call_id);			
			if (request.request_action == "RecordCall") 		recordCall(request.call_id);		
			if (request.request_action == "AnswerCall") 		acceptCall(request.call_id);
			if (request.request_action == "ExtendCall") 		extendCall(request.call_id, request.destination);	
			if (request.request_action == "StartScreenShare") 	startScreenShare(request.call_id);	
			if (request.request_action == "StopScreenShare") 	stopScreenShare(request.call_id);				
			if (request.request_action == "RejectCall") 		rejectCall(request.call_id);			
			if (request.request_action == "ClearConnection") 	hangupCall(request.call_id);			
			if (request.request_action == "HoldCall") 			holdCall(request.call_id);
			if (request.request_action == "RetrieveCall") 		resumeCall(request.call_id);
			if (request.request_action == "TransferCall") 		transferCall(request.call_id, request.destination);			
			if (request.request_action == "AddThirdParty") 		addThirdParty(request.call_id, request.destination);						
			if (request.request_action == "RemoveThirdParty") 	removeThirdParty(request.call_id, request.destination);						
		}		
	});			
}

// -------------------------------------------------------
//
//  UI and Devices
//
// -------------------------------------------------------

function setupUI(property) {
	setupChromeHandlers();
	setupServiceWorker();	
	setupMedia();

	if (getSetting("cas_enable_streamdeck", false)) {
		setupStreamDeck();
	}
	
	if (getSetting("cas_enable_midi_controller", false)) {
		setupMidiController();
	}
	
	remoteVideoContainer = document.getElementById('remotescreenshare');
	remoteVideoContainer.hidden = true;
	
	if (getSetting("cas_enable_cas_dialler", false)) {	
		casChat = new CasChat(property);
		dialerContainer = document.getElementById('dialer');	
		dialerContainer.hidden = false;
	}
 }

function setupServiceWorker() {
	console.debug("setupServiceWorker");	

	function initialiseError(error) {
		console.error("initialiseError", error);
	}

	function initialiseState(registration) {
		if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
			console.warn('Notifications aren\'t supported.');
			return;
		}

		if (Notification.permission === 'denied') {
			console.warn('The user has blocked notifications.');
			return;
		}

		if (!('PushManager' in window)) {
			console.warn('Push messaging isn\'t supported.');
			return;
		}

		console.debug("setupServiceWorker - initialiseState", registration);

		navigator.serviceWorker.ready.then(svcWorkerRegistration =>
		{
			console.debug("setupServiceWorker - initialiseState ready", svcWorkerRegistration);
			serviceWorkerRegistration = svcWorkerRegistration;				
		});
	}
	
	navigator.serviceWorker.getRegistration('/').then(initialiseState, initialiseError);

	const actionChannel = new BroadcastChannel('ms-teams-action');
	
    actionChannel.addEventListener('message', event =>
	{
		console.debug("setupServiceWorker - notication action", event.data);

		if (event.data.action == "speak") unmuteCall(event.data.id);		
		if (event.data.action == "accept") acceptCall(event.data.id);
		if (event.data.action == "reject") rejectCall(event.data.id);	
		if (event.data.action == "hold") holdCall(event.data.id);	
		if (event.data.action == "hangup") hangupCall(event.data.id);	
		if (event.data.action == "resume") resumeCall(event.data.id);
		
		if (event.data.action == "call") {
			const target = getDestinationFromEmail(event.reply);
			
			if (target) {
				makeCall(target);			
			} else {
				setTimeout(showOutgoingNotification);
			}
		}
		
		if (event.data.action == "reply" && event.data.reply && event.data.reply != "") {
			sendSms([event.data.payload.from], event.data.reply, event.data.payload.reply);
		}			
	});		
}

function setupChromeHandlers() {
	console.debug("setupChromeHandlers");

	chrome.action.onClicked.addListener(() => {
		showOutgoingNotification();	
		setOnline();
	});
	
	chrome.contextMenus.onClicked.addListener((info) => {
		console.debug("contextMenus", info);
		
		if (info.menuItemId == "cas_right_click") {
			const destination = getDestinationFromEmail(info.selectionText);
			makeCall(destination);
		}		
	});
		
	chrome.commands.onCommand.addListener(function(command)
	{
		console.debug('Command:', command);
		
		if (command == "activate_dialer") {
			showOutgoingNotification();
		}
	});		
	
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		console.debug("onMessage", request, sender, sendResponse);
		
		if (request.setMicrophone) {
			console.debug("onMessage - setMicrophone", request.setMicrophone.mic);		
			setMicrophone(request.setMicrophone.mic);	
		}
		else
			
		if (request.setSpeaker) {
			console.debug("onMessage - setSpeaker", request.setSpeaker.spkr);		
			setSpeaker(request.setSpeaker.spkr);	
		}
		else
			
		if (request.setupMedia) {
			console.debug("onMessage - setupMedia");		
			setupMedia();	
		}	
		else
			
		if (request.drawAttention) {
			console.debug("onMessage - drawAttention", request.drawAttention.flag, cas.winId);		
		}
		else
			
		if (request.makeCall) {
			let destination = request.makeCall.destination;
			console.debug("onMessage - makeCall", destination);
			
			if (destination.indexOf("@") > -1) {
				destination = getDestinationFromEmail(destination);
			}
					
			makeCall(destination);
		}			
	});

	chrome.windows.onCreated.addListener(function(window)
	{
		console.debug("opening window ", window);
	});

	chrome.windows.onRemoved.addListener(function(win)
	{
		console.debug("closing window ", win);
		
		var webApps = Object.getOwnPropertyNames(webAppsWindow);

		for (var i=0; i<webApps.length; i++)
		{
			if (webAppsWindow[webApps[i]] && win == webAppsWindow[webApps[i]].id)
			{
				delete webAppsWindow[webApps[i]];
				break;
			}
		}
	});
		
	chrome.contextMenus.create({id: "cas_right_click", type: "normal", title: "Phone %s", contexts: ["selection"]});	
}

function setupDevices() {			
	const deviceKeys = {};
	
	profile.interests.forEach(interest =>
	{
		console.debug("setupDevices - interest", interest);
		if (interest?.type) deviceKeys[interest.type.toLowerCase() + ":" + interest.value] = interest;	
	});	
	
	profile.features.forEach(feature =>
	{
		console.debug("setupDevices - feature", feature);		
		if (feature?.type) deviceKeys[feature.type.toLowerCase() + ":" + feature.value] = feature;					
	});	
	
	for (let i=0; i<32; i++)
	{
		const key = getSetting("cas_speed_dial_" + i, null);
		
		if (key && deviceKeys[key])
		{
			const button = deviceKeys[key];
			button.value = button.value.replaceAll(" ", "");
			
			if (button.type == "SpeedDial" && !button.value.startsWith("+"))	{
				const countryCode = getSetting("cas_telephone_contry_code", "en-GB").substring(3);
				const numberObjEvt = libphonenumber.parsePhoneNumber(button.value, countryCode);
				button.value = numberObjEvt.format('E.164');	
			}
			
			if (button.type == "DirectLine")	{			
				button.threadId = createThread(button.value);		
			}				
			
			button.background = "black";
			button.keyValue = i;
			buttons[i] = button;			

			if (streamDeck) {			
				streamDeck.writeText(button.keyValue, button.label, "white", button.background);
			}

			if (dialerContainer) {			
				setupCASPanel(button, false);
			}
		}
	}	

	for (let i=0; i<16; i++)
	{
		const key = getSetting("cas_speaker_" + i, null);
		
		if (key && deviceKeys[key])
		{
			const speaker = deviceKeys[key];
			speaker.keyValue = i;
			speakers[i] = speaker;
		}
	}

	if (getSetting("cas_auto_connect_speakers", false)) setupSpeakers();
}

function setupMidiController() {
	let input = null;
	let output = null;	
	
	WebMidi.enable((err) => 
	{
	  if (err) {
		console.error("WebMidi could not be enabled.");
		
	  } else {		  
		console.debug("WebMidi enabled!", WebMidi);	

		if (WebMidi.inputs.length > 0)
		{
			for (let i=0; i<WebMidi.inputs.length; i++)
			{
				const selected = WebMidi.inputs[i].name == getSetting("cas_midi_controller", "X-TOUCH MINI");
				
				if (selected) {
					input = WebMidi.inputs[i];
					break;
				}
			}
			
			for (let i=0; i<WebMidi.outputs.length; i++)
			{
				const selected = WebMidi.outputs[i].name == getSetting("cas_midi_controller", "X-TOUCH MINI");
				
				if (selected) {
					output = WebMidi.outputs[i];
					break;
				}
			}			
			if (output) media.midiOut = output;
			
            if (input) {
				media.midiIn = input;
				
                input.addListener('noteon', "all", function (e)
                {
                    console.debug("Received 'noteon' message (" + e.note.name + " " + e.note.name + e.note.octave + ").", e.note);					
					if (media.midiIn.name == "X-TOUCH MINI") handleXTouchNoteEvent(e);
                });

                input.addListener('controlchange', "all", function (e)
                {
					if (media.midiIn.name == "X-TOUCH MINI") handleXTouchControlEvent(e);										
                });
				
                input.addListener('programchange', "all", function (e)
                {
					console.debug("Received 'programchange' message", e);
                });	

				if (media.midiIn.name == "X-TOUCH MINI") {	
					resetXTouch();					
				}			
            }			
		}
		else {
			console.warn("NO MIDI devices available");
		}	
	  }

	}, false);	
}

function handleSpeakerDevice(call, state) {
	let speaker = null;
	
	function getSpeaker(call) {		
		for (let but in speakers) {
			if (speakers[but].value == call?.__destination || speakers[but].value == call.callerInfo?.identifier?.phoneNumber || speakers[but].value == call.callerInfo?.identifier?.microsoftTeamsUserId || speakers[but].label == call.callerInfo.displayName) {
				speakers[but].call = call;				
				return speakers[but];
			}
		}
		return null;
	}	
		
	speaker = getSpeaker(call);

	if (speaker) {
		console.debug("handleSpeakerDevice", state, speaker, call);
			
		if (state == "Connecting" && call.direction == "Outgoing")
		{			
			if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchSpeaker(speaker.keyValue, "flash");
			
		}
		else
			
		if (state == "Connected")
		{			
			if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchSpeaker(speaker.keyValue, "on");
			if (!call.isMuted) setTimeout(() => {call.mute()}, 1000);
		}
		else
			
		if (state == "LocalHold")
		{		
			if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchSpeaker(speaker.keyValue, "flash");				
		}		
		else		
			
		if ((state == "Disconnected" || state == "Missed"))
		{					
			if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchSpeaker(speaker.keyValue, "off");
			
			speaker.call = null;
			delete speaker.call;
		}	
		else
			
		if ((state == "None" || state == "Notified")  && call.direction == "Incoming")
		{			
			if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchSpeaker(speaker.keyValue, "flash");				
		}	
	}		
}

function setupCASPanel(button, soft) {
	console.debug("setupCASPanel", button);

	let panel = dialerContainer.querySelector('#cas-panel-' + button.keyValue);
	
	if (!panel) {
		panel = document.createElement("cas-call");
		panel.button = button;
		button.panel = panel;
		
		panel.id = "cas-panel-" + button.keyValue;	
		panel.soft = soft;		
		panel.name = button.label;
		panel.initials = getInitials(button.label);
		panel.direction = 'outgoing';	
		panel.number = button.value;
		
		if (soft) {
			dialerContainer.append(panel);			
		} else {
			dialerContainer.prepend(panel);
		}
	}
	return panel;
}

function handleCallDevice(call, state) {
	let button = null;
	
	function getButton(call) {		
		for (let but in buttons) {
			if (buttons[but].value == call?.__destination || buttons[but].value == call.callerInfo?.identifier?.phoneNumber || buttons[but].value == call.callerInfo?.identifier?.microsoftTeamsUserId || buttons[but].label == call.callerInfo.displayName) {
				buttons[but].call = call;				
				return buttons[but];
			}
		}
		return null;
	}	
		
	button = getButton(call);

	if (button) {
		handleCallState(call, state, button);	
	}
	else 
		
	if (call.callerInfo) {  
		button = {
			call: call,
			keyValue: 'soft-panel-' + Math.floor(Math.random() * 16), 
			value: call.callerInfo.identifier?.phoneNumber || call.callerInfo?.identifier?.microsoftTeamsUserId, 
			label: call.callerInfo.displayName || "Anonymous"
		};
		buttons[call.id] = button;
		setupCASPanel(button, true);
		handleCallState(call, state, button);			
	}	
}

function handleCallState(call, state, button) {
	console.debug("handleCallState", state, button, call);
	
	if (button.panel) button.panel.state = state;		
		
	if (state == "Connecting" && call.direction == "Outgoing")
	{			
		if (streamDeck) streamDeck.writeText(button.keyValue, button.label, "white", "gray");
		if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchButton(button.keyValue, "flash");	
	}
	else
		
	if (state == "Connected")
	{			
		if (streamDeck) streamDeck.writeText(button.keyValue, button.label, "white", "green");
		if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchButton(button.keyValue, "on");
		
		if (button.panel) button.panel.updateClock();			
	}
	else
		
	if (state == "LocalHold")
	{		
		if (streamDeck) streamDeck.writeText(button.keyValue, button.label, "white", "brown");
		if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchButton(button.keyValue, "flash");				
	}		
	else		
		
	if ((state == "Disconnected" || state == "Missed"))
	{					
		if (streamDeck) streamDeck.writeText(button.keyValue, button.label, "white", "black");	
		if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchButton(button.keyValue, "off");

		if (button.panel && button.panel.soft) {
			delete buttons[call.id];			
		}
		button.call = null;
		delete button.call;
	}	
	else
		
	if ((state == "None" || state == "Notified") && call.direction == "Incoming")
	{		
		if (streamDeck) streamDeck.writeText(button.keyValue, button.label, "white", "red");	
		if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchButton(button.keyValue, "flash");				
	}			
}

function handleButtonPress(i) {
	console.debug("handleButtonPress", i, buttons[i]);

	if (buttons[i]) {
		const call = buttons[i].call;

		if (call)
		{
			if (call.state == "None" || call.state == "Notified") 	acceptCall(call.id);
			if (call.state == "Connected") 	hangupCall(call.id);
			if (call.state == "LocalHold")  resumeCall(call.id);						
			
			if (buttons[i].type == "GroupIntercom") 	hangupCall(call._id);							
		}						
		else {	
			if (buttons[i].type == "SpeedDial") 		makeCall(buttons[i].value);							
			if (buttons[i].type == "DirectLine") 		makeCall(buttons[i].value);	
			if (buttons[i].type == "PhoneNumber") 		makePromptCall();							
			if (buttons[i].type == "GroupIntercom")  	intercomCall(buttons[i].value);
		}	
	} else console.warn("button undefined");		
}

function setupSpeakers() {

	for (let i=0; i<16; i++)
	{	
		if (speakers[i]) {
			console.debug("setupSpeakers", speakers[i]);				
			
			const call = speakers[i].call;
			if (!call) setupSpeaker(i);	
		} 	
	}
}

function setupSpeaker(i) {
	if (speakers[i].type == "SpeedDial") 		makeCall(speakers[i].value);							
	if (speakers[i].type == "DirectLine") 		makeCall(speakers[i].value);	
	if (speakers[i].type == "PhoneNumber") 		makeCall(speakers[i].value);							
	if (speakers[i].type == "GroupIntercom")  	intercomCall(speakers[i].value);	
}

function handleSpeakerPress(i) {
	console.debug("handleSpeakerPress", i);

	if (speakers[i]) {
		const speaker = speakers[i];
		const call = speaker.call;

		if (call)
		{
			if (call.state == "LocalHold")  resumeCall(call.id);
			
			if (call.isMuted) {
				call.unmute();	
				if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchSpeaker(speaker.keyValue, "flash");
			} else {
				call.mute();
				if (media.midiIn && media.midiIn.name == "X-TOUCH MINI") setXTouchSpeaker(speaker.keyValue, "on");				
			}						
		} else {
			setupSpeaker(i);	
		}			
	} else console.warn("speaker undefined");		
}

// -------------------------------------------------------
//
//  StreamDeck device support
//
// -------------------------------------------------------

function setupStreamDeck() {
	streamDeck = new StreamDeckXL();
	
	streamDeck.connect(function(error)
	{
		if (!error)
		{
			streamDeck.reset();
			streamDeck.setBrightness(80);
			console.debug("StreamDeck connected");		
		}
		else console.error("Stream Deck device not found");
	});

    const streamChannel = new BroadcastChannel('stream-deck-event');
	
    streamChannel.addEventListener('message', event =>
    {
        if (event.data.event == "keys")
        {
            const keys = event.data.keys;
			
			for (let i=0; i<32; i++)
			{
				if (keys[i]?.down && buttons[i])
				{				
					handleButtonPress(i);					

				} else if (keys[i]?.down) {
					console.debug("pressed button " + i)
				}					
			}
        }
        else

        if (event.data.event == "images")
        {
          streamDeck.handleScreen(event);
        }
    });	
}

// -------------------------------------------------------
//
//  X-Touch MIDI Controller Device
//
// -------------------------------------------------------

function resetXTouch() {	
	media.midiOut.sendProgramChange(1);	// layer B
	setTimeout(() => {resetXTouchLayer()}, 500);	

	media.midiOut.sendProgramChange(0);	// layer A
	setTimeout(() => {resetXTouchLayer()}, 500);				
}

function resetXTouchLayer() {	

	for (let i=0; i<16; i++) {
		setTimeout(() => {media.midiOut.playNote(i, "all", {rawVelocity: true, release:0, velocity:0})}, 500);
	}
	
	for (let i=1; i<9; i++) {
		//setTimeout(() => {media.midiOut.sendControlChange(i, 2, "all")}, 500);
		setTimeout(() => {media.midiOut.sendControlChange(i + 8, 0, "all")}, 500);		
	}		
}

function setXTouchButton(button, state) {
	const i = button % 16;
	const value = (state == "flash" ? 2: (state == "off" ? 0 : 1));
	console.debug("setXTouchButton", i, value);
	
	setTimeout(() => {
		if (button < 16) media.midiOut.sendProgramChange(0);		
		if (button > 15) media.midiOut.sendProgramChange(1);
	}, 500);
	
	setTimeout(() => {
		media.midiOut.playNote(i, "all", {rawVelocity: true, release:value, velocity:value})	
	}, 500);	
}

function setXTouchSpeaker(button, state) {
	const i = button % 8;
	const value = (state == "flash" ? 28: (state == "off" ? 0 : 27));
	console.debug("setXTouchSpeaker", i, value);
	
	setTimeout(() => {
		if (button < 8) media.midiOut.sendProgramChange(0);		
		if (button > 7) media.midiOut.sendProgramChange(1);
	}, 500);

	setTimeout(() => {media.midiOut.sendControlChange(i + 9, value, "all")}, 500);	
}

function setXTouchVolume(event, call) {
	if (call) {		
		const streamId = getStreamerForId(call.id);	

		if (streamId) {
			const audio = streamers[streamId].audio;
			if (audio) audio.volume = event.value / 127;
		}	
	}	
}

function handleXTouchControlEvent(event) {
	console.debug("handleXTouchControlEvent", event.controller.number, event.value);
	let i = -1;
	
	if (event.controller.number > 0 && event.controller.number < 9) i = event.controller.number - 1;
	if (event.controller.number > 10 && event.controller.number < 19) i = event.controller.number - 3;	
	
	if (i > -1) {
		const speaker = speakers[i];

		if (speaker) {
			setXTouchVolume(event, speaker.call);
		}
	} else if (event.controller.number == 9 || event.controller.number == 10) {		// main volume
		const channels = Object.getOwnPropertyNames(speakers);

		for (let i in channels) {	
			setXTouchVolume(event, speakers[channels[i]].call);
		}
	}
}

function handleXTouchNoteEvent(event) {
	console.debug("handleXTouchNoteEvent", event.note.number);
	
	if (event.note.number > 7 && event.note.number < 16) {	// layer A top row
		handleButtonPress(event.note.number - 8);
	}
	else
		
	if (event.note.number > 15 && event.note.number < 24) {	// layer A bottom row
		handleButtonPress(event.note.number - 8);
	}	
	else

	if (event.note.number > 31 && event.note.number < 40) {	// layer B top row
		handleButtonPress(event.note.number - 16);
	}
	else
		
	if (event.note.number > 39 && event.note.number < 48) {	// layer B bottom row
		handleButtonPress(event.note.number - 16);
	}
	else
		
	if (event.note.number > -1 && event.note.number < 8) {	// layer A speakers
		handleSpeakerPress(event.note.number);
	}						
	else
		
	if (event.note.number > 23 && event.note.number < 32) {	// layer B speakers
		handleSpeakerPress(event.note.number - 16);
	}	
}

// -------------------------------------------------------
//
//  HID device support (webHID)
//
// -------------------------------------------------------

async function setupMedia() {	
	console.debug("setupMedia", media);
	
	await setMicrophone(getSetting("cas_microphone", 0));
	await setSpeaker(getSetting("cas_speaker", 0));
		
	if (getSetting("cas_enable_hid_control", false))
	{
		if (isHidDevice("Jabra SPEAK 410")) {
			hidDevice = new JabraSpeak410();
			connectHidDevice();
			
		} else if (isHidDevice("Jabra SPEAK 510")) {
			hidDevice = new JabraSpeak510();		
			connectHidDevice();		
		
		} else if (isHidDevice("Yealink MP50")) {
			hidDevice = new YealinkMP50();		
			connectHidDevice();		
		}	
	}
}

function isHidDevice(label) {
	const microphone = deviceManager.selectedMicrophone;
	return microphone.name.indexOf(label) > - 1;	
}

function connectHidDevice() {	
	console.debug("connectHidDevice", hidDevice);	

	hidDevice.attach(event => 
	{
		console.debug("hidDevice event", event);
		
		if (event == "active")
		{
			if (hidDevice.call && (hidDevice.call.state == "None" || hidDevice.call.state == "Notified") && hidDevice.call.direction == "Incoming")
			{	
				acceptCall(hidDevice.call.id);		
			}
			else	
				
			if (hidDevice.call && hidDevice.call.state == "Connected")
			{
				if (!hidDevice.call.ignoreActiveMessage) holdCall(hidDevice.call.id);
				hidDevice.call.ignoreActiveMessage = false;
			}	

			else	
				
			if (hidDevice.call && hidDevice.call.state == "LocalHold")
			{
				resumeCall(hidDevice.call.id);				
			}			
		}
		else 

		if (event == "mute pressed")
		{
			if (hidDevice.call)
			{
				if (hidDevice.call.isMuted) {
					hidDevice.call.unmute();			
				} else {
					hidDevice.call.mute();				
				}
				hidDevice.call.ignoreActiveMessage = true;		
			}				
		}
		else
			
		if (event == "idle")
		{
			if (hidDevice.call && hidDevice.call.state == "Connected")
			{
				hangupCall(hidDevice.call.id);				
			}
			else
				
			if (hidDevice.call && (hidDevice.call.state == "Notified" || hidDevice.call.state == "None") && hidDevice.call.direction == "Incoming")
			{	
				rejectCall(hidDevice.call.id);
				
				if (hidDevice.previousCall) 
				{					
					hidDevice.call = hidDevice.previousCall;
					delete hidDevice.previousCall;
				}
			}			
		}					
	});	
}

function handleHidDevice(call, state) {
	console.debug("handleHidDevice", call, state);	
	
	if (hidDevice) 
	{			
		if (state == "Connected")
		{
			hidDevice.connect();	
			hidDevice.call = call;	
			hidDevice.call.ignoreActiveMessage = true;
		}
		else
			
		if (state == "LocalHold")
		{
			hidDevice.call = call;				
			hidDevice.hold();		
		}
		else		
			
		if ((state == "Disconnected" || state == "Missed"))
		{	
			hidDevice.clear();
			delete hidDevice.call;			
		}	
		else
			
		if ((state == "None" || state == "Notified") && call.direction == "Incoming")
		{
			hidDevice.ring();
			hidDevice.previousCall = hidDevice.call;			
			hidDevice.call = call;					
		}			
	}
}

function disconnectHidDevice() {
	hidDevice?.detach();	
}

// -------------------------------------------------------
//
//  Call control
//
// -------------------------------------------------------

function setupCallHandlers(callAgent) {
	console.debug("setupCallHandlers", callAgent);
	
	callAgent.on('incomingCall', async event => 
	{
		let call = event.incomingCall;
		const teamsId = call.callerInfo.identifier.microsoftTeamsUserId || call.callerInfo.identifier.communicationUserId;
		console.debug("incomingCall " + account.name, call.callerInfo.displayName, teamsId, call);

		if ((teamsId && intercoms[teamsId])) {	// intercom incoming, auto-accept 
			call.accept();
		}
		else
		
		if (intercoms[account.localAccountId]) {	// call extended incoming, auto-accept 
			call.accept();

		} else {		
			showIncomingNotification(call);
		}

		call.on('callEnded', endedCall => {
			console.debug("endedCall " + account.name, endedCall, call);
			
			if (endedCall.callEndReason.code != 0)
			{
				postCallStatus(callAgent, call, "Missed");
				closeNotification(call.id);
				delete calls[call.id];	
			}				
			call.off('stateChanged', () => {});			
			call = null;			
		});	

		calls[call.id] = call;
		setIncoming();		
		postCallStatus(callAgent, call);	
	});

	callAgent.on('callsUpdated', event => 
	{
		console.debug("callsUpdated " + account.name, event); 
		
		event.removed.forEach(removedCall => {
			console.debug("removedCall " + account.name, removedCall.callEndReason, removedCall.callerInfo);				
		})
		
		event.added.forEach(addedCall => {
			console.debug("addedCall " + account.name, addedCall, addedCall.callerInfo);
			calls[addedCall.id] = addedCall;

			addedCall.remoteParticipants.forEach(remoteParticipant => {
				subscribeToRemoteParticipant(remoteParticipant);
			})
		
			addedCall.on('remoteParticipantsUpdated', e => {
				e.added.forEach(remoteParticipant => { 
					postCallStatus(callAgent, addedCall);
					subscribeToRemoteParticipant(remoteParticipant)
				});
				
				e.removed.forEach(remoteParticipant => {
					postCallStatus(callAgent, addedCall);
				});
			});			

			addedCall.on('stateChanged', () => {
				console.debug("addedCall state " + account.name, addedCall.state);	

				if (addedCall.state == "Connected") {	
					closeNotification(addedCall.id);
					setConnected();

					const callTransferFeature = addedCall.feature(ACS.Features.Transfer);				
					
					callTransferFeature.on('transferRequested', args => {
						args.accept();
					});
					
					/* Not yet supported for MS Teams
					addedCall.__callCaptionsFeature = addedCall.feature(ACS.Features.Captions);
					
					addedCall.__callCaptionsFeature.on('captionsReceived', (data) => {
						console.debug("addedCall caption", data);						
					});					
					*/
					
					addedCall.info.getServerCallId().then(result => {
						console.debug("addedCall call ids", result, addedCall.id);
					}).catch(err => {
						console.error(err);
					});					

					const teamsId = addedCall.callerInfo?.identifier?.microsoftTeamsUserId;

					if (teamsId && intercoms[teamsId]) {
						addedCall.mute();
						delete intercoms[teamsId];
						showIntercomNotification(addedCall);

					} else if (intercoms[account.localAccountId]) {	// call extended, call extension 
						const request = intercoms[account.localAccountId];
						console.debug("addedCall extend call", request);	
						addedCall.mute();
						addThirdParty(addedCall.id, request.destination);						
						delete intercoms[account.localAccountId];													
						
					} else if (extended_calls[addedCall.id]) {	// accepted incoming extended call. use supplied extended destination or configured value
						const extendCallIncoming = extended_calls[addedCall.id].__extendedDestination || getSetting("cas_extend_call_tel");						
						addedCall.mute();
						addThirdParty(addedCall.id, extendCallIncoming);		
						showConnectedNotification(addedCall);	
						delete extended_calls[addedCall.id];
						
					} else if (extendedCallOutgong) {		// outgoing extended call, auto-extend call with add-third-party 
						addThirdParty(addedCall.id, extendedCallOutgong);		
						showConnectedNotification(addedCall);							
						extendedCallOutgong = null;
						
					} else {
						showConnectedNotification(addedCall);	
					}						
				}
				else						
					
				if (addedCall.state == "Disconnected")
				{		
					addedCall.off('stateChanged', () => {});
					addedCall.off('remoteParticipantsUpdated', () => {});					
					setOnline();	
					closeNotification(addedCall.id);
					stopStreamer(addedCall.id);
					
					delete calls[addedCall.id];	
					delete extended_calls[addedCall.id];	
				}
				else						
					
				if (addedCall.state == "LocalHold")
				{		
					setHeld();
					showHeldNotification(addedCall);					
				}			
				postCallStatus(callAgent, addedCall);					
			});						
		});				
	});	
}

function holdExistingCalls() {
    const existingCalls = Object.getOwnPropertyNames(calls);

    for (let i in existingCalls)
    {	
		const call = calls[existingCalls[i]];
		console.debug("holdExistingCalls", call.id, call);
		if (call.state == "Connected" && !call.isMuted) call.hold();	// ignore muted speaker calls
	}
}
	
async function postCallStatus(callAgent, call, state)  {
	console.debug("postCallStatus " + account.name, call.id, call.state, call.direction, call.callerInfo);
	const myState = state ? state : call.state;
	const participants = [];
	
	for (let index in call.remoteParticipants)
	{
		const participant = call.remoteParticipants[index];
		participants.push({identifier: participant.identifier, state: participant.state, muted: participant.isMuted, speaking: participant.isSpeaking, displayName: participant.displayName});
	}
	
	if (getSetting("cas_enable_hid_control", false))	 handleHidDevice(call, myState);
	if (getSetting("cas_enable_midi_controller", false)) handleSpeakerDevice(call, myState);		
	
	handleCallDevice(call, myState);	
	
	const payload = {
		id: call.id, 
		account: account.localAccountId,		
		direction: call.direction,
		state: myState,
		callerInfo: call.callerInfo,
		destination: call.__destination,
		participants: participants
	};		
	const url = casUrl + getRootPath() + "/callstatus";	
	const body = JSON.stringify(payload);
	console.debug("postCallStatus " + account.name, body);
	const response = await fetch(url, {method: "POST", body});				
}

async function createThread(destination) {
	let threadId = "19:" + account.localAccountId + "_" + account.localAccountId + "@unq.gbl.spaces";	
		
	if (destination.startsWith("8:acs"))  {
		if (account.localAccountId < destination) {
			threadId = "19:" + account.localAccountId + "_" + destination + "@unq.gbl.spaces";	
		} else {
			const webUrl = casUrl + getRootPath() + "/chatThreadId/" + destination;	
			const response = await fetch(webUrl, {method: "GET", headers: {authorization}});
			threadId = await response.text();
		}
	} 	// 
	else
		
	if (destination.startsWith("+"))  {	
		threadId = "00000000-0000-0000-0000-000000000000";
	}	
	else {			
		if (account.localAccountId < destination) {
			threadId = "19:" + account.localAccountId + "_" + destination + "@unq.gbl.spaces";	
		} else {
			threadId = "19:" + destination + "_" + account.localAccountId + "@unq.gbl.spaces";				
		}
	}		
	return threadId;
}

async function makeCall(destination, features) { 		
	// this currently only works on ACS with Teams Identities, 
	// Only teams acs endpoint can add another teams participant to call
	
	if (features?.extend) {	
		extendedCallOutgong = destination;			
		destination	= features.extend;	
	}	
	
	holdExistingCalls();
	let call;
	
	if (destination.startsWith("pw")) destination = "+" + destination.substring(2);

	let threadId = await createThread(destination);	
	
	console.debug("makeCall", destination, threadId, features);		
	
	if (destination.startsWith("+"))  {		
		call = await device.startCall([{phoneNumber: destination.replaceAll(" ", "")}], {alternateCallerId: account.ms_phone_number, threadId});	  
	} 
	else
		
	if (destination.startsWith("8:acs"))  {
		call = await device.startCall([{communicationUserId: destination }], {threadId});		
	} 	
	else {				
		call = await device.startCall([{ microsoftTeamsUserId: destination }],	{threadId});
	}

	call.__destination = destination;
}

function makePromptCall() {
	const destination = prompt("Enter Email Address");
	
	if (destination) {
		const target = getDestinationFromEmail(destination);
		
		if (target) {
			makeCall(target);			
		}	
	}
}

async function intercomCall(destination) {
	holdExistingCalls();	
	call = await device.join({ meetingLink: destination});
	call.__destination = destination;	
}

function getStreamerForId(id) {
	let streamId = calls[id].__streamId;

	if (!streamId)
	{
		const audios = document.querySelectorAll("audio");		
		
		for (let i=0; audios.length; i++)
		{
			const audio = audios[i];			
			const stream = audio.srcObject;
			
			if (!streamers[stream.id])
			{
				streamers[stream.id] = {audio, stream};
				streamId = stream.id;
				calls[id].__streamId = streamId;
				break;
			}
		}
	}

	return streamId;	
}

async function captionCall(id, language) {	

	if (calls[id] && calls[id].__callCaptionsFeature) {
		await calls[id].__callCaptionsFeature.startCaptions({ language: language || 'en-us' });		
	}
}

function recordCall(id) {					
	const streamId = getStreamerForId(id);
	
	if (streamId) {
		const stream = streamers[streamId].stream;
		console.debug("recordCall stream", stream, stream.getAudioTracks());							
		startStreamer(streamId, id);
	}	
}

function unmuteCall(id) {	
	if (calls[id]) calls[id].unmute({});
	showConnectedNotification(calls[id]);	
}

function acceptCall(id) {
	holdExistingCalls();	
	if (calls[id]) calls[id].accept({});
}

function extendCall(id, destination) {
	holdExistingCalls();
	
	if (calls[id]) {
		extended_calls[id] = calls[id];
		extended_calls[id].accept({});
		extended_calls[id].__extendedDestination = destination;
	}
}

function startScreenShare(id) {  
	if (calls[id]) {
		window.resizeTo(768, 900);	
		window.focus();	  
		calls[id].startScreenSharing();
		calls[id].__screensharing = true;
	}
}

function stopScreenShare(id) {
	if (calls[id]) {
		window.resizeTo(660, 900);	
		window.blur();	  
		calls[id].stopScreenSharing();
		calls[id].__screensharing = false;		
	}	
}

function rejectCall(id) {
	if (calls[id]) calls[id].reject({});
}

function holdCall(id) {
	if (calls[id]) calls[id].hold();
}

function resumeCall(id) {
	holdExistingCalls();	
	if (calls[id]) calls[id].resume({});
}

function hangupCall(id) {

	if (id == "all") {
		const existingCalls = Object.getOwnPropertyNames(calls);

		for (let i in existingCalls)
		{	
			const call = calls[existingCalls[i]];
			if (call) call.hangUp();
		}
	} else {	
		if (calls[id]) calls[id].hangUp();
	}
}

function transferCall(id, destination) {
	if (calls[id])
	{	
		const callTransferFeature = calls[id].feature(ACS.Features.Transfer);		
		console.debug("transferCall", id, destination, callTransferFeature);
			
		let transfer;
		
		if (destination.startsWith("+"))  {
			transfer = callTransferFeature.transfer({targetParticipant: {phoneNumber: destination}});			
		}
		else {
			transfer = callTransferFeature.transfer({targetParticipant: {microsoftTeamsUserId: destination}});			
		}
		
		transfer.on('stateChanged', () => {
			console.debug("transfer state", transfer.state); // None | Transferring | Transferred | Failed

			if (transfer.state == "Transferred")
			{	
				postCallStatus(device, calls[id], "Disconnected");	
				eventChannel.postMessage({event: 'ms-teams.call.transferred', id});					
			}
		});			
	}		
}

function addThirdParty(id, destination) {
	if (calls[id])
	{	
		let threadId = "19:" + account.localAccountId + "_" + account.localAccountId + "@unq.gbl.spaces";	
	
		if (destination.startsWith("+"))  {
			threadId = "00000000-0000-0000-0000-000000000000";			
			calls[id].addParticipant({phoneNumber: destination}, {threadId});			
		}
		else {

			if (account.localAccountId < destination) {
				threadId = "19:" + account.localAccountId + "_" + destination + "@unq.gbl.spaces";	
			} else {
				threadId = "19:" + destination + "_" + account.localAccountId + "@unq.gbl.spaces";				
			}			
			calls[id].addParticipant({microsoftTeamsUserId: destination}, {threadId});			
		}
	}		
}

function removeThirdParty(id, destination) {
	if (calls[id])
	{			
		if (destination.startsWith("+"))  {
			calls[id].removeParticipant({phoneNumber: destination});			
		}
		else {
			calls[id].removeParticipant({microsoftTeamsUserId: destination});			
		}
	}		
}	

// -------------------------------------------------------
//
//  SMS functions
//
// -------------------------------------------------------	

function handleSMSMessage(sms) {			
	const options = {
		body: sms.body,
		icon: "./img/comitfs-32.png",
		data: sms,
		requireInteraction: true,
		actions: [
          {action: 'reply', title: 'Reply', type: 'text', icon: './img/check-solid.png', placeholder: 'Type reply here..'},
		  {action: 'cancel', title: 'Cancel', type: 'button', icon: './img/times-solid.png'}		  
		]
	};
	serviceWorkerRegistration.showNotification("SMS Message - " + sms.name, options);	
}

async function sendSms(to, message, from) {	
	console.debug("sendSms", to, from, message);	
	const sendResults = await smsClient.send({from: from, to, message}, {enableDeliveryReport: true, tag: "configuration"});

	for (const sendResult of sendResults) {
	  if (sendResult.successful) {
		console.debug("sendSms - Success: ", sendResult);
	  } else {
		console.error("sendSms - Something went wrong when trying to send this message: ", sendResult);
	  }
	}
}

// -------------------------------------------------------
//
//  Presence functions
//
// -------------------------------------------------------	

async function getPresence() {
	console.debug("getPresence");	
	const response3 = await fetch(`https://graph.microsoft.com/v1.0/me/presence`, {method: "GET", headers: {authorization: graphAPIToken}});
	const presence = await response3.json();
	console.debug("getPresence - response", presence);
	
	const url = casUrl + getRootPath() + "/presence";	
	const body = JSON.stringify(presence);
	const response = await fetch(url, {method: "POST", body, headers: {authorization}});	
}

// -------------------------------------------------------
//
//  Chat functions
//
// -------------------------------------------------------	


async function setupTeamsChatEndpoint(token, config, property) {	
	console.debug("setupTeamsChatEndpoint", token, config, property);

	const tokenCredential = new ACS.AzureCommunicationTokenCredential(token);
	const chatClient = new ACS.ChatClient("https://" + config.acs_endpoint.split("/")[2], tokenCredential);		
	
	await chatClient.startRealtimeNotifications();
	console.debug("setupTeamsChatEndpoint chatClient", chatClient);		
	
	chatClient.on("chatMessageReceived", async (e) => {
		console.debug("setupTeamsChatEndpoint chatMessageReceived!", e);					
	});	

	const createChatThreadRequest = {topic: "Test ACS Chat Client"};
	
	const createChatThreadOptions = {
		participants: [{id: { microsoftTeamsUserId: "ba9e081a-5748-40ca-8fd5-ab9c74dae3d1" }}]
	};
	const createChatThreadResult = await chatClient.createChatThread(createChatThreadRequest, createChatThreadOptions);
	const threadId = createChatThreadResult.chatThread.id;
	console.debug("setupTeamsChatEndpoint threadId", threadId);		
	
	const chatThreadClient = chatClient.getChatThreadClient(threadId);		
	const sendMessageRequest = {content: "Hello Florence!!"};		
	const sendMessageOptions = {senderDisplayName: "Dele Olajide", type: 'text'};
	const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);	
	console.debug("setupTeamsChatEndpoint send message", threadId, chatThreadClient, sendMessageRequest, sendMessageOptions, sendChatMessageResult);		
}

async function setupChatEndpoint(config, property) {	
	console.debug("setupChatEndpoint", config, property);	
	
	if (!property.ms_teams_chatid) {				
		const user = await client.createUser();
		property.ms_teams_chatid = user.communicationUserId;				
		const body = JSON.stringify([{name: "ms_teams_chatid", value: user.communicationUserId}]);
		await fetch(webUrl, {method: "POST", headers: {authorization}, body});				
	}
	
	const response2 = await client.getToken({communicationUserId: property.ms_teams_chatid}, ["chat", "voip"]);
	chat.account = {localAccountId: property.ms_teams_chatid, name: property.name};			
	chat.token = response2.token;

	const tokenCredential = new ACS.AzureCommunicationTokenCredential(chat.token);
	chat.chatClient = new ACS.ChatClient("https://" + config.acs_endpoint.split("/")[2], tokenCredential);		
	chat.chatClient.startRealtimeNotifications();
	
	chat.chatClient.on("chatMessageReceived", async (e) => {
		console.debug("setupChatEndpoint chatMessageReceived!", e, chat.messages[e.id]);		
		const sender = sessionStorage.getItem("ms_teams_chatid_" + e.threadId);
		
		if (sender) {
			if (!chat.messages[e.id]) {
				chat.messages[e.id] = e.senderDisplayName;				
				const chatUrl = casUrl + getRootPath() + "/chat";	
				const body = JSON.stringify({id: e.id, sender, name: e.senderDisplayName, body: e.message.replace(/(<([^>]+)>)/gi, "")});
				await fetch(chatUrl, {method: "POST", headers: {authorization}, body});	
						
			} else delete chat.messages[e.id];				
		}			
	});	
	
	chat.callClient = new ACS.CallClient();	
	chat.callAgent = await chat.callClient.createCallAgent(tokenCredential, {});
	
	chat.callAgent.on('incomingCall', async event => {
		let call = event.incomingCall;
		const teamsId = call.callerInfo.identifier.microsoftTeamsUserId || call.callerInfo.identifier.communicationUserId;
		console.debug("chat incomingCall " + chat.account.name, call.callerInfo.displayName, teamsId);
		
		call.accept();		

		call.on('callEnded', endedCall => {
			console.debug("chat endedCall " + chat.account.name, endedCall, call);
			
			if (endedCall.callEndReason.code != 0) {
				delete calls[call.id];	
			}				
			call.off('stateChanged', () => {});			
			call = null;			
		});	

		chat.calls[call.id] = call;
	});	
	
	chat.callAgent.on('callsUpdated', event => 
	{
		console.debug("chat callsUpdated " + chat.account.name, event); 
		
		event.removed.forEach(removedCall => {
			console.debug("chat removedCall " + chat.account.name, removedCall.callEndReason, removedCall.callerInfo);				
		})
		
		event.added.forEach(addedCall => {
			console.debug("chat addedCall " + chat.account.name, addedCall, addedCall.callerInfo);
			chat.calls[addedCall.id] = addedCall;			

			addedCall.on('stateChanged', () => {
				console.debug("chat addedCall state " + chat.account.name, addedCall.state);	

				if (addedCall.state == "Connected") {	

					const callTransferFeature = addedCall.feature(ACS.Features.Transfer);				
					
					callTransferFeature.on('transferRequested', args => {
						args.accept();
					});

					const alternateCallerId	= "+18882020902";	
					const transfer = callTransferFeature.transfer({targetParticipant: {phoneNumber: "+18004444444", alternateCallerId}, alternateCallerId});						
					// not yet working
					//const alternateCallerId	= "+18882020902";				
					//addedCall.addParticipant({phoneNumber: "+18004444444"}, {alternateCallerId});								
				}
				else						
					
				if (addedCall.state == "Disconnected")
				{		
					addedCall.off('stateChanged', () => {});					
					delete chat.calls[addedCall.id];
					sessionStorage.clear();		// hack to fix threadId becoming invalid after call ends
				}
				else						
					
				if (addedCall.state == "LocalHold")
				{		
					
				}							
			});						
		});				
	});

	console.debug("setupChatEndpoint - Endpoint", chat);
}

async function handleChatMessage(msg) {
	console.debug("handleChatMessage", msg);
	let msgs = [msg];
	
	if ( msg.body) {
		let threadId = sessionStorage.getItem("ms_teams_chatid_" + msg.sender);	
		
		if (!threadId) {
			
			if (chat.senders[msg.sender]) {
				chat.senders[msg.sender].push(msg);	// handle con-currency of multiple msgs 
				return;
			} else {
				chat.senders[msg.sender] = [msg];
				threadId = await createChatThread(msg.label);								
				sessionStorage.setItem("ms_teams_chatid_" + msg.sender, threadId);
				sessionStorage.setItem("ms_teams_chatid_" + threadId, msg.sender);	
				
				msgs = chat.senders[msg.sender];
				delete chat.senders[msg.sender];					
			}
		}

		console.debug("handleChatMessage - sender msgs", msgs);			
		
		for (let i=0; i < msgs.length; i++)
		{
			const item = msgs[i];
			
			if (item.body.startsWith("+")) { // test makecall from chat
				//const alternateCallerId = {phoneNumber: "+18882020902"};
				//chat.callAgent.startCall([{phoneNumber: item.body}], {alternateCallerId});					
			}
			
			if (!chat.messages[item.id]) {		
				const chatThreadClient = chat.chatClient.getChatThreadClient(threadId);		
				const sendMessageRequest = {content: item.body};		
				const sendMessageOptions = {senderDisplayName: item.name, type: 'text'};
				const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
				const messageId = sendChatMessageResult.id;	
				chat.messages[messageId] = item.name;				
				
			} else delete chat.messages[item.id];	
		}
	}
}

async function createChatThread(topic) {
	const createChatThreadRequest = {topic};
	
	const createChatThreadOptions = {
		participants: [{id: { microsoftTeamsUserId: account.localAccountId }}]
	};
	const createChatThreadResult = await chat.chatClient.createChatThread(createChatThreadRequest,createChatThreadOptions);
	const threadId = createChatThreadResult.chatThread.id;
	return threadId;
}

async function openChat(button) {
	const chatContainer = document.getElementById('chat');
	const dialerContainer = document.getElementById('dialer');	
	chatContainer.hidden = false;
	dialerContainer.hidden = true;	
	
	console.debug("openChat", button);	
	const response3 = await fetch(`https://graph.microsoft.com/v1.0/me/chats/${button.threadId}/messages?$top=50`, {method: "GET", headers: {authorization: graphAPIToken}});
	console.debug("setupGraphAPI - response", response3);

	const messages = await response3.json();
	casChat.openChat(button, messages);		
}

// -------------------------------------------------------
//
//  Media Streaming functions
//
// -------------------------------------------------------		

function stopStreamer(id) {
	console.debug("stopStreamer", id, calls[id]?.__streamId);	

	if (calls[id]?.__streamId) {
		const streamId = calls[id].__streamId;
		const streamer = streamers[streamId].streamer;		
		if (streamer) streamer.stop();
		delete streamers[streamId];
	}
}

async function startStreamer(streamId, callId) {
	const stream = streamers[streamId].stream;
	console.debug("startStreamer", streamId, callId, stream);
	
	if (!streamers[streamId].streamer)
	{
		const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });			
		console.debug("startStreamer tracks", localStream.getAudioTracks(), stream.getAudioTracks());

		const tracks = [
			...localStream.getVideoTracks(),
			...mergeAudioStreams(localStream, stream)
		];

		const liveStream = new MediaStream(tracks);	
		console.debug("startStreamer mixed audio", liveStream);
		
		/*
		let websocket = connectLiveStream(callId);
		streamers[streamId].streamer = new MediaRecorder(liveStream, { mimeType: 'audio/webm;codecs=opus' });

		streamers[streamId].streamer.ondataavailable = function (e) {
			websocket.send(e.data);
		}

		streamers[streamId].streamer.onstop = function (e) {
			setTimeout(() => {websocket.close()}, 1000);
		}

		streamers[streamId].streamer.start(1000);
		*/
		
		const protocol = casUrl.indexOf("https") > -1 ? "wss:" : "ws:";
		const url = protocol + "//" + casUrl.split("/")[2] + "/sfu/";
		
		streamers[streamId].streamer = new SFUAudio(url, account.username, getSetting("cas_access_token"), callId);
		streamers[streamId].streamer.connect(liveStream);
	}
	else {
		console.warn("streamer already active");
	}
}

function connectLiveStream(callId) {
	const protocol = casUrl.indexOf("https") > -1 ? "wss:" : "ws:";
	const url = protocol + "//" + casUrl.split("/")[2] + "/teams-ws/";
	const metadata = { userId: account.localAccountId, callId: callId, token: getSetting("cas_access_token")};
	const ws = new WebSocket(url);

	ws.onopen = (event) => {
		console.debug(`Connection opened: ${JSON.stringify(event)}`);
		ws.send(JSON.stringify(metadata));
	};

	ws.onclose = (event) => {
		console.debug(`Connection closed: ${JSON.stringify(event)}`);
		websocket = null;
		streamer = null;			
	};

	ws.onerror = (event) => {
		console.debug(`An error occurred with websockets: ${JSON.stringify(event)}`);
	};
	return ws;
}	

function mergeAudioStreams(localStream, remoteStream) {
	const context = new AudioContext();
	const destination = context.createMediaStreamDestination();
	
	const source1 = context.createMediaStreamSource(localStream);
	const localGain = context.createGain();
	localGain.gain.value = 0.5;
	source1.connect(localGain).connect(destination);
	
	const source2 = context.createMediaStreamSource(remoteStream);
	const remoteGain = context.createGain();
	remoteGain.gain.value = 0.5;
	source2.connect(remoteGain).connect(destination);

	return destination.stream.getAudioTracks();
}

// -------------------------------------------------------
//
//  Screen Share functions
//
// -------------------------------------------------------	

function subscribeToRemoteParticipant(remoteParticipant) {
    console.debug("subscribeToRemoteParticipant", remoteParticipant);
	
    try {
        remoteParticipant.on('stateChanged', () => {
            console.debug("Remote participant state changed:", remoteParticipant.state);
        });

        remoteParticipant.videoStreams.forEach(remoteVideoStream => {
            subscribeToRemoteVideoStream(remoteVideoStream)
        });
		
        remoteParticipant.on('videoStreamsUpdated', e => {
            e.added.forEach(remoteVideoStream => {
                subscribeToRemoteVideoStream(remoteVideoStream)
            });

            e.removed.forEach(remoteVideoStream => {
                console.debug('Remote participant video stream was removed.');
            })
        });
    } catch (error) {
        console.error(error);
    }
}

async function subscribeToRemoteVideoStream(remoteVideoStream) {
    console.debug("subscribeToRemoteVideoStream", remoteVideoStream);	
    let videoStreamRenderer = new ACS.VideoStreamRenderer(remoteVideoStream);
    let view;

    const renderVideo = async () => {
        try {
            view = await videoStreamRenderer.createView();
            remoteVideoContainer.hidden = false;
            remoteVideoContainer.appendChild(view.target);
			
			if (dialerContainer) {
				dialerContainer.hidden = true;				
			}
			
        } catch (e) {
            console.warn("Failed to createView", e);
        }	
    }
    
    remoteVideoStream.on('isAvailableChanged', async () => {
        // Participant has switched video on.
        if (remoteVideoStream.isAvailable) {
            await renderVideo();

        // Participant has switched video off.
        } else {
            if (view) {
				view.target.remove();
                view.dispose();
                view = undefined;
				
				remoteVideoContainer.hidden = true;
				
				if (dialerContainer) {
					dialerContainer.hidden = false;				
				}				
            }
        }
    });

    // Participant has video on initially.
    if (remoteVideoStream.isAvailable) {
        await renderVideo();
    }
}

// -------------------------------------------------------
//
//  Utilitiy functions
//
// -------------------------------------------------------	

function getInitials(nickname) {
	if (!nickname) nickname = "Anonymous";
	nickname = nickname.toLowerCase();	

	let pos = nickname.indexOf("@");
	if (pos > 0) nickname = nickname.substring(0, pos);

	let words = nickname.split(/[, ]/); 
	if (words.length == 1) words = nickname.split(".");
	if (words.length == 1) words = nickname.split("-"); 

	let initials = nickname.substring(0, 1);

	if (words[0] && words.first != '') {
		const firstInitial = words[0][0]; // first letter of first word
		let lastInitial = null; // first letter of last word, if any

		const lastWordIdx = words.length - 1; // index of last word
		if (lastWordIdx > 0 && words[lastWordIdx] && words[lastWordIdx] != '')
		{
			lastInitial = words[lastWordIdx][0]; // first letter of last word
		}

		// if nickname consist of more than one words, compose the initials as two letter
		initials = firstInitial;
		
		if (lastInitial) {
			// if any comma is in the nickname, treat it to have the lastname in front, i.e. compose reversed
			initials = nickname.indexOf(",") == -1 ? firstInitial + lastInitial : lastInitial + firstInitial;
		}
	}

	return initials.toUpperCase();
}

function setOnline() {
	setBadge('#ffffff', "");
	online = true;
}

function setOffline() {
	setBadge('#ff0000', "off");	
	online = false;	
}

function setIncoming() {
	let count = 0;		
    const existingCalls = Object.getOwnPropertyNames(calls);

    for (let i in existingCalls)
    {	
		const call = calls[existingCalls[i]];
		if (call && (call.state == "None" || call.state == "Notified")  && call.direction == "Incoming") count++;
	}	
	setBadge('red', count.toString());
	drawAttention();	
}

function setHeld() {
	let count = 0;		
    const existingCalls = Object.getOwnPropertyNames(calls);

    for (let i in existingCalls)
    {	
		const call = calls[existingCalls[i]];
		if (call.state == "LocalHold") count++;
	}
	setBadge('orange', count.toString());
	drawAttention();	
}

function setConnected() {
	let count = 0;		
    const existingCalls = Object.getOwnPropertyNames(calls);

    for (let i in existingCalls)
    {	
		const call = calls[existingCalls[i]];
		if (call.state == "Connected") count++;
	}
	setBadge('green', count.toString());			
}

function setBadge(color, text) {

	if (chrome.action) {		
		chrome.action.setBadgeBackgroundColor({ color: color });
		chrome.action.setBadgeText({ text: text });	
	}	
}

function drawAttention() {

	if (chrome.windows) {					
		chrome.windows.getCurrent({populate: false, windowTypes: ["normal"]}, (win) =>
		{
			chrome.windows.update(win.id, {drawAttention: true});
		});	
	}	
}

function showOutgoingNotification() {	
	if (!getSetting("cas_enable_popup", false)) return;
	
	const options = {
		body: "Outgoing Call",
		icon: "./img/comitfs-32.png",
		data: {},
		requireInteraction: true,
		actions: [
          {action: 'call', title: 'Call', type: 'text', icon: './img/check-solid.png', placeholder: 'Type username, email or phone here..'},
		  {action: 'cancel', title: 'Cancel', type: 'button', icon: './img/times-solid.png'}		  
		]
	};
	serviceWorkerRegistration.showNotification("Dialer", options);
}

function showIncomingNotification(call) {	
	chrome.runtime.sendMessage({drawAttention: {flag: true}});
	
	if (!getSetting("cas_enable_popup", false)) return;
	
	let contextMessage = call.callerInfo.displayName;	
	if (contextMessage && contextMessage.trim() == "" && call.callerInfo.identifier.phoneNumber) contextMessage = call.callerInfo.identifier.phoneNumber;		
	
	const options = {
		body: "Incoming Call",
		icon: "./img/comitfs-32.png",
		data: {id: call.id},
		tag: call.id,
		requireInteraction: false,
		actions: [
		  {action: 'accept', title: 'Accept', type: 'button', icon: './img/check-solid.png'},
		  {action: 'reject', title: 'Reject', type: 'button', icon: './img/times-solid.png'}		  
		]
	};
	serviceWorkerRegistration.showNotification(contextMessage, options);
}

function showConnectedNotification(call) {
	if (!getSetting("cas_enable_popup", false)) return;
	
	let contextMessage = getContactName(call.__destination);
	
	if (call.direction == "Incoming")
	{
		contextMessage = call.callerInfo.displayName;	
		if (contextMessage && contextMessage.trim() == "" && call.callerInfo.identifier.phoneNumber) contextMessage = call.callerInfo.identifier.phoneNumber;	
	}		
	
	const options = {
		body: "Connected Call",
		icon: "./img/comitfs-32.png",
		data: {id: call.id},
		tag: call.id,
		requireInteraction: false,
		actions: [		  
		  {action: 'hold', title: 'Hold', type: 'button', icon: './img/check-solid.png'},
		  {action: 'hangup', title: 'Hangup', type: 'button', icon: './img/times-solid.png'}
		]
	};
	serviceWorkerRegistration.showNotification(contextMessage, options);	
}

function showIntercomNotification(call) {
	if (!getSetting("cas_enable_popup", false)) return;
	
	let contextMessage = getContactName(call.__destination);
	
	if (call.direction == "Incoming")
	{
		contextMessage = call.callerInfo.displayName;	
		if (contextMessage && contextMessage.trim() == "" && call.callerInfo.identifier.phoneNumber) contextMessage = call.callerInfo.identifier.phoneNumber;	
	}		
	
	const options = {
		body: "Intercom Call",
		icon: "./img/comitfs-32.png",
		data: {id: call.id},
		tag: call.id,
		requireInteraction: false,
		actions: [		  
		  {action: 'speak', title: 'Speak', type: 'button', icon: './img/check-solid.png'},
		  {action: 'hangup', title: 'Hangup', type: 'button', icon: './img/times-solid.png'}
		]
	};
	serviceWorkerRegistration.showNotification(contextMessage, options);	
}

function showHeldNotification(call) {
	if (!getSetting("cas_enable_popup", false)) return;
	
	let contextMessage = getContactName(call.__destination);
	
	if (call.direction == "Incoming")
	{
		contextMessage = call.callerInfo.displayName;	
		if (contextMessage && contextMessage.trim() == "" && call.callerInfo.identifier.phoneNumber) contextMessage = call.callerInfo.identifier.phoneNumber;	
	}		
	
	const options = {
		body: "Held Call",
		icon: "./img/comitfs-32.png",
		data: {id: call.id},
		tag: call.id,
		requireInteraction: false,
		actions: [
		  {action: 'resume', title: 'Resume', type: 'button', icon: './img/check-solid.png'}	  
		]
	};
	serviceWorkerRegistration.showNotification(contextMessage, options);	
}

function closeNotification(id) {
	if (!getSetting("cas_enable_popup", false)) return;
	
	serviceWorkerRegistration.getNotifications({tag: id}).then(notifications => {
		if (notifications.length > 0) notifications[0].close();
	})
}

function getContactName(callerId) {
	if (!callerId) return "Unknown";
	
	let contactName = callerId;
	
	profile.interests.forEach(interest =>
	{
		if (interest.value == callerId) contactName = interest.label;			
	});	
	
	profile.features.forEach(feature =>
	{
		if (feature.value == callerId) contactName = feature.label;			
	});	

	return contactName;	
}

function getDestinationFromEmail(email) {
	let destination = null;

	if (email.indexOf("+") == 0) {
		destination = email;
	} 
	else {				
		if (email.indexOf("@") == -1) email = email + "@" + profile.domain;
						
		profile.interests.forEach(interest =>
		{
			if (interest.email == email) destination = interest.value;			
		});	
		
		profile.features.forEach(feature =>
		{
			if (feature.email == email) destination = feature.value;		
		});	
	}

	return destination;	
}

function setSetting(name, value) {
    window.localStorage["store.settings." + name] = JSON.stringify(value);
}

function setDefaultSetting(name, defaultValue) {
    console.debug("setDefaultSetting", name, defaultValue, window.localStorage["store.settings." + name]);

    if (!window.localStorage["store.settings." + name] && window.localStorage["store.settings." + name] != false)
    {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }
}

function getSetting(name, defaultValue) {
    var value = defaultValue;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);

        if (name == "password") value = getPassword(value);
    }

    return value;
}

function getMedia() {
	return media;
}

function getProfile() {
	return profile;
}

async function setMicrophone(mic) {
	console.debug("selecting microphone " + media.localMicrophones[mic]?.name);
	
	if (media.localMicrophones[mic]) {
		await deviceManager.selectMicrophone(media.localMicrophones[mic]);
	}
}

async function setSpeaker(spkr) {
	console.debug("selecting speaker " + media.localSpeakers[spkr]?.name);	
	
	if (media.localSpeakers[spkr]) {
		await deviceManager.selectSpeaker(media.localSpeakers[spkr]);
	}		
}

function closeWebAppsWindow(id) {

	if (webAppsWindow[id] != null)
	{
		chrome.windows.remove(webAppsWindow[id].id);
		delete webAppsWindow[id];
	}
}

function openWebAppsWindow(url, id, state, width, height) {
	if (!width) width = 1024;
	if (!height) height = 768;

	if (url.startsWith("_")) url = url.substring(1);
	var httpUrl = url.startsWith("http") ? url.trim() : ( url.startsWith("chrome-extension") ? url : "https://" + url.trim());
	var data = {url: httpUrl, type: "popup", focused: true};

	console.debug("openWebAppsWindow", data, state, width, height);

	if (state == "minimized" && getSetting("openWinMinimized", false))
	{
		delete data.focused;
		data.state = state;
	}

	if (webAppsWindow[id] == null)
	{
		chrome.windows.create(data, function (win)
		{
			webAppsWindow[id] = win;
			chrome.windows.update(win.id, {width, height});
		});

	} else {
		chrome.windows.update(webAppsWindow[id].id, {focused: true});		
	}
}

function openSettings() {
	location.href = "options/index.html";
}

function closeAllWindows() {
    const webApps = Object.getOwnPropertyNames(webAppsWindow);

    for (let win of webApps)
    {
        if (webAppsWindow[win])
        {
            console.debug("unloading web app " + win);
            closeWebAppsWindow(win);
        }
    }	
}

function getRootPath() {
	let url =  "/teams/api/openlink";
	
	if (getSetting("cas_paas_enabled")) {
		url =  "/plugins/casapi/v1/companion";
	}
	return url;
}
