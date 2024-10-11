import { registerMgtComponents, Providers, SimpleProvider, ProviderState } from './mgt.js';
						
window.addEventListener("load", function() {
	registerMgtComponents();
	Providers.globalProvider = new SimpleProvider(getAccessToken, login, logout);	
	Providers.globalProvider.login();
});

window.addEventListener("unload", function() {
	
});

chrome.runtime.onMessage.addListener(async (msg) => {	
	console.debug("chrome.runtime.onMessage", msg);	
})

function dialPhoneNumber(destination) {
	console.debug("input", destination); 
	chrome.runtime.sendMessage({action: "make_call", destination});		
}


async function getAccessToken(scopes) {
	console.debug("getAccessToken scope", scopes);	
	const url = getSetting("cas_server_url") + getRootPath() + "/msal/token/graph/" + getScopes(scopes);				
	const resp = await fetch(url, {method: "GET", headers: {authorization: getSetting("cas_server_token")}});	
	const json = await resp.json();
	console.debug("getAccessToken token", json);	
	return Promise.resolve(json.access_token);
}

async function login() {
	console.debug("login");	
	Providers.globalProvider.setState(ProviderState.SignedIn);
	
	makeDataGrid();		
}

function logout() {
	console.debug("logout");		
	Providers.globalProvider.setState(ProviderState.SignedOut)
}

function getScopes(scopes) {
	return "User.Read, User.ReadWrite, User.Read.All, People.Read, User.ReadBasic.All, presence.read.all, Mail.ReadBasic, Tasks.Read, Group.Read.All, Tasks.ReadWrite, Group.ReadWrite.All";
}

function setupTimeAgo() {
	//console.debug("timeago render");
	timeago.cancel();
	const locale = navigator.language.replace('-', '_');
	
	const elements = document.querySelectorAll('.call-records__time');
	
	for (let i=0; i < elements.length; i++)
	{
		if (!elements[i].querySelector('.call-records__time_span')) {
			const timestamp = elements[i].getAttribute('timestamp');	
			const pretty_time = elements[i].innerHTML;				
			const timeAgo = timeago.format(new Date(pretty_time));
			elements[i].innerHTML = '<span class="call-records__time_span" title="' + pretty_time + '" datetime="' + timestamp + '">' + timeAgo + '</span>';
		}
	}
	
	timeago.render(document.querySelectorAll('.call-records__time_span'), locale);
}

async function makeDataGrid() {
	let dataGrid = `<fluent-data-grid id="defaultGrid" style="overflow-y: auto;" role="grid" tabindex="0" generate-header="default">`;
	dataGrid += rowHeader();
	const resp = await fetch(getSetting("cas_server_url") + getRootPath() + "/callhistory", {method: "GET", headers: {authorization: getSetting("cas_server_token")}});		
	const calls = await resp.json();	
	
	for (let call of calls) {
		dataGrid += newDataRow(call);
	}
	dataGrid += '</fluent-data-grid>';
	
	const div = document.getElementById('call-records');
	div.innerHTML = dataGrid;
	
	for (let call of calls) {
		const callDiv = document.getElementById(call.id);
		
		if (callDiv) callDiv.addEventListener("click", function(evt) {
			dialPhoneNumber(evt.target.getAttribute("data-callId"));
		});
	}
 }

function rowHeader(){
	return  `
      <fluent-data-grid-row role="row" class="header" row-type="header" grid-template-columns="1fr 1fr 1fr 1fr" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
		<fluent-data-grid-cell cell-type="columnheader" grid-column="1" tabindex="-1" role="columnheader" class="column-header" style="grid-column: 1;">
		  <svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 	 width="16px" height="16px" viewBox="0 0 414.937 414.937" 	 xml:space="preserve"> <g> 	<path d="M159.138,256.452c37.217,36.944,80.295,72.236,97.207,55.195c24.215-24.392,39.12-45.614,92.854-2.761 		c53.734,42.874,12.696,71.727-10.757,95.363c-27.064,27.269-128.432,1.911-228.909-97.804C9.062,206.71-17.07,105.54,10.014,78.258 		c23.46-23.637,52.006-64.879,95.254-11.458c43.269,53.394,22.161,68.462-2.054,92.861 		C86.31,176.695,121.915,219.501,159.138,256.452z M213.104,80.203c0,0-11.227-1.754-19.088,6.113 		c-8.092,8.092-8.445,22.032,0.082,30.552c5.039,5.039,12.145,6.113,12.145,6.113c13.852,2.598,34.728,6.997,56.944,29.206 		c22.209,22.208,26.608,43.084,29.206,56.943c0,0,1.074,7.106,6.113,12.145c8.521,8.521,22.46,8.174,30.552,0.082 		c7.861-7.86,6.113-19.087,6.113-19.087c-4.399-28.057-17.999-57.365-41.351-80.716C270.462,98.203,241.153,84.609,213.104,80.203z 		 M318.415,96.958c40.719,40.719,58.079,86.932,52.428,124.379c0,0-1.972,11.859,5.773,19.604 		c8.718,8.718,22.535,8.215,30.695,0.062c5.243-5.243,6.385-13.777,6.385-13.777c4.672-32.361-1.203-97.464-64.647-160.901 		C285.605,2.887,220.509-2.988,188.147,1.677c0,0-8.527,1.136-13.777,6.385c-8.16,8.16-8.656,21.978,0.061,30.695 		c7.746,7.746,19.604,5.773,19.604,5.773C231.484,38.879,277.696,56.24,318.415,96.958z"/> </g> </svg>
		  Client
		</fluent-data-grid-cell>

		<fluent-data-grid-cell cell-type="columnheader" grid-column="2" tabindex="-1" role="columnheader" class="column-header" style="grid-column: 2;">
		  Dir
		</fluent-data-grid-cell>

		<fluent-data-grid-cell cell-type="columnheader" grid-column="3" tabindex="-1" role="columnheader" class="column-header" style="grid-column: 3;">
		  Time
		</fluent-data-grid-cell>

		<fluent-data-grid-cell cell-type="columnheader" grid-column="4" tabindex="-1" role="columnheader" class="column-header" style="grid-column: 4;">
		  Duration (Secs)
		</fluent-data-grid-cell>	
      </fluent-data-grid-row>		
	`;
}
	

function newDataRow(call){
	console.debug("newDataRow", call);
	
	let clientName = call.calledName;
	let clientId =  call.calledNumber;
	
	if (call.direction == "Incoming") {
		clientName = call.callerName;
		clientId =  call.callerNumber;
	}
	
	if (!clientName || clientName.trim().length == 0) return "";
	
	return  `
	  <fluent-data-grid-row role="row" row-type="default" grid-template-columns="1fr 1fr 1fr 1fr" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
		<fluent-data-grid-cell grid-column="1" tabindex="-1" role="gridcell" cell-type="default" style="grid-column: 1;">
		  <a href="#" data-callId="${clientId}" id="${call.id}" title="Call ${clientId} with CAS Companion">${clientName}</a>
		</fluent-data-grid-cell>

		<fluent-data-grid-cell grid-column="2" tabindex="-1" role="gridcell" cell-type="default" style="grid-column: 2;">
		  ${call.direction}
		</fluent-data-grid-cell>

		<fluent-data-grid-cell grid-column="3" tabindex="-1" role="gridcell" cell-type="default" style="grid-column: 3;">
		  <span title="${call.start}">${timeago.format(new Date(call.start))}</span>
		</fluent-data-grid-cell>

		<fluent-data-grid-cell grid-column="4" tabindex="-1" role="gridcell" cell-type="default" style="grid-column: 4;">
		  ${call.duration}
		</fluent-data-grid-cell>
	  </fluent-data-grid-row>
	`;
}

function getRootPath() {
	let url =  "/teams/api/openlink";
	
	if (getSetting("cas_paas_enabled")) {
		url =  "/plugins/casapi/v1/companion";
	}
	return url;
}
