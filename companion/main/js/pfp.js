window.addEventListener("load", doPageScan);
window.addEventListener("hashchange", doPageScan);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {  
	console.debug("onMessage", request, sender);
	
	if (request.action == "clear_call") {
		localStorage.removeItem("cas.companion.data");
		
		sendResponse({content: "response message"});
		return true;
	}
})

async function doPageScan(event)  {
	console.debug("cas companion scanner");	
	
	if (location.href.toLowerCase().startsWith("https://office.gb.intelliflo.net/nio/dashboard/userdashboard")) {
		setupUserDashboard();
	}
	else
		
	if (location.href.toLowerCase().startsWith("https://office.gb.intelliflo.net/nio/clientdashboard")) {
		setupClientDashboard();
	}
	else	
		
	if (location.href.startsWith("https://34737.gb.pfp.net/mfe/dashboard")) {		
		const div = document.createElement("div");
		const adviser = '83ec482c-3bc5-4116-acee-e081cc720630';
		const presence = await getPresence(adviser);
		const bgColor = presence?.activity == "InACall" ? "#8f4f4f" : "#4f8f4f";
		
		const telephone = '<svg width="32px" height="32px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffff"> <g> <path d="M 13.216,8.064C 12.834,3.67, 8.25,1.514, 8.056,1.426C 7.874,1.34, 7.67,1.314, 7.474,1.348 c-5.292,0.878-6.088,3.958-6.12,4.086C 1.31,5.614, 1.318,5.8, 1.374,5.974c 6.312,19.584, 19.43,23.214, 23.742,24.408 c 0.332,0.092, 0.606,0.166, 0.814,0.234c 0.1,0.034, 0.204,0.048, 0.308,0.048c 0.142,0, 0.284-0.030, 0.414-0.090 c 0.132-0.060, 3.248-1.528, 4.010-6.316c 0.034-0.208,0-0.424-0.096-0.612c-0.068-0.132-1.698-3.234-6.218-4.33 c-0.316-0.082-0.64,0.002-0.884,0.21c-1.426,1.218-3.396,2.516-4.246,2.65c-5.698-2.786-8.88-8.132-9-9.146 C 10.148,12.46, 11.454,10.458, 12.956,8.83C 13.146,8.624, 13.242,8.344, 13.216,8.064z"></path> </g> </svg>	';
		const video = '<svg width="1.5em" height="1.5em" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffff"> <g> <path d="M13 6.5A2.5 2.5 0 0 0 10.5 4h-6A2.5 2.5 0 0 0 2 6.5v7A2.5 2.5 0 0 0 4.5 16h6a2.5 2.5 0 0 0 2.5-2.5v-7Zm1 1.43v4.15l2.76 2.35a.75.75 0 0 0 1.24-.57V6.2a.75.75 0 0 0-1.23-.57L14 7.93Z"></path>					   </g> </svg>	';
		const svg = location.hash == "#telephone" ? telephone : video;
		div.id = "call-widget";
		div.innerHTML = `
			<div id="call-widget-header">
				<button title="Start a conversation with Adviser"  class='widget' style='height: 75px;     width: 75px;     position: absolute;     right: 0;     bottom: 0;     background-color: ${bgColor};     margin-bottom: 35px;     margin-right: 35px;     border-radius: 50%;     text-align: center;     vertical-align: middle;     line-height: 75px;      color: white;     font-size: 30px;'>
					${svg}
				</button>
				<div class='callWidget' style='height: 500px;     width: 850px;     background-color: gray;     position: absolute;     right: 35px;     bottom: 120px;     z-index: 10;     display: none;     border-radius: 5px;     border-style: solid;     border-width: 5px;'></div>
			</div>
		`
		document.body.appendChild(div);
		
		var open = false;
		const button = document.querySelector('.widget');
		const content = document.querySelector('.callWidget');
		const buttonIcon = button.innerHTML;
		
		const emailAddress = "dele@4ng.net";	
		const webJoinUrl = await getWebUrl(emailAddress);		
		const destination = { microsoftTeamsUserId: adviser};
		const userId = { communicationUserId: '8:acs:7278b90e-91bb-4a42-8913-9233b5d4ad4f_0000000d-ce88-0aa9-0cf9-9c3a0d004831' };		
		const token = await getToken(userId);
		console.debug("cas companion token", webJoinUrl, token);
		
		let call;

		button.addEventListener('click', async function() 	{	
			console.debug("click", open);
			
			if(!open){
				open = !open;
				button.innerHTML = 'X';
				
				const displayName = "JJ Gartland";				
				
				if (location.hash == "#telephone") {
					const tokenCredential = new ACS.AzureCommunicationTokenCredential(token);		
					const callClient = new ACS.CallClient();			
					const callAgent = await callClient.createCallAgent(tokenCredential, { displayName});				
					call = await callAgent.startCall([destination]);
					
				} 
				else {
					
					if (location.hash == "#video") {
						const locator = {group: '83ec482c-3bc5-4116-acee-e081cc720630'};
						const data = {token, displayName, userId, destination, locator};
						const url = "https://comitfs.github.io/cas-omni/demo/client/video-call.html?data=" + btoa(JSON.stringify(data));
						
						content.innerHTML = '<iframe src="' + url + '" id="cas-companion" allow="microphone; camera;" frameborder="0" seamless="seamless" allowfullscreen="true" scrolling="no" style="z-index: 2147483647;width:100%;height:-webkit-fill-available;height:-moz-available;"></iframe>';
						content.style.display = 'block';
					} else {						
						const locator = {meetingLink: webJoinUrl};
						const data = {token, displayName, userId, destination, locator};
						const url = "https://comitfs.github.io/cas-omni/demo/client/video-call.html?data=" + btoa(JSON.stringify(data));
						
						window.open(url, "cas-companion-pfp");
					}
				}

				
			} else if (open) {
				open = !open;
				content.innerHTML = "";
				content.style.display = 'none';
				button.innerHTML = buttonIcon;
				
				if (call) call.hangUp();
				call = undefined;
			}
		});	

		window.onbeforeunload = () => {
			if (call) call.hangUp();
		};		
	}
}

async function setupUserDashboard() {		
	console.debug("setupUserDashboard");
	
	const test1 = document.querySelector("div#component-813b101e-a29d-4211-b5f6-b4b2bef00f43 div.widg-cont");	const test2 = document.querySelector("div#component-5dc8c2a5-beb3-4bab-90c8-2c400d74b468 div.widg-cont");
	console.debug("setupUserDashboard", test1);

	if (!test1) {
		setTimeout(setupUserDashboard, 1000);		
		return;
	}

	const extnId = await getExtensionId();
	if (!extnId) return;
		
	const clickToDial = document.querySelector("#component-813b101e-a29d-4211-b5f6-b4b2bef00f43");			
	clickToDial.style.height = "600px";
	
	const clickToDialHdr = document.querySelector("div#component-813b101e-a29d-4211-b5f6-b4b2bef00f43 div.widg-head");		
	const clickToDialCont = document.querySelector("div#component-813b101e-a29d-4211-b5f6-b4b2bef00f43 div.widg-cont");
	
	console.debug("setupUserDashboard active-call", clickToDial, clickToDialHdr, clickToDialCont, location.hash);		
	
	if (clickToDialHdr) {
		clickToDialHdr.innerHTML = '<span title="CAS Companion - Call History">CAS Companion - Call History</span>';
	}
	
	if (clickToDialCont) {
		clickToDialCont.innerHTML = "<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:530px;' src='chrome-extension://" + extnId + "/call-records.html'></iframe>";
	}	
}

async function setupClientDashboard() {		
	console.debug("setupClientDashboard");
		
	const test1 = document.querySelector("div#component-cd60a0ed-ec3b-4e0c-990d-9f8341fb6e7c div.widg-cont");
	const test2 = document.querySelector("div#component-bcce65cf-d500-4e43-9206-a1ff5f22ee4f div.widg-cont");
	console.debug("setupClientDashboard", test1, test2);

	if (!test1 || !test2) {
		setTimeout(setupClientDashboard, 1000);		
		return;
	}

	const extnId = await getExtensionId();
	if (!extnId) return;
		
	const callList = document.querySelector("#component-bcce65cf-d500-4e43-9206-a1ff5f22ee4f");			
	const callListHdr = document.querySelector("div#component-bcce65cf-d500-4e43-9206-a1ff5f22ee4f div.widg-head");		
	const callListCont = document.querySelector("div#component-bcce65cf-d500-4e43-9206-a1ff5f22ee4f div.widg-cont");
	
	console.debug("setupClientDashboard call-list", callList, callListHdr, callListCont);		
	
	if (callListHdr) {
		callListHdr.innerHTML = '<span title="CAS Companion - Call Lists">CAS Companion - Call Lists</span>';
	}
	
	if (callListCont) {
		callListCont.innerHTML = "<a target='_blank' href='chrome-extension://" + extnId + "/call-list.html'>Activate</a>";
	}

	let data;

	if (location.hash.startsWith("#ey")) {		
		data = atob(location.hash.substring(1));
		localStorage.setItem("cas.companion.data", data);
	} else {
		data = localStorage.getItem("cas.companion.data");
	}

	if (data) {
		const clickToDial = document.querySelector("#component-cd60a0ed-ec3b-4e0c-990d-9f8341fb6e7c");			
		clickToDial.style.height = "850px";
		
		const clickToDialHdr = document.querySelector("div#component-cd60a0ed-ec3b-4e0c-990d-9f8341fb6e7c div.widg-head");		
		const clickToDialCont = document.querySelector("div#component-cd60a0ed-ec3b-4e0c-990d-9f8341fb6e7c div.widg-cont");
		
		console.debug("setupClientDashboard active-call", clickToDial, clickToDialHdr, clickToDialCont, location.hash);		
		
		if (clickToDialHdr) {
			clickToDialHdr.innerHTML = '<span title="CAS Companion - Active Call">CAS Companion - Active Call</span>';
		}
		
		if (clickToDialCont) {
			clickToDialCont.innerHTML = "<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:780px;' src='chrome-extension://" + extnId + "/cas-wealth/index.html'></iframe>";
		}	
	}
}

async function getExtensionId() {
	let response;
	
	try {
		response = await fetch("chrome-extension://ifohdfipnpbkalbeaefgecjkmfckchkd/manifest.json");
		console.debug("getExtensionId demo", response.status);
		if (response.ok) return "ifohdfipnpbkalbeaefgecjkmfckchkd";		
		
	} catch (e) {
		console.debug("getExtensionId demo", e);
	}

	try {	
		response = await fetch("chrome-extension://ahmnkjfekoeoekkbgmpbgcanjiambfhc/manifest.json");
		console.debug("getExtensionId dev", response.status);
		if (response.ok) return "ahmnkjfekoeoekkbgmpbgcanjiambfhc";	
	} catch (e) {
		console.debug("getExtensionId dev", e);
	}
	
	return null;	
}

async function getToken(userId) {
	const extn = await getExtensionId();
	console.debug("getToken", userId, extn);
	
	const prefix = (extn == "ahmnkjfekoeoekkbgmpbgcanjiambfhc") ? "http://localhost:7070" : "https://pade.chat:5443";
	
	try {
		const casUrl = prefix + getRootPath() + "/config/global";			
		const response = await fetch(casUrl, {method: "GET"});
		const config = await response.json();				
		const client = new ACS.CommunicationIdentityClient(config.acs_endpoint);	
		const response2 = await client.getToken(userId, ["chat", "voip"]);	
		console.debug("getToken response", prefix, response2);
		if (response2.token) return response2.token;	
		
	} catch (e) {
		console.error("getToken", e);
	}
	
	return null;	
}

async function getPresence(userId) {
	const extn = await getExtensionId();
	console.debug("getPresence", userId, extn);
	
	const prefix = (extn == "ahmnkjfekoeoekkbgmpbgcanjiambfhc") ? "http://localhost:7070" : "https://pade.chat:5443";
	const authorization = (extn == "ahmnkjfekoeoekkbgmpbgcanjiambfhc") ? "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZWxlIiwiYXVkIjoibG9jYWxob3N0IiwicGVybWlzc2lvbnMiOlsiZnVsbCJdLCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3NDQzIiwiZXhwIjoxNzA0Mjg2MTIzLCJpYXQiOjE3MDQxMTMzMjN9.T9neV9gaqwecitcza5W0rbvMm_Spb1ywxTn3pllw0Ac" : "1234567890";

	/*
	{
	  "activity": "InACall",
	  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users('83ec482c-3bc5-4116-acee-e081cc720630')/presence/$entity",
	  "id": "83ec482c-3bc5-4116-acee-e081cc720630",
	  "availability": "Busy",
	  "statusMessage": null
	}	
	*/
	try {
		const casUrl = prefix + getRootPath() + "/presence/" + userId;			
		const response = await fetch(casUrl, {method: "GET", headers: {authorization}});
		const presence = await response.json();	
		console.debug("getPresence response", presence);		
		return presence;
		
	} catch (e) {
		console.error("getPresence", e);
	}
	
	return null;	
}

async function getWebUrl(meetId) {
	const extn = await getExtensionId();
	console.debug("getWebUrl", meetId, extn);
	
	const prefix = (extn == "ahmnkjfekoeoekkbgmpbgcanjiambfhc") ? "http://localhost:7070" : "https://pade.chat:5443";
	const authorization = (extn == "ahmnkjfekoeoekkbgmpbgcanjiambfhc") ? "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZWxlIiwiYXVkIjoibG9jYWxob3N0IiwicGVybWlzc2lvbnMiOlsiZnVsbCJdLCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3NDQzIiwiZXhwIjoxNzA0Mjg2MTIzLCJpYXQiOjE3MDQxMTMzMjN9.T9neV9gaqwecitcza5W0rbvMm_Spb1ywxTn3pllw0Ac" : "1234567890";

	try {
		const casUrl = prefix + getRootPath() + "/shared/meeting/" + meetId;			
		const response = await fetch(casUrl, {method: "GET", headers: {authorization}});
		const line = await response.json();	
		console.debug("getWebUrl response", line);		
		return line.joinWebUrl;	
		
	} catch (e) {
		console.error("getWebUrl", e);
	}
	
	return null;	
}

function getRootPath() {
	let url =  "/teams/api/openlink";
	
	if (getSetting("cas_paas_enabled")) {
		url =  "/plugins/casapi/v1/companion";
	}
	return url;
}
