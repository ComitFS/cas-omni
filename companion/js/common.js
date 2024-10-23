// -------------------------------------------------------
//
//  Functions
//
// -------------------------------------------------------


function loadJS(name) {
	console.debug("loadJS", name);
	var head  = document.getElementsByTagName('head')[0];
	var s1 = document.createElement('script');
	s1.src = name;
	s1.async = false;
	head.appendChild(s1);
}
	
function setSetting(name, value) {
    console.debug("setSetting", name, value);
    window.localStorage["configuration." + name] = JSON.stringify(value);
}

function setDefaultSetting(name, defaultValue) {
    console.debug("setDefaultSetting", name, defaultValue, window.localStorage["configuration." + name]);

    if (!window.localStorage["configuration." + name] && window.localStorage["configuration." + name] != false)
    {
        if (defaultValue) window.localStorage["configuration." + name] = JSON.stringify(defaultValue);
    }
}

function getSetting(name, defaultValue) {
     var value = defaultValue ? defaultValue : null;

    if (window.localStorage["configuration." + name] && window.localStorage["configuration." + name] != "undefined") {
        value = JSON.parse(window.localStorage["configuration." + name]);
    }
    return value;
}

function removeSetting(name) {
    localStorage.removeItem(name);
}