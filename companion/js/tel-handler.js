
window.addEventListener("unload", function()
{

});

window.addEventListener("load", function()
{
	const url = urlParam("url");

	if (url && (url.indexOf("tel:") == 0 || url.indexOf("web+cas:") == 0))
	{
		let destination = url.substring(4);
		if (url.indexOf("web+cas:") == 0) destination = url.substring(8); 
		
		destination = destination.replace(" ", "");			
		console.debug("Extracted...", destination);
		
		try {
			const numberObjEvt = libphonenumber.parsePhoneNumber(destination, "GB");	
				
			if (numberObjEvt.isValid()) {
				destination = numberObjEvt.format('E.164');					
				console.debug("Calling...", destination);		
				
				chrome.runtime.sendMessage({action: "make_call", destination});
			} else {
				alert("Link is not a valid telephone number");
			}
		} catch (e) {
			alert("Link is not a valid telephone number");			
		}			
	}	
});
	
function urlParam(name)
{
	const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (!results) { return undefined; }
	return unescape(results[1] || undefined);
};
