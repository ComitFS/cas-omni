import { TemplateHelper, registerMgtComponents, Providers, Msal2Provider, SimpleProvider, ProviderState } from './mgt.js';

let graphClient, embeded, callType, callId, callView, clientId, searchView, viewClient, selectedContact, telCache, currentCli, currentEmail, muteMic, holdCall, transferCall, inviteUser, inviteToMeeting, acceptCall, declineCall, endCall, returnCall, requestToJoin, nextCall, acceptSuggestion, declineSuggestion, internalCollab, clearCache, assistButton, assistText, callOptions, callControls, saveNotes, oneNoteId, oneNoteUrl, summariseTranscript, liveTranscription, meEmail, contactPhoto, mePhoto;
						
window.addEventListener("load", async function() {
	let json;
	const data = urlParam("data");
	const userid = urlParam("userid");	
	console.debug("load", userid, data);
	
	if (data) {
		json = JSON.parse(data)
	
	} else {
		const origin = JSON.parse(localStorage.getItem("configuration.cas_server_url"));
		const authorization = JSON.parse(localStorage.getItem("configuration.cas_server_token"));
		const url = origin + "/plugins/casapi/v1/ompanion/meeting/adviser";			
		const response = await fetch(url, {method: "GET", headers: {authorization}});
		const meetingJson = await response.json();

		if (meetingJson.cas_contact) {
			json = {
				action: "display_contact",		
				type: meetingJson.cas_contact.incoming ? "incoming" : "outgoing",
				id: meetingJson.cas_contact.callId,
				callerId: meetingJson.cas_contact.phone,	
				emailAddress: meetingJson.cas_contact.email
			}
			
		} else {
			json = {
				action: "display_contact",		
				type: "outgoing",
				id:meetingJson.cas_contact. "1234567890",
				callerId: "+441634251467",	
				emailAddress: "dele@4ng.net"
			}
		}
	}

	setup(json);
	Providers.globalProvider = new SimpleProvider(getAccessToken, login, logout);	
	Providers.globalProvider.login();	
});

window.addEventListener("unload", function() {
	
});

/*
chrome.runtime.onMessage.addListener(async (msg) => {	
	console.debug("chrome.runtime.onMessage", msg);	
	
	if (getSetting("cas_use_active_call_control", true)) {	
		//chrome.runtime.sendMessage({action: "set_presence_dnd"});
	}
			
	switch (msg.action) {
		case "update_active_call":
			if (msg.data.type == "elsewhere") {
				handleElseWhereCall(msg);					
				resizeWindowMinimised();
			}
			else
			if (msg.data.type == "missed") {
				handleMissedCall();				
				resizeWindowMinimised();				
			}				
			break;
			
		case "notify_sms":
			handleSms(msg);
			break;
			
		case "notify_shared_active_call":
			handleSharedActiveCall(msg);
			break;
			
		case "request_join_call":			// notification click
			requestToJoinCall(msg);
			break
			
		case "notify_cas_dialer_connected":
			handleConnectedCall(msg);		
			break;
			
		case "notify_cas_dialer_conferenced":
			handleConferencedCall(msg);		
			break;
			
		case "notify_cas_dialer_held":
			handleHeldCall(msg);		
			break;
			
		case "notify_cas_dialer_disconnected":
			handleDisconnectedCall(msg);			
			break;
			
		case "notify_caption":
			handleCaption(msg);			
			break;
	}
})
*/

function setup(data) {
	console.debug("setup", data); 

	document.title = data.type == "incoming" ? "Incoming Call" : "Outgoing Call";
	callId = data.id;
	registerMgtComponents();
	
	currentCli = data.callerId;	
	currentEmail = data.emailAddress;
	callType = data.type;
	
	telCache = localStorage.getItem("cas.telephone.cache");
	if (!telCache) telCache = "{}";
	telCache = JSON.parse(telCache);	
	
	const dialPad = document.querySelector("#dial-pad");
	dialPad.shadowRoot.querySelector("button").style.backgroundColor = "white";
	
	callView = document.querySelector(".call-view");	
	searchView = document.querySelector(".call-search");		
	clientId = document.querySelector("#client-id");
	
	viewClient = document.querySelector("#view-client");
	acceptCall = document.querySelector("#accept-call");
	declineCall	= document.querySelector("#decline-call");
	muteMic = document.querySelector("#mute-mic");
	holdCall = document.querySelector("#hold-call");	
	transferCall = document.querySelector("#transfer-call");
	inviteUser	= document.querySelector("#invite-user");	
	inviteToMeeting = document.querySelector("#invite-to-meeting");
	
	acceptSuggestion = document.querySelector("#accept-suggestion");
	declineSuggestion = document.querySelector("#decline-suggestion");
	
	endCall = document.querySelector(".end-call");
	saveNotes = document.querySelector(".save-notes");
	summariseTranscript = document.querySelector(".summarise-transcript");
	liveTranscription = document.querySelector("#liveTranscription");
	
	internalCollab = document.querySelector(".internal-collab");
	clearCache = document.querySelector(".clear-cache");
	callOptions = document.querySelector(".call-options");
	
	assistButton = document.querySelector("#assist-button");
	assistText = document.querySelector("#assist-text");
	callControls = document.querySelector("#call-controls");
	
	viewClient.addEventListener("click", (evt) => {
		handleViewClientAction(evt.target);
	})
	
	const transcriptIndicator = document.querySelector("#transcript-indicator");
	transcriptIndicator.checked = getSetting("cas_enable_voice_transcription", true);
	
	transcriptIndicator.addEventListener("click", (evt) => {
		setSetting("cas_enable_voice_transcription", transcriptIndicator.checked);
	});		

	nextCall = document.querySelector("#make-next-call");	

	nextCall.addEventListener("click", (evt) => {
		// chrome.runtime.sendMessage({action: "make_next_call"});	
		//window.close();
	});
	
	if (data.clientId && getSetting("cas_enable_intelliflo")) {
		const companionId = data.clientId;
		localStorage.setItem("cas.companion.id", companionId);
		
		const openWorkstation = document.querySelector("#open-workstation");	

		openWorkstation.addEventListener("click", (evt) => {
			openBrowserTab("https://office.gb.intelliflo.net/nio/clientDashboard/" + companionId + "/dashboard");
		});	
	}		
	
	returnCall = document.querySelector("#return-call");	
	requestToJoin = document.querySelector("#request-join-call");
	
	returnCall.addEventListener("click", (evt) => {
		// chrome.runtime.sendMessage({action: "make_call", destination: data.callerId});
		returnCall.style.display = "none";	
		endCall.style.display = "none";	
		saveNotes.style.display = "";	
		viewClient.style.display = "";	
		setTimeout(() => window.close(), 1000);
	})	

	requestToJoin.addEventListener("click", (evt) => {
		requestToJoin.style.display = "none";	
		const destination = getSetting("cas_delegate_userid", "ba9e081a-5748-40ca-8fd5-ab9c74dae3d1");
		const data = {request: {features: {callerName: selectedContact.displayName,	calledId: destination}}};
		requestToJoinCall(data);
	})	
	
	acceptSuggestion.style.display = "none";	
	declineSuggestion.style.display = "none";
		
	acceptSuggestion.addEventListener("click", () => {
		viewClient.innerHTML = "View Client";	
		viewClient.id = "view";	
		acceptSuggestion.style.display = "none";	
		declineSuggestion.style.display = "none";		
	});
	
	declineSuggestion.addEventListener("click", () => {
		viewClient.id = "search";
		doSearch();
		acceptSuggestion.style.display = "none";	
		declineSuggestion.style.display = "none";		
	});	

	clearCache.addEventListener("click", () => {
		localStorage.removeItem("cas.telephone.cache"); // hack to clear cache
	});	
	
	internalCollab.addEventListener("click", () => {
		const chatId = getSetting("cas_active_call_thread_id", "19:83ec482c-3bc5-4116-acee-e081cc720630_ba9e081a-5748-40ca-8fd5-ab9c74dae3d1@unq.gbl.spaces")
		// chrome.runtime.sendMessage({action: "open_mgt_chat", url: getSetting("cas_server_url") + "/teams/mgt-chat/?chatId=" + chatId });
	});	
	
	assistButton.addEventListener("click", async (evt) => {
		const promptText = assistText.value;
		const url = getSetting("cas_server_url") + getPath() + "/prompt";				
		const resp = await fetch(url, {method: "POST", body: promptText, headers: {authorization: getSetting("cas_server_token")}});	
		const answer = await resp.text();
		assistText.value = "Question: " + promptText + "\n\n" + "Answer: " + answer;
	});
	
	summariseTranscript.addEventListener("click", async (evt) => {
		const promptText = "summarize this" + "\n" + liveTranscription.value;
		console.debug("summariseTranscript click");

		document.getElementById("summaryTranscription").value = "Please wait...";
		document.getElementById("tabTranscription").activeid = "summaryScript";	
		
		const url = getSetting("cas_server_url") + getPath() + "/prompt";				
		const resp = await fetch(url, {method: "POST", body: promptText, headers: {authorization: getSetting("cas_server_token")}});	
		const answer = await resp.text();
		document.getElementById("summaryTranscription").value = answer.substring(1);

	});
	
	callOptions.addEventListener("click", async (evt) => {
		viewClient.style.display = "none";	
		acceptCall.style.display = "none";
		declineCall.style.display = "none";	
		returnCall.style.display = "none";
		nextCall.style.display = "none";		
		requestToJoin.style.display = "none";			
		callControls.style.display = callControls.style.display == "" ? "none" : "";			
	});
	
	acceptCall.style.display = "none";
	declineCall.style.display = "none";			
	endCall.style.display = "none";	
	saveNotes.style.display = "none";	
	returnCall.style.display = "none";
	nextCall.style.display = "none";	
	requestToJoin.style.display = "none";		
	callControls.style.display = "none";		
	
	if (getSetting("cas_use_active_call_control", true)) {
		viewClient.style.display = "none";			
		endCall.style.display = "none";
		saveNotes.style.display = "none";
		
		acceptCall.addEventListener("click", (evt) => {
			// chrome.runtime.sendMessage({action: "accept_call", id: callId});
		})
		
		declineCall.addEventListener("click", (evt) => {
			// chrome.runtime.sendMessage({action: "reject_call", id: callId});
		})

		saveNotes.addEventListener("click", async (evt) => {
			const notes = document.getElementById("autoGeneratedNotes").value;
			console.debug("save notes", notes, oneNoteId);
			
			if (oneNoteId) {	
				const html = notes.replaceAll("\n", "<br/>");
				const noteData = [{target: "body", action: "replace", content: html}];
				await graphClient.api("/me/onenote/pages/" + oneNoteId + "/content").patch(noteData);	
				saveNotes.style.display = "none";				
			}
		});
		
		endCall.addEventListener("click", (evt) => {
			// chrome.runtime.sendMessage({action: "hangup_call", id: callId});
			//setTimeout(() => chrome.runtime.sendMessage({action: "set_presence_dnd"}), 3000);	
		})

		muteMic.addEventListener("click", (evt) => 
		{
			if (clientId.classList.contains("call-muted")) {					
				// chrome.runtime.sendMessage({action: "unmute_call", id: callId});	
				clientId.classList.remove("call-muted");
				clientId.classList.add("call-connected");				
			} else {
				// chrome.runtime.sendMessage({action: "mute_call", id: callId});
				clientId.classList.remove("call-connected");				
				clientId.classList.add("call-muted");
				
			}
		})
		
		holdCall.addEventListener("click", (evt) => 
		{
			if (clientId.classList.contains("call-held")) {
				// chrome.runtime.sendMessage({action: "resume_call", id: callId});				
			} else {
				// chrome.runtime.sendMessage({action: "hold_call", id: callId});
			}
		})
		
		transferCall.addEventListener("click", (evt) => {
			const picker = document.querySelector("#call-people-picker");
			
			if (picker?.selectedPeople.length > 0) {
				const person = picker.selectedPeople[0];
				let destination = getDestination(person);

				if (destination) {
					// chrome.runtime.sendMessage({action: "transfer_call", id: callId, destination});				
				} else {
					alert("Unable to transfer, target is not an organization user or has no telephone number");
				}				
			} else {
				const destination = picker.shadowRoot.querySelector("fluent-text-field").value;
				
				if (destination.length > 0) {	
					console.debug("input", destination); 
					// chrome.runtime.sendMessage({action: "transfer_call", id: callId, destination});					
				} else { 
					alert("Unable to transfer call, target has not been selected or input provided");
				}
			}
		})
			
		inviteUser.addEventListener("click", (evt) => {			
			const picker = document.querySelector("#call-people-picker");
			
			if (picker?.selectedPeople.length > 0) {
				const person = picker.selectedPeople[0];
				let destination = getDestination(person);

				if (destination) {
					// chrome.runtime.sendMessage({action: "add_third_party", id: callId, destination});
				} else {
					alert("Unable to add participant to call, target is not an organization user or has no telephone number");
				}
				
			} else {
				const destination = picker.shadowRoot.querySelector("fluent-text-field").value;
				
				if (destination.length > 0) {	
					console.debug("input", destination); 
					// chrome.runtime.sendMessage({action: "add_third_party", id: callId, destination});					
				} else { 
					alert("Unable to add participant to call, target has not been selected or input provided");
				}
			}
		})	
		
		inviteToMeeting.addEventListener("click", (evt) => {
			const key = clientId.personDetails?.id;
			const emails = clientId.personDetails.scoredEmailAddresses;
			const name = clientId.personDetails.displayName;
			
			joinMeeting(key, emails, name, data);			
		})
		
	}		
	
	selectedContact = getClient(data);		
	clientId.fallbackDetails.displayName = selectedContact.displayName;
		
	if (data.emailAddress) {
		clientId.personQuery = data.emailAddress;
	} else if (selectedContact?.scoredEmailAddresses) {
		clientId.personQuery = selectedContact.scoredEmailAddresses[0].address;
	}	

	if (data.action == "notify_cas_dialer_connected") { // embedded in intelliflo
		embeded = true;
		handleConnectedCall(data);
		
	} else {

		if (data.type == "incoming") {
			acceptCall.style.display = "";
			declineCall.style.display = "";	
		} else {
			
			if (data.action == "display_contact") {
				returnCall.style.display = "";
				
			} else {
				viewClient.innerHTML = "View Client";	
				viewClient.id = "view";	
				viewClient.style.display = "";	
			}				
		}
	}
	
	changeCallPresence("Available", "Available");	
	callView.style.display = "";	
}

async function getAccessToken(scopes) {
	console.debug("getAccessToken scope", scopes);	
	const url = getSetting("cas_server_url") + getPath() + "/msal/token/graph/" + getScopes(scopes);				
	const resp = await fetch(url, {method: "GET", headers: {authorization: getSetting("cas_server_token")}});	
	const json = await resp.json();
	console.debug("getAccessToken token", json);
	meEmail = json.username;
	return Promise.resolve(json.access_token);
}

function login() {
	console.debug("login");	
	Providers.globalProvider.setState(ProviderState.SignedIn);
	graphClient = Providers.globalProvider.graph.client;;
	setTimeout(() => {getOneNotes(); fetchPhotos()}, 1000);
	callView.style.display = "";
}

function logout() {
	console.debug("logout");		
	Providers.globalProvider.setState(ProviderState.SignedOut)
}

function getScopes(scopes) {
	return "User.Read, User.ReadWrite, User.Read.All, People.Read, User.ReadBasic.All, presence.read.all, Mail.ReadBasic, Tasks.Read, Group.Read.All, Tasks.ReadWrite, Tasks.Read.Shared, Group.ReadWrite.All, Notes.ReadWrite.All";
}

function requestToJoinCall(data) {
	console.debug("requestToJoinCall", data);

	const message = "Can you please invite me to the call with " + data.request.features.callerName;
	const authorization = getSetting("cas_server_token");
	const url = getSetting("cas_server_url") + getPath() + "/chatThreadId/" + data.request.features.calledId + "/" + message;			
	fetch(url, {method: "POST", headers: {authorization}});	
}

function changeCallPresence(activity, availability) {
	clientId.showPresence = false;
	clientId.personPresence.activity = activity;
	clientId.personPresence.availability = availability;
	clientId.showPresence = true;	
}

function handleDisconnectedCall(data) {
	const companionId = localStorage.getItem("cas.companion.id");
	console.debug("handleDisconnectedCall", companionId, data);
	
	changeCallPresence("Offline", "Offline");
	clientId.classList.remove("call-connected");
	clientId.classList.add("call-disconnected");	

	if (document.title.startsWith("Outgoing")) {
		nextCall.style.display = "";	
	}

	returnCall.style.display = "";
	requestToJoin.style.display = "none";		
	acceptCall.style.display = "none";
	declineCall.style.display = "none";	
	endCall.style.display = "none";	
	saveNotes.style.display = "";
	callControls.style.display = "none";	
	hideClock();

	if (companionId && getSetting("cas_autopop_intelliflo", false) && getSetting("cas_embed_in_workstation", false)) {	
		data.action = "clear_call";
		sendMessageToWorkstation(data);
	}
}

function handleMissedCall(data) {
	changeCallPresence("Offline", "Offline");	
	
	returnCall.style.display = "";	
	requestToJoin.style.display = "none";		
	acceptCall.style.display = "none";
	declineCall.style.display = "none";		
	endCall.style.display = "none";
	saveNotes.style.display = "";
	
	if (viewClient.id == "view") {
		//viewClient.style.display = "";		
	}	
}

function handleElseWhereCall(data) {
	changeCallPresence("Away", "Away");	

	requestToJoin.style.display = "";		
	returnCall.style.display = "none";		
	acceptCall.style.display = "none";
	declineCall.style.display = "none";	
	endCall.style.display = "none";
	saveNotes.style.display = "";	
	viewClient.style.display = "";		
}

function handleHeldCall(data) {
	clientId.classList.remove("call-connected");	
	clientId.classList.add("call-held");	
}

function handleConnectedCall(data) {
	const companionId = localStorage.getItem("cas.companion.id");	
	const clockText = document.getElementById("clocktext");
	console.debug("handleConnectedCall", companionId, clockText, data);
	
	callId = data.id;
	clientId.classList.remove("call-disconnected", "call-held");	
	clientId.classList.add("call-connected");
	
	changeCallPresence("InACall", "Busy");
	
	if (clockText?.style.display == "none") {	
		//data.extnId = chrome.runtime.id;
		data.callerId = currentCli;
		data.emailAddress = currentEmail;
		data.embedInWorkstation = getSetting("cas_embed_in_workstation", false) || getSetting("cas_embed_in_teams", false);

		// https://teams.microsoft.com/v2/#/l/entity/b0435d07-bbf1-4881-973c-e065e078eb14/com.comitfs.workflow.active.call?deeplinkId=eaf9ea54-1859-4b20-bafb-8cb665f1ef37
		
		showClock();	
		
		if (!embeded) 
		{
			if (companionId && getSetting("cas_autopop_intelliflo", false)) {
				let hash = "";				
				if (data.embedInWorkstation) hash = "#" + btoa(JSON.stringify(data));
				
				openBrowserTab("https://office.gb.intelliflo.net/nio/clientDashboard/" + companionId + "/dashboard" + hash);			
			}
				
			if (getSetting("cas_embed_in_teams", false)) {
				const deepLink = getSetting("cas_deep_link_id", "eaf9ea54-1859-4b20-bafb-8cb665f1ef37");
				openBrowserTab("https://teams.microsoft.com/v2/#/l/entity/b0435d07-bbf1-4881-973c-e065e078eb14/com.comitfs.workflow.active.call?deeplinkId=" + deepLink);
			}			

				
			if (data.embedInWorkstation) {
				setTimeout(() => window.close(), 3000);
				return;
			}			
		}
	}

	endCall.style.display = "";		
	acceptCall.style.display = "none";	
	declineCall.style.display = "none";	
	
	searchView.style.display = "none";
	callView.style.display = "";	

	if (viewClient.id == "search" || viewClient.id == "suggest") {
		viewClient.style.display = "";
	
		if (viewClient.id == "suggest") {
			acceptSuggestion.style.display = "";	
			declineSuggestion.style.display = "";	
		}			
		return;
	}
		
	setToActiveClient();	
}

function handleConferencedCall(data) {
	if (!clientId) return;
	
	clientId.classList.remove("call-connected", "call-conferenced");	
	
	if (data.participants.length > 1) {
		clientId.classList.add("call-conferenced");
	} else {
		clientId.classList.add("call-connected");	
	}
}

function handleSms(data) {
	console.debug("handleSms", data);
}

function handleSharedActiveCall(data) {
	console.debug("handleSharedActiveCall", data);
	
	if (getSetting("cas_enable_shared_active_call_notification")) {
		let callerName = data.request.features.callerName;
		if (callerName.startsWith("+")) callerName = telCache[callerName]?.displayName
		if (!callerName) callerName = data.request.features.callerName;
		
		data.request.features.callerName = callerName;
		data.contextMessage = "Client " + callerName + " started a call with FA " + data.request.features.calledName;
		// chrome.runtime.sendMessage({action: "show_shared_active_call",  data});		
	}
}

function handleViewClientAction(target) {
	console.debug("handleViewClientAction", target);
	
	if (target.id == "view" || target.id == "suggest") {
		setToActiveClient();
		callView.style.display = "";
		searchView.style.display = "none";		
	}
	else
		
	if (target.id == "search") {
		doSearch();
	}
}

function doSearch() {
	resizeWindowSearch();		
	callView.style.display = "none";
	searchView.style.display = "";	
	
	const picker = document.querySelector("#search-people-picker");
	
	picker.addEventListener("selectionChanged", (evt) => {
		console.log("selected", evt.detail);
		
		if (evt.detail.length > 0) {
			selectedContact = evt.detail[0];	
			clientId.personDetails = evt.detail[0];			
			updateCache();
			setToActiveClient();	
		}			
	})
}

function openBrowserTab(url) {
	console.debug("openBrowserTab", url);
	
	/*
	chrome.tabs.query({}, (tabs) =>	{
		let workstationTab;
		
		if (tabs) {
			const workstationTabs = tabs.filter(function(t) { return t.url.toLowerCase().substring(0, 20) === url.toLowerCase().substring(0, 20); });

			if (workstationTabs.length) {
				workstationTab = workstationTabs[0];
				chrome.tabs.update(workstationTabs[0].id, {url, highlighted: true, active: true});
				localStorage.setItem("cas.workstation.id", workstationTab.id);				
			} else {
				chrome.tabs.create({url, active: true}, function(tab) {
					workstationTab = tab;
					localStorage.setItem("cas.workstation.id", workstationTab.id);					
				});
			}
		}
	});
	*/
}

function sendMessageToWorkstation(data) {
	const tabId = localStorage.getItem("cas.workstation.id");
	console.debug("sendMessageToWorkstation", tabId, data);
	
	if (tabId) {
		/*chrome.tabs.sendMessage(parseInt(tabId), data, {}, function(response) 
		{
			if (response) {
				console.debug("sendMessageToWorkstation response", response);
			}
		});*/
	}
}

function getClient(data) {
	console.debug("getClient", data, telCache);	

	if (data.label == "Unknown Caller") {
		const stored = telCache[data.callerId];	
		
		if (stored?.displayName) {
			viewClient.innerHTML = "Suggested Match";
			viewClient.id = "suggest";
			viewClient.style.display = "";									
			return stored;
		}
 
		viewClient.innerHTML = "Search";
		viewClient.id = "search";				
		return {displayName: "No Match", scoredEmailAddresses: [{address: ""}]};
	}
	
	viewClient.innerHTML = "View Client";	
	viewClient.id = "view";	
	return {displayName: data.label, scoredEmailAddresses: [{address: ""}]};
}

function urlParam(name) {
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (!results) { return undefined; }
	return unescape(results[1] || undefined);
};

function resizeWindowFull() {
	resizeTo(600, 930);
	moveTo(screen.availWidth - 520, screen.availHeight - 1010);
}

function resizeWindowSearch() {
	resizeTo(500, 700);
	moveTo(screen.availWidth - 520, screen.availHeight - 780);	
}

function resizeWindowMinimised() {
	resizeTo(350, 200);
	moveTo(screen.availWidth - 370, screen.availHeight - 240);		
}

function setToActiveClient() {
	console.debug("setToActiveClient");
	
	clientId.showPresence = false;	
	clientId.fallbackDetails.displayName = selectedContact.displayName;	
	clientId.showPresence = true;
	callView.style.display = "";	

	viewClient.id = "active";
	viewClient.style.display = "none";
	
	searchView.style.display = "none";		
	acceptSuggestion.style.display = "none";	
	declineSuggestion.style.display = "none";
	endCall.style.display = "";	
	saveNotes.style.display = "none";
	resizeWindowFull();	
}

function getDestination(person) {
	console.debug("getDestination", person);
	
	let destination = null;

	if (person.personType.subclass == "OrganizationUser") {
		destination = person.id;
		
	} else if (person.phones.length > 0) {
		destination = person.phones[0].number.replaceAll(" ", ""); // TODO pick list
	}

	return destination;
}

function updateCache() {
	telCache[currentCli] = selectedContact;
	localStorage.setItem("cas.telephone.cache", JSON.stringify(telCache));
}

function doFilter(filterList) {
	const filter = filterList.value.toLowerCase();
	const panels = document.querySelectorAll('.ms-PeoplePicker-result');	

	panels.forEach((panel) => {
		panel.style.display = "block";
		const name = panel.querySelector('.ms-Persona-primaryText').innerHTML.toLowerCase();
		console.debug("oninput", filter, name);				
		
		if (filter.length > 0 && name.indexOf(filter) == -1) {
			panel.style.display = "none";
		}				
	});		
}

function getInitials(nickname) {
	if (!nickname) nickname = "Anonymous";
	var initials = nickname.substring(nickname, 0)

	var first, last, pos = nickname.indexOf("@");
	if (pos > 0) nickname = nickname.substring(0, 1);

	// try to split nickname into words at different symbols with preference
	let words = nickname.split(/[, ]/); // "John W. Doe" -> "John "W." "Doe"  or  "Doe,John W." -> "Doe" "John" "W."
	if (words.length == 1) words = nickname.split("."); // "John.Doe" -> "John" "Doe"  or  "John.W.Doe" -> "John" "W" "Doe"
	if (words.length == 1) words = nickname.split("-"); // "John-Doe" -> "John" "Doe"  or  "John-W-Doe" -> "John" "W" "Doe"

	if (words && words[0] && words.first != '') {
		const firstInitial = words[0][0]; // first letter of first word
		var lastInitial = null; // first letter of last word, if any

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

function hideClock() {
	document.getElementById("clocktext").style.display = "none";
}

function showClock() {
	const textElem = document.getElementById("clocktext");
	textElem.style.display = "";
	const clockTrackJoins = Date.now();

	function updateClock() {
		let clockStr = formatTimeSpan((Date.now() - clockTrackJoins) / 1000);
		textElem.textContent = clockStr;
		
		if (document.getElementById("clocktext").style.display != "none") {
			setTimeout(updateClock, 1000);
		}
	}

	updateClock();
}

function formatTimeSpan(totalSeconds) {
	const secs = ('00' + parseInt(totalSeconds % 60, 10)).slice(-2);
	const mins = ('00' + parseInt((totalSeconds / 60) % 60, 10)).slice(-2);
	const hrs = ('00' + parseInt((totalSeconds / 3600) % 24, 10)).slice(-2);
	return `${hrs}:${mins}:${secs}`;
}

async function getMeetingLink(meetId) {	
	const resp1 = await fetch(getSetting("cas_server_url") + getPath() + "/shared/meeting/" + meetId, {method: "GET", headers: {authorization: getSetting("cas_server_token")}});	
	const line = await resp1.json();	
	return line.joinWebUrl;	
}

async function sendEmail(email, subject, body) {
	console.log("sendEmail", email, subject, body);
	await fetch(getSetting("cas_server_url") + `/plugins/casapi/v1/companion/email/${subject}/${email}`, {method: "POST", headers: {authorization: getSetting("cas_server_token")}, body})	
}

async function sendWhatsAppInvite(data, meetingLink) {
	const telephoneNo = data.callerId;	
	const body = meetingLink.replace("https://teams.microsoft.com/l/meetup-join/", "");
	console.log("sendWhatsAppInvite", body, telephoneNo, data, meetingLink);	
	await fetch(getSetting("cas_server_url") + getPath() + "/workflow/whatsapp/" + telephoneNo + "/join_teams_meeting", {method: "POST", headers: {authorization: getSetting("cas_server_token")}, body});	
}

async function joinMeeting(key, emails, name, data) {	
	// don't current hangup. wiat for use to end call
	//// chrome.runtime.sendMessage({action: "hangup_call", id: callId});
	
	const address = await getMeetingLink(key);	
	const action = "join_meeting";			
	const locator = {meetingLink: btoa(address)};
	const token = getSetting('cas_access_token');
	const userId = { microsoftTeamsUserId: getSetting('cas_endpoint_address')};	
	const displayName = getSetting('cas_endpoint_name');	
	// chrome.runtime.sendMessage({key, action,  data: {locator, displayName, userId, token}});

	const body = `Hi ${name},\n\nPlease join meeting at ${address}\n\n${getSetting('cas_endpoint_name')}`;
	const subject = "Online Meeting with " + getSetting('cas_endpoint_name')
		
	for (let email of emails) {
		sendEmail(email.address, subject, body);
	}
	
	sendWhatsAppInvite(data, address);	
}

async function getOneNotes() {
	const sectionId = getSetting("cas_one_note_section_id", "1-34167a55-e4a4-4c4c-ac99-dec00153c31a");
	const oneNotes = [];
	
	let json = await graphClient.api("/me/onenote/pages").header('Cache-Control', 'no-store').get();
	
	for (let oneNote of json.value) 
	{
		if (oneNote.parentSection.id == sectionId && oneNote.title.indexOf("@") > -1) {
			oneNotes[oneNote.title] = oneNote;
		}
	}
	
	console.debug("Graph API /me/onenote/pages", json, oneNotes);
	oneNoteId = oneNotes[currentEmail]?.id;
	oneNoteUrl = oneNotes[currentEmail]?.links.oneNoteWebUrl.href; 

	if (!oneNoteId) {
		const html = "<!DOCTYPE html><html><head><title>" + currentEmail + "</title></head><body></body></html>";
		const newNote = await graphClient.api("/me/onenote/sections/" + sectionId + "/pages").header('Content-type', 'application/xhtml+xml').post(html);
		oneNoteId = newNote.id;
		oneNoteUrl = newNote.links.oneNoteWebUrl.href; 		
		console.debug("Created new note", newNote);	

		/*if (companionId) {
			const authorization = getSetting("cas_server_token");
			const url = getSetting("cas_server_url") + getPath() + "/intelliflo/clients/" + companionId + "/onenote";			
			const response =  await fetch(url, {method: "POST", body: oneNoteUrl, headers: {authorization}});	
			const resultData = await response.json();
			
			console.debug("Create onenote web url", resultData, oneNoteUrl, companionId);				
		}*/		
	}
	
	setTimeout( async() => {
		console.debug("Get onenote", oneNoteId, oneNoteUrl);
		
		const noteNode = await graphClient.api("/me/onenote/pages/" + oneNoteId + "/content").header('Cache-Control', 'no-store').get();	
		
		if (noteNode) {
			const nodeText = noteNode.querySelector("body div p");
			
			if (nodeText) {
				const noteText = nodeText.innerHTML.replaceAll("<br>", "");
				console.debug("OneNote Id", oneNoteId, noteText);
				document.getElementById("autoGeneratedNotes").value = noteText;
			}
		}
	}, 1000);		
}

function handleCaption(msg) {
	const delegateName = getSetting("cas_delegate_username", "florence");	
	const defaultList = "tomorrow\nnext week\nnext month\nnext year\ninvite " + delegateName;
	const actionWords = getSetting("cas_active_call_action_keywords", defaultList).split("\n");	
	console.debug("handleCaption", msg.speakerName, msg.captionText);
	liveTranscription.value += msg.speakerName + ": " + msg.captionText + "\n"

	let formattedText = msg.captionText; 	
	let searchText = formattedText.toLowerCase();
	let actionedWord = false;
	
	for (let actionWord of actionWords) {
		const pos = searchText.indexOf(actionWord.toLowerCase());
		
		if (pos > -1) {
			actionedWord = true;
			const color = defaultList.indexOf(actionWord.toLowerCase()) > -1 ? "blue" : "red";
			const word = formattedText.substring(pos, pos + actionWord.length);
			formattedText = formattedText.replace(word, "<a data-keytext='" + escape(msg.captionText) + "' data-keyword='" + actionWord + "' href='#' class='action-keyword' style='color: " + color + "'>" + word + "</a>");
			searchText = formattedText.toLowerCase();			
		}
	}
		
	let alignedText;
	
	if (msg.me) {
		alignedText = "<div style='text-align: left;'>" + "<img style='width:32px;height:32px;' src='" + mePhoto + "'>&nbsp;" + formattedText + "</div>";
	} else {
		alignedText = "<div style='text-align: right;'>" + formattedText + "&nbsp;<img style='width:32px;height:32px;' src='" + contactPhoto + "'></div>";
	}
	
	document.getElementById("formattedTranscription").innerHTML += alignedText;
	if (actionedWord) document.getElementById("actionsList").innerHTML += alignedText;
	
	for (let ele of document.querySelectorAll(".action-keyword")) 
	{
		ele.addEventListener("click", (evt) => {
			const keyword = evt.target.getAttribute("data-keyword");
			const keytext = evt.target.getAttribute("data-keytext");
			
			let startDate;
			
			if (keyword == "invite " + delegateName) {
				const destination = getSetting("cas_delegate_userid", "ba9e081a-5748-40ca-8fd5-ab9c74dae3d1");				
				// chrome.runtime.sendMessage({action: "add_third_party", id: callId, destination});
			}
			else {
				
				if (keyword == "tomorrow") {
					startDate = dayjs().add(1, 'day');
				}
				else
					
				if (keyword == "next week") {
					startDate = dayjs().add(7, 'day');
				}
				else
					
				if (keyword == "next month") {
					startDate = dayjs().add(30, 'day');
				}			

				else
					
				if (keyword == "next year") {
					startDate = dayjs().add(365, 'day');
				}
				
				if (startDate) {
					const endDate = startDate.add(1, 'hour');			
					const url = "https://outlook.office.com/calendar/0/deeplink/compose?enddt=" + escape(endDate.toISOString()) + "&path=/calendar/action/compose&rru=addevent&startdt=" + escape(startDate.toISOString()) + "&subject=" + keytext;
					const date = startDate.format('ddd, MMM D, YYYY h:mm A');
					console.debug("handleCaption click", url, date);
					
					if (confirm("Create Calendar Invite for " + date)) {				
						openBrowserTab(url);
					}
				}
			}
			
			console.debug("user selected action", keyword, keytext);
		})
	}
}

async function fetchPhotos() {
	let url = getSetting("cas_server_url") + getPath() + "/workflow/photo/" + meEmail + "/" + getSetting('cas_endpoint_name');				
	let resp = await fetch(url, {method: "GET", headers: {authorization: getSetting("cas_server_token")}});	
	mePhoto = await resp.text();	

	try {
		url = getSetting("cas_server_url") + getPath() + "/workflow/photo/" + clientId.personQuery + "/" + clientId.fallbackDetails.displayName;				
		resp = await fetch(url, {method: "GET", headers: {authorization: getSetting("cas_server_token")}});	
		contactPhoto = await resp.text();
	} catch (e) {
		console.error("fetchPhotos", e);
		contactPhoto = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiA8cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzU1NSIvPgogPGNpcmNsZSBjeD0iNjQiIGN5PSI0MSIgcj0iMjQiIGZpbGw9IiNmZmYiLz4KIDxwYXRoIGQ9Im0yOC41IDExMiB2LTEyIGMwLTEyIDEwLTI0IDI0LTI0IGgyMyBjMTQgMCAyNCAxMiAyNCAyNCB2MTIiIGZpbGw9IiNmZmYiLz4KPC9zdmc+Cg==";
	}
	
	console.debug("fetchPhotos", contactPhoto, mePhoto, clientId.personQuery);
}

function getPath() {
	let url =  "/plugins/casapi/v1/companion";
	return url;
}
