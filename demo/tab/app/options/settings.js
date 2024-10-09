window.addEventListener('load', async () => {
    console.debug("options loaded");
	
	document.getElementById("avatar").addEventListener("click", () => {
		location.href= "./../index.html";
	});

    //document.getElementById("settings-label").innerHTML = chrome.i18n.getMessage('settings')
    doDefaults();
	setupActionHandlers();
})

window.addEventListener('beforeunload', async () => {
	console.debug("beforeunload");
});

window.addEventListener('unload', async () => {
	console.debug("unload");		
});

// -------------------------------------------------------
//
//  Functions
//
// -------------------------------------------------------

async function getMediaDevices(settings) {	
	const casMicrophones = settings.manifest.cas_microphone.element;
	const casSpeakers = settings.manifest.cas_speaker.element;
	const casCamera = settings.manifest.cas_camera.element;	
}

async function handleStreamDevice() {
    const devices = await navigator.hid.requestDevice({ filters: [{vendorId: 4057}] });
	console.debug("handleStreamDevice", devices.length);
	return devices.length > 0;
}

async function handleHIDDevice() {
	const hidDeviceId = getSetting("cas_hid_control", "none");		
	console.debug("handleHIDDevice", hidDeviceId);
		
	if (hidDeviceId == "jabra-410") {
		const devices = await navigator.hid.requestDevice({filters: [{vendorId: 2830, productId: 1042}]});		
		return devices.length > 0;
	}
	else
		
	if (hidDeviceId == "jabra-510") {
		const devices = await navigator.hid.requestDevice({filters: [{vendorId: 2830, productId: 1058}]})
		return devices.length > 0;		
	}			
	else
		
	if (hidDeviceId == "yealink-mp50") {
		const devices = await navigator.hid.requestDevice({filters: [{vendorId: 27027, productId: 45120}]})
		return devices.length > 0;		
	}	
	else
		
	if (hidDeviceId == "none") {
		return true;			
	}	
	return false;
}


async function handleCredentials(baseUrl, authorization) {
	console.debug("handleCredentials", baseUrl, authorization);
	
	if (authorization && baseUrl) {
		let url = baseUrl + getRootPath() + "/config/global";	
		
		let response = await fetch(url, {method: "GET"});
		const config = await response.json();			
		console.debug("handleCredentials config", config);
			
		url = baseUrl + getRootPath() + "/config/properties";	
		response = await fetch(url, {method: "GET", headers: {authorization}});
		console.debug("User properties response", response);			
		const property = await response.json();	
		console.debug("User properties json", property);		

		const payload = {action: 'config', host: baseUrl, config, property};
		console.debug("handleCredentials", payload);
		return payload;	
	}			
}

async function handleInstall() {
	const serverUrl = getSetting("cas_server_url");
	const serverToken = getSetting('cas_server_token');
	
    if (!serverUrl || !serverToken) return false;
	
	const endpointUrl = getSetting('cas_endpoint_url');
	const passKey = getSetting('cas_pass_key');
	
	if (!endpointUrl && !passKey) {	
		const request = await handleCredentials(serverUrl, serverToken);
		request.action = "config";
		chrome.runtime.sendMessage(request);
		return true;
	}
	
	return true;
}


async function handleConnect() {
	const notifications = getSetting('cas_enable_notifications', true);
	const enableDialer = getSetting('cas_enable_dialer', false);
	const edgeBrowser = window.navigator.userAgent.indexOf("Edg") > -1;
	chrome.storage.local.set({userAgent: {edgeBrowser, enableDialer, notifications}});	
	
	const config = {
		"client_id":	getSetting('cas_client_id'),
		"id": 			getSetting('cas_endpoint_address'),
		"name": 		getSetting('cas_endpoint_name'),
		"phone_number": getSetting('cas_endpoint_phone'),
		"endpoint": 	getSetting('cas_endpoint_url'),
		"token": 		getSetting("cas_access_token"),		
		"pass_key": 	getSetting('cas_pass_key'),
		"server_token": getSetting('cas_server_token'),
		"server_url":   getSetting("cas_server_url")		
	};	
	console.debug("handleConnect", config);
	
	if (!config.endpoint || !config.pass_key) return false;
	
	const connectionString = `endpoint=${config.endpoint}/;accesskey=${config.pass_key}`
	const identityClient = new ACS.CommunicationIdentityClient(connectionString);  	
	
	let callClient;
	
	try {
		if (config.client_id && config.client_id != "") {
			let localAccountId = config.id;
			const url = config.server_url + getRootPath() + "/msal/token";				
			const resp = await fetch(url, {method: "GET", headers: {authorization: config.server_token}});	
			const json = await resp.json();				
			console.debug("MSAL token", json);
			const accessToken = json.access_token;
										
			const response = await identityClient.getTokenForTeamsUser({teamsUserAadToken: accessToken, clientId: config.client_id, userObjectId: localAccountId});		
			config.accessToken = accessToken;
			config.id = localAccountId;
			config.token = response.token;	

			setSetting("cas_msal_token", config.accessToken);			
			setSetting("cas_access_token", config.token);
			setSetting("cas_endpoint_address", config.id);
				
			callClient = new ACS.CallClient();		
			console.debug("loggedIn Teams user config", config);	
			
		} else {
			if (!config.id) {
				const user = await identityClient.createUser();
				config.id = user.communicationUserId;
				setSetting("cas_endpoint_address", config.id);			
			}				
			const response = await identityClient.getToken({communicationUserId: config.id}, ["chat", "voip"]);	
			config.token = response.token;
			setSetting("cas_access_token", config.token);	
			const tokenCredential = new ACS.AzureCommunicationTokenCredential(config.token);	
			
			callClient = new ACS.CallClient();
			const endpoint = 'https://smartcall-acs.communication.azure.com/'; 			
			const chatClient = new ACS.ChatClient(endpoint, tokenCredential);				

			config.threadId = getSetting('cas_controlpoint_thread');
			
			if (!config.threadId || !chatClient.getChatThreadClient(config.threadId)) {
				const createChatThreadRequest = {topic: config.name};	
				const createChatThreadOptions = {participants: [{id: {communicationUserId: getSetting("cas_controlpoint_address")}}, {id: {communicationUserId: config.id}}]};
				const createChatThreadResult = await chatClient.createChatThread(createChatThreadRequest, createChatThreadOptions);	
				config.threadId = createChatThreadResult.chatThread.id;
				setSetting("cas_controlpoint_thread", config.threadId);
			}				

			const data = {
				"id": 			getSetting('cas_endpoint_address'),
				"control": 		getSetting('cas_controlpoint_address'),
				"thread": 		getSetting('cas_controlpoint_thread')				
			};	
	
			const login = {action: 'configure', data};
			const chatThreadClient = chatClient.getChatThreadClient(config.threadId);		
			const sendMessageRequest = {content: JSON.stringify(login)};		
			const sendMessageOptions = {senderDisplayName: config.name, type: 'text'};
			const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);				
	
			console.debug("loggedIn ACS user token", config);			
		}
	} catch (e) { 
		alert('ACS configuration is incorrect. Please try again\n' + e);		
	}

	let streamDeckOk = false;
	let hidOk = false;	
	const hidDeviceId = getSetting("cas_hid_control", "none");		
	const browserDevices = await navigator.hid.getDevices();

	browserDevices.map((dev) => {
		console.debug("found usb device", dev);
		if (dev.vendorId == 4057) streamDeckOk = true;		
		if (dev.vendorId == 2830 && dev.productId == 1058) hidOk = true;
		if (dev.vendorId == 2830 && dev.productId == 1042) hidOk = true;					
		if (dev.vendorId == 27027 && dev.productId == 45120) hidOk = true;						
	});	
	
	const isOk = (id) => {
		const value = getSetting(id);
		return value && value.trim() != "";
	}
	let configCount = 0;
	
	for (let i=0; i<32; i++) {		
		if (isOk("cas_touch_label_" + i) && isOk("cas_touch_name_" + i) && isOk("cas_touch_type_" + i)) configCount++;
	}

	const isConfigOk = isOk("cas_endpoint_name") && isOk("cas_endpoint_phone") && isOk("cas_endpoint_url") && isOk("cas_endpoint_address") && (isOk("cas_access_token") || isOk("cas_pass_key"))
	const deviceManager = await callClient.getDeviceManager();	
	
	const result = await deviceManager.askDevicePermission({audio: true, video: true});	
	const notify = await Notification.requestPermission();
	
	console.log("notification permission", (notify == "granted"));
	console.log("webrtc audio/video permission", (result.audio || result.video));
	console.log("streamdeck status", (streamDeckOk || !getSetting('cas_enable_streamdeck')));
	console.log("HID device status", (hidOk || (!hidOk && hidDeviceId == 'none')));
	console.log("Touch Points status", (configCount > 0 || !getSetting('cas_enable_streamdeck')));
	console.log("Config settings", isConfigOk);

	return (notify == "granted") && (result.audio || result.video) && (streamDeckOk || !getSetting('cas_enable_streamdeck')) && (hidOk || (!hidOk && hidDeviceId == 'none')) && (configCount > 0 || !getSetting('cas_enable_streamdeck')) && isConfigOk;
}

function setupActionHandlers() {	

    new FancySettings.initWithManifest(function (settings)
    {	
		getMediaDevices(settings);

        if (settings.manifest.cas_install) settings.manifest.cas_install.addEvent("action", async function ()
        {					
			const resp = await handleInstall();
			
			if (!resp) {
				alert('Installation was not sucessfull. Please contact your admin');
			}				
		})
		
        if (settings.manifest.cas_connect) settings.manifest.cas_connect.addEvent("action", async function ()
        {					
			const resp = await handleConnect();
			
			if (resp) {
				chrome.runtime.reload();
			} else {
				alert('Configuration is not complete or USB devices not paired. Please try again');
			}				
		})
		
		if (settings.manifest.brightness_range) settings.manifest.brightness_range.addEvent("action", async function ()
        {
			//console.debug("stream deck brightness", getSetting("brightness_range", 50));
			
			if (getSetting('cas_enable_streamdeck')) {
				chrome.runtime.sendMessage({action: "set_brightness", range: getSetting("brightness_range", 50)});
			}
		})

        if (settings.manifest.cas_enable_streamdeck) settings.manifest.cas_enable_streamdeck.addEvent("action", function ()
        {
			location.reload();
		})
		
        if (settings.manifest.cas_microphone) settings.manifest.cas_microphone.addEvent("action", function ()
        {
			const mic = getSetting("cas_microphone", 0);
			chrome.runtime.sendMessage({setMicrophone: {mic}});
		})
		
        if (settings.manifest.cas_speaker) settings.manifest.cas_speaker.addEvent("action", function ()
        {
			const spkr = getSetting("cas_speaker", 0);
			chrome.runtime.sendMessage({setSpeaker: {spkr}});			
		})
		
        if (settings.manifest.cas_enable_tel_protocol) settings.manifest.cas_enable_tel_protocol.addEvent("action", function ()
        {
			if (getSetting("cas_enable_tel_protocol", false)) {	
                navigator.registerProtocolHandler("tel",  chrome.runtime.getURL("/tel-handler.html?url=%s"), "CAS Touch");			
                navigator.registerProtocolHandler("web+cas",  chrome.runtime.getURL("/tel-handler.html?url=%s"), "CAS Touch");					
			} else {
                navigator.unregisterProtocolHandler("web+cas",  chrome.runtime.getURL("/tel-handler.html?url=%s"), "CAS Touch");					
                navigator.unregisterProtocolHandler("tel",  chrome.runtime.getURL("/tel-handler.html?url=%s"), "CAS Touch");						
			}
		})

        if (settings.manifest.pair_stream_deck) settings.manifest.pair_stream_deck.addEvent("action", async function ()
        {
			await handleStreamDevice();
			let success = false;
			
			navigator.hid.getDevices().then((browserDevices) => {
				browserDevices.map((dev) => {
					console.debug("found stream device", dev);
					if (dev.vendorId == 4057) success = true;
				});
				
				if (!success) alert("Stream Deck not available or not paired. Please try again.");
			});			

        });	
		
        if (settings.manifest.pair_hid) settings.manifest.pair_hid.addEvent("action", async function ()
        {
			await handleHIDDevice();

			let success = false;
			
			navigator.hid.getDevices().then((browserDevices) => {
				browserDevices.map((dev) => {
					console.debug("found hid device", dev);					
					if (dev.vendorId == 2830 && dev.productId == 1058) success = true;
					if (dev.vendorId == 2830 && dev.productId == 1042) success = true;					
					if (dev.vendorId == 27027 && dev.productId == 45120) success = true;						
				});
				
				if (!success) alert("HID Device not available or not paired. Please try again.");
			});				
        });			
		
        if (settings.manifest.forget_device) settings.manifest.forget_device.addEvent("action", async function ()
        {
			const devices = await navigator.hid.requestDevice({ filters: [] });
			console.debug("forget_device", devices.length);

			if (devices.length > 0) {
				for (const connectedDevice of devices) 	await connectedDevice.forget();			
			}
        });		

        if (settings.manifest.factory_reset) settings.manifest.factory_reset.addEvent("action", function ()
        {
            if (confirm("Reset?"))
            {
                sessionStorage.clear();
                localStorage.clear();
                
				if (chrome.storage) chrome.storage.local.clear();				
                if (chrome.runtime.reload) chrome.runtime.reload();
            }
        });		
	});
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function doDefaults() {
	setDefaultSetting("cas_enable_audioonly", true);
    setDefaultSetting("cas_telephone_contry_code", "en-GB");
	setDefaultSetting("cas_hid_control", "none");
	setDefaultSetting("cas_enable_active_call", true);
	setDefaultSetting("cas_use_active_call_control", true);
	//setDefaultSetting("cas_enable_notifications", true);
	setDefaultSetting("cas_enable_shared_active_call_notification", true);
	setDefaultSetting("cas_enable_voice_transcription", true);
	setDefaultSetting("cas_enable_intelliflo", true);
}

function getRootPath() {
	let url =  "/teams/api/openlink";
	
	if (getSetting("cas_paas_enabled")) {
		url =  "/plugins/casapi/v1/companion";
	}
	return url;
}
