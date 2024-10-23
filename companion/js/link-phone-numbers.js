var linking = false;
var linkClass = "cas-teams-link";

window.addEventListener("load", function(event)  {
	console.debug("loaded");	
    linkPhoneNumbers(document.body);	

	const observer = new MutationObserver(list => {
		if (linking) return;
		linking = true;
		linkPhoneNumbers(document.body);
		linking = false;
	});
	observer.observe(document.body, {attributes: true, childList: true, subtree: true});	
});

function handlePhoneNumber(node) {
	let target = node.nodeValue;
	let link = null;
	
	libphonenumber.findPhoneNumbersInText(target, "GB").forEach((item) => {
		console.debug("phone found", item.number?.number, item);				
		phoneText = item.number?.number;
		
		if (phoneText && phoneText != "") {
			var numberObjEvt = libphonenumber.parsePhoneNumber(phoneText, "GB");
			
			var phoneNumber = numberObjEvt.format('E.164');		
			var formattedPhoneNumber = numberObjEvt.format('IDD', {fromCountry: 'GB'})
			
			if (numberObjEvt.isValid()) {
				const oldNumber = target.substring(item.startsAt, item.endsAt);				
				const newNode = document.createElement("div");
				newNode.setAttribute("data-phone", phoneNumber);				
				
				link = document.createElement("a");
				link.setAttribute("data-phone", phoneNumber);														
				link.title = "Call " + phoneNumber + " with CAS Companion";				
				link.classList.add(linkClass);
				link.href = "#";
				link.innerHTML = oldNumber;	
				
				link.addEventListener("click", function(event)  {
					event.stopPropagation();
					event.preventDefault();
					
					const destination = event.target.getAttribute("data-phone");
					console.debug("connecting", destination);
					chrome.runtime.sendMessage('ahmnkjfekoeoekkbgmpbgcanjiambfhc', {action: 'make_call', destination});
					chrome.runtime.sendMessage('ifohdfipnpbkalbeaefgecjkmfckchkd', {action: 'make_call', destination});
				});				

				newNode.appendChild(link);
				console.debug("handlePhoneNumber", oldNumber, newNode.innerHTML);
			
				const parent = node.parentNode;
				parent.removeChild(node);
				parent.appendChild(newNode);
			}
		}
	});	
}


function linkPhoneNumbers(node) {
	//console.debug("linkPhoneNumbers", node);
	
	if (node.classList?.contains(linkClass)) {
		return;
	}	
	
    for (var i = 0; i < node.childNodes.length; ++i) {
        var child = node.childNodes[i];
		
        if (child.nodeName == "SCRIPT" || child.nodeName == "NOSCRIPT"
                || child.nodeName == "OBJECT" || child.nodeName == "EMBED"
                || child.nodeName == "APPLET" || child.nodeName == "IFRAME") {
            continue;
        }

        if (child.childNodes.length > 0) {
            linkPhoneNumbers(child);
			
        } else if (child.nodeType == 3) {
			
			if (child.classList?.contains(linkClass)) {
				continue;
			}
			
			handlePhoneNumber(child);			
        }
    }
}
