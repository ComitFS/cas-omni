import { registerMgtComponents, Providers, SimpleProvider, ProviderState } from './mgt.js';
						
window.addEventListener("load", function() {
	registerMgtComponents();
	
	const callId = localStorage.getItem("cas_activecall_id");
	
	if (callId) {
		document.querySelector(".client-info").style.display = "";
		
		const muteMic = document.querySelector("#mute-mic");
		const holdCall = document.querySelector("#hold-call");	
		const transferCall = document.querySelector("#transfer-call");
		const inviteUser	= document.querySelector("#invite-user");	
		const endCall = document.querySelector(".end-call");		
		
		endCall.addEventListener("click", (evt) => {
			chrome.runtime.sendMessage({action: "hangup_call", id: callId});
			setTimeout(() => chrome.runtime.sendMessage({action: "set_presence_dnd"}), 3000);	
		})

		muteMic.addEventListener("click", (evt) => 
		{
			if (muteMic.classList.contains("call-muted")) {					
				chrome.runtime.sendMessage({action: "unmute_call", id: callId});	
				muteMic.classList.remove("call-muted");
				muteMic.classList.add("call-connected");				
			} else {
				chrome.runtime.sendMessage({action: "mute_call", id: callId});
				muteMic.classList.remove("call-connected");				
				muteMic.classList.add("call-muted");
				
			}
		})
		
		holdCall.addEventListener("click", (evt) => 
		{
			if (holdCall.classList.contains("call-held")) {
				chrome.runtime.sendMessage({action: "resume_call", id: callId});
				holdCall.classList.remove("call-held");				
			} else {
				chrome.runtime.sendMessage({action: "hold_call", id: callId});
				holdCall.classList.add("call-held");				
			}
		})
		
		inviteUser.addEventListener("click", (evt) => {			
			const picker = document.querySelector("#call-people-picker");
			
			if (picker?.selectedPeople.length > 0) {
				const person = picker.selectedPeople[0];
				let destination = getDestination(person);

				if (destination) {
					chrome.runtime.sendMessage({action: "add_third_party", id: callId, destination});
				} else {
					alert("Unable to add participant to call, target is not an organization user or has no telephone number");
				}
				
			} else {
				const destination = picker.shadowRoot.querySelector("fluent-text-field").value;
				
				if (destination.length > 0) {	
					console.debug("input", destination); 
					chrome.runtime.sendMessage({action: "add_third_party", id: callId, destination});					
				} else { 
					alert("Unable to add participant to call, target has not been selected or input provided");
				}
			}
		})		
		
	} else {
		document.getElementById("main-body").style.display = "";
		
		const picker = document.querySelector("#people-picker");
		const makeCall = document.querySelector("#make-call");
		const dialPads = document.querySelectorAll(".dial-key-wrap");
		
		for (let dialpad of dialPads) dialpad.addEventListener("click", (evt) => 
		{
			console.debug("dialpad clicked", evt.target.parentNode.getAttribute("data-key"));
			const destination = picker.shadowRoot.querySelector("fluent-text-field").value;
			picker.shadowRoot.querySelector("fluent-text-field").value = destination + evt.target.parentNode.getAttribute("data-key");
		});
		
		picker.addEventListener("selectionChanged", (evt) => {
			console.log("selected", evt.detail);

			if (evt.detail.length == 1) {
				dialSelected(evt.detail);
			}		
		})	
		
		makeCall.addEventListener("click", (evt) => 
		{		
			if (picker?.selectedPeople.length > 0) {
				dialSelected(picker.selectedPeople);			

			} else {
				dialPhoneNumber(picker);
			}
		});	

	
		picker.renderInput();
		picker.focus();			
	}
	
	
	Providers.globalProvider = new SimpleProvider(getAccessToken, login, logout);	
	Providers.globalProvider.login();
});

window.addEventListener("unload", function() {
	
});

chrome.runtime.onMessage.addListener(async (msg) => {	
	console.debug("chrome.runtime.onMessage", msg);	
})

function dialPhoneNumber(picker) {
	const destination = picker.shadowRoot.querySelector("fluent-text-field").value;

	if (destination.length > 0) {	
		console.debug("input", destination); 
		chrome.runtime.sendMessage({action: "make_call", destination});	
		window.close();		
	} else { 
		alert("Unable to make call, target has not been selected or input provided");
	}	
}

function dialSelected(selected) {
	console.log("dialSelected", selected);

	if (selected.length == 1) {
		const person = selected[0];
		const displayName = person.displayName;			
		const destination = getDestination(person);

		if (destination) {
			chrome.runtime.sendMessage({action: "make_call", destination, displayName});	
			window.close();
		} else {
			alert("Unable to make call, target is not an organization user or has no telephone number");
		}				
	} 
	else
		
	if (selected.length > 1) { // TODO call list
		const contacts = [];
		
		for (let person of selected) {
			contacts.push({name: person.displayName, destination: getDestination(person), email: person.scoredEmailAddresses[0]?.address});
		}
		
		const url = "/call-list.html";
		const action = "open_webapp";
		const key = "call-list";	
		chrome.runtime.sendMessage({action,  data: {key, url, contacts}, width: 800, height: 800});	
		window.close();		
	}
}

function getDestination(person) {
	console.debug("getDestination", person);
	
	let destination = null;

	if (person.personType?.subclass == "OrganizationUser") {
		destination = person.id;
		
	}
	else 
	
	if (person.phones.length > 0) {
		destination = person.phones[0].number.replaceAll(" ", ""); // TODO pick list
	}
	else
		
	if (person.imAddress) {
		destination = person.imAddress;
		if (destination.indexOf("@") > -1) destination = destination.split("@")[0];
	}
	return destination;
}

async function getAccessToken(scopes) {
	console.debug("getAccessToken scope", scopes);	
	const url = getSetting("cas_server_url") + getRootPath() + "/msal/token/graph/" + getScopes(scopes);				
	const resp = await fetch(url, {method: "GET", headers: {authorization: getSetting("cas_server_token")}});	
	const json = await resp.json();
	console.debug("getAccessToken token", json);	
	return Promise.resolve(json.access_token);
}

function login() {
	console.debug("login");	
	Providers.globalProvider.setState(ProviderState.SignedIn)
}

function logout() {
	console.debug("logout");		
	Providers.globalProvider.setState(ProviderState.SignedOut)
}

function getScopes(scopes) {
	return "User.Read, User.ReadWrite, User.Read.All, People.Read, User.ReadBasic.All, presence.read.all, Mail.ReadBasic, Tasks.Read, Group.Read.All, Tasks.ReadWrite, Group.ReadWrite.All";
}

function getRootPath() {
	let url =  "/teams/api/openlink";
	
	if (getSetting("cas_paas_enabled")) {
		url =  "/plugins/casapi/v1/companion";
	}
	return url;
}


