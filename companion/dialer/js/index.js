let dialerContainer = null;
const buttons = {};

let config = {
	max_keys: 	32
};

window.addEventListener("unload", function () {

});

window.addEventListener("load", function() {

	chrome.storage.local.get('profile', (data) =>  {
		console.debug("load profile", data.profile);
		let i = 0;
		let kt = 0;
		dialerContainer = document.getElementById('dialer');

		while (kt < config.max_keys) {
			console.debug("load profile item", i, kt);			
			
			const label = getSetting("cas_touch_label_" + i);
			const type = getSetting("cas_touch_type_" + i);
			const value = getSetting("cas_touch_name_" + i);	
			const photo = getSetting("cas_touch_avatar_" + i);				
			const url = getSetting("cas_touch_joinurl_" + i);					

			if (label && label.trim() != "" && type != "none") {
				setupCASPanel(i++, {label, type, value, photo, url}, false);				
			}
			kt++;			
		}				
	});	
});

// -------------------------------------------------------
//
//  UI Functions
//
// -------------------------------------------------------

function handleButtonPress(key) {
	console.debug("handleButtonPress", key);
	chrome.runtime.sendMessage({action: "button_pressed",  point: key, longPress: false});			
}

// -------------------------------------------------------
//
//  Chrome Event Handlers
//
// -------------------------------------------------------	

chrome.runtime.onMessage.addListener(async (msg) => {	
	const button = buttons[msg.point];
	
	if (button) {
		switch (msg.action) {
			
			case "notify_cas_dialer_connected":	
				console.debug("notify_cas_dialer_connected", msg, button);
				handleCallState("Connected", msg, button);	
				break;
				
			case "notify_cas_dialer_disconnected":	
				console.debug("notify_cas_dialer_disconnected", msg.id, msg.point, button);
				handleCallState("Disconnected", msg, button);				
				break;
				
			case "notify_cas_dialer_incoming":	
				console.debug("notify_cas_dialer_held", msg.id, msg.point, button);
				handleCallState("None", msg, button);					
				break;
				
			case "notify_cas_dialer_held":	
				console.debug("notify_cas_dialer_held", msg.id, msg.point, button);
				handleCallState("LocalHold", msg, button);					
				break;
		}
	}
})

// -------------------------------------------------------
//
//  Call Control Functions
//
// -------------------------------------------------------	

function makeCall(destination) {
	console.debug("makeCall", destination);
	chrome.runtime.sendMessage({action: "make_call", destination});	
}

function handleCallState(state, msg, button) {
	console.debug("handleCallState", state, msg, button);
		
	if (button.panel) {	
		button.call = {id: msg.id, direction: msg.direction, state};	
		button.panel.state = state;		
				
		if (state == "Connected") {	
			button.panel.updateClock();			
		}
		else
						
		if ((state == "Disconnected" || state == "Missed")) {					
			button.call = null;
			delete button.call;
		}		
	}		
}

function hangupCall(id) {
	chrome.runtime.sendMessage({action: "hangup_call", id});
}

function holdCall(id) {
	chrome.runtime.sendMessage({action: "hold_call", id});
}

function resumeCall(id) {
	chrome.runtime.sendMessage({action: "resume_call", id});
}

function acceptCall(id) {
	chrome.runtime.sendMessage({action: "accept_call", id});
}

// -------------------------------------------------------
//
//  Utilitiy Functions
//
// -------------------------------------------------------	

	
function getDestination(address) {
	console.debug("getDestination", address);
	if (!address) return null;
	
	let destination = null;

	if (address.startsWith("+"))  {		
		destination = {phoneNumber: address.replaceAll(" ", "")};		
	}
	else 
	
	if (address.startsWith("8:acs"))  {		
		destination = {communicationUserId: address};		
	} 	
	else {
		destination = { microsoftTeamsUserId: address} ;
	}
	return destination;
}

function isNull(val) {
	return !val || val == "" || val == "undefined" || val == "null";
}

function getNickColor(reset = false) {
	if (!reset && localStorage.getItem('cas-dialer.settings.nickColor')) {
		return localStorage.getItem('cas-dialer.settings.nickColor');
	} else {
		let hsl = tinycolor(tinycolor.random()).toHsl();
		hsl.l = hsl.l * 0.5 + 0.2;

		let color = tinycolor(hsl).toHexString();

		localStorage.setItem('cas-dialer.settings.nickColor', color);
		return color;
	}
}
	
function createAvatar(nickname, width, height, font) {
	console.debug('createAvatar', nickname, width, height, font);

	if (!width) width = 128;
	if (!height) height = 128;
	if (!font) font = 'Arial';
	
	let color = getNickColor(true);	

	const $svg = $('<svg />');
	$svg.attr({
		'xmlns': 'http://www.w3.org/2000/svg',
		'version': '1.1',
		'width': width,
		'height': height
	});
	$svg.css('background-color', color);

	if (nickname) {
		let initials = getInitials(nickname);

		$text = $('<text />');
		$text.attr({
			'x': width / 2,
			'y': height / 2
		});
		$text.css({
			'fill': '#fff',
			'fill-opacity': 0.6,
			'font-family': font,
			'font-size': width * Math.pow(0.7, initials.length),
			'font-weight': 400,
			'text-anchor': 'middle',
			'dominant-baseline': 'central'
		});
		$text.text(initials);
		$svg.append($text);
	}

	let dataUrl = null;
	try {
		dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent($svg.prop('outerHTML'))));
	} catch (error) {
		console.error(error);

		// dummy image
		dataUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
	}

	return dataUrl;
}
	
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

function setupCASPanel(i, button, soft) {
	console.debug("setupCASPanel", button.label, button.photo);
	
	button.value = button.value.replaceAll(" ", "");
	button.background = "grey";
	button.keyValue = i;
	buttons[i] = button;

	let panel = dialerContainer.querySelector('#cas-panel-' + button.keyValue);
	
	if (!panel) {
		panel = document.createElement("cas-call");
		panel.button = button;
		button.panel = panel;
		
		panel.id = "cas-panel-" + button.keyValue;	
		panel.soft = soft;	
		panel.initials = getInitials(button.label);		
		panel.name = button.label;
		panel.photo = !isNull(button.photo) ? button.photo : createAvatar(button.label, 48, 48);
		panel.direction = 'outgoing';	
		panel.number = button.value;
		
		if (soft) {
			dialerContainer.append(panel);			
		} else {
			dialerContainer.prepend(panel);
		}
	}	
}