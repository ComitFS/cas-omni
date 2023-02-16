let loginModal, customerData;
	
var cas_omni_api = (function(api)
{
	const nickColors = {};
	
    window.addEventListener("unload", () =>
    {
        console.debug("cas_omni_api addListener unload");
    });

    window.addEventListener("load", () =>  {
		console.debug("window.load", window.location.hostname, window.location.origin);

		loadCSS('./css/tingle.min.css');	
		
		const username = sessionStorage.getItem("cas.omni.user");
		const password = sessionStorage.getItem("cas.omni.password");	

		if (!username || !password) {
			WebAuthnGoJS.CreateContext(JSON.stringify({RPDisplayName: "CAS Omni", RPID: window.location.hostname, RPOrigin: window.location.origin}), (err, val) => {
				if (err) {
					//location.href = "/";
				}
				navigator.credentials.get({password: true}).then(function(credential) {
					console.debug("window.load credential", credential);	
					
					if (credential) {
						loginUser(credential.id, credential.password);
					} else {
						registerUser();							
					}
				}).catch(function(err){
					console.error("window.load credential error", err);	
					registerUser();					
				});	
			});		
		} else {
			handleCredentials(username, password);
		}
    });

	window.addEventListener('hashchange', () => {
		processHashLocation();  
	});
	
	function processHashLocation() {
	  console.debug('processHashLocation', location.hash)
	  
	  if (location.hash.startsWith("#order-")) {
		  handleOrder(location.hash.substring(7));
	  }
	  else
		  
	  if (location.hash.startsWith("#user-")) {
		  handleUser(location.hash.substring(6));
	  }			
	}

	function setCredentials(username, password) {
		sessionStorage.setItem("cas.omni.user", username);
		sessionStorage.setItem("cas.omni.password", password);			
		location.reload();
	}

	function handleUser(userNo) {
		const orderNo = location.hash.substring(7);
		let userData;
		
		for (group of customerData.property.groups) 
		{							
			for (item of group.members) 
			{
				if (item.username == userNo) {
					userData = item;
					break;
				}
			}
			if (userData) break;
		}			
		
		if (userData) {
			const headerLine = document.querySelector("#header-line");
			headerLine.innerHTML = "User - " + userNo;
			
			const contentDiv = document.querySelector(".content .container-fluid .row");	
			contentDiv.innerHTML = "";
			
			console.debug('handleUser', userNo)	

			newElement(contentDiv, "div", null, "container-fluid", `
			  <div class="row g-4">
				<!-- Start column -->
				<div class="col-md-6">
				  <!-- general form elements -->
				  <input id="userToken" type="hidden" value="${userData['ms_teams_access_token']}" />
				  <input id="userName" type="hidden" value="${userNo}" />				  
				  <div class="card card-primary card-outline">
					<div class="card-header">
					  <div class="card-title">User Profile</div>
					</div>
					  <div class="card-body">
						<div class="mb-3">
						  <label for="inputName" class="form-label">Full Name</label>
						  <input type="text" class="form-control" id="inputName" value="${userData.name}">
						  <div id="nameHelp" class="form-text">This information is stored encrypted</div>					  
						</div>				  
						<div class="mb-3">
						  <label for="inputEmail" class="form-label">Email address</label>
						  <input type="email" class="form-control" id="inputEmail" aria-describedby="emailHelp" value="${userData.email}">
						  <div id="emailHelp" class="form-text">This information is stored encrypted.</div>
						</div>
					  </div>
					  <div class="card-footer">
						<button onclick="cas_omni_api.updateUser()" class="btn btn-primary">Update Profile</button>
						<button onclick="cas_omni_api.dispatchToUser()" class="btn btn-secondary">Dispatch To User</button>					
					  </div>
				  </div>
				</div>
			  </div>
			`)	
		}			
	}
	
	function handleOrder(orderNo) {		
		const contentDiv = document.querySelector(".content .container-fluid .row");	
		contentDiv.innerHTML = "";
		
		console.debug('handleOrder', orderNo)		
		
		for (group of customerData.property.groups) 
		{
			if (orderNo == group["cas-serve.order.number"]) {			
				console.debug('handleOrder - order', group, contentDiv);

				const headerLine = document.querySelector("#header-line");
				headerLine.innerHTML = "Order - #" + orderNo + " for " +  group.members.length + " users";				
				
				for (item of group.members) {
			
					newElement(contentDiv, "div", null, "col-lg-3 col-6", `
					  <div class="small-box text-bg-primary">
						<div class="inner">
						  <h5>${item.username}</h5>
						  <p>${item.profile.interests.length} CAS Interests</p>
						  <p>${item.name}</p>						  
						</div>
						<div class="icon">
						  <i class="inner-icon ion ion-bag"></i>
						</div>
						<a href="#user-${item.username}" class="small-box-footer">More info <i class="fa-solid fa-arrow-circle-right"></i>
						</a>
					  </div>		
					`)	
				}
				break;
			}

		}			
	}
	
	async function handleCredentials(username, password) {
		const authorization = urlParam("t");		
		const host = urlParam("s");

		if (authorization && host) {
			let url = location.protocol + "//" + host + "/teams/api/openlink/config/global";	
			
			let response = await fetch(url, {method: "GET"});
			const config = await response.json();			
			console.info("handleCredentials config", config);
				
			url = location.protocol + "//" + host + "/teams/api/openlink/config/properties";	
			response = await fetch(url, {method: "GET", headers: {authorization}});
			const property = await response.json();	
			console.debug("User properties", property);			

			customerData = {username, password, action: 'config', config, property};
			console.debug("handleCredentials", customerData);			
			setupUI();		
		}			
	}

    function loadJS(name) {
		console.debug("loadJS", name);
        var s1 = document.createElement('script');
        s1.src = name;
        s1.async = false;
        document.body.appendChild(s1);
    }

    function loadCSS(name) {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = name;
        head.appendChild(link);
    }

	function bufferDecode(value) {
	  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
	}

	function bufferEncode(value) {
	  return btoa(String.fromCharCode.apply(null, new Uint8Array(value)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");;
	}

	function loginUser(username, userStr) {
		const user = JSON.parse(userStr);
		console.debug("loginUser", user);		
		
		const loginCredRequest = (credentialRequestOptions) => {
			credentialRequestOptions.publicKey.challenge = bufferDecode(credentialRequestOptions.publicKey.challenge);
			credentialRequestOptions.publicKey.allowCredentials.forEach(function (listItem) {
			  listItem.id = bufferDecode(listItem.id)
			});

			return navigator.credentials.get({
			  publicKey: credentialRequestOptions.publicKey
			})
		}

		WebAuthnGoJS.BeginLogin(userStr, (err, data) => {
			if (err) {
				console.error("Login failed", err);				
				//location.href = "/";
			}

			data = JSON.parse(data);
			user.authenticationSessionData = data.authenticationSessionData;

			loginCredRequest(data.credentialRequestOptions).then((assertion) => {
				let authData = assertion.response.authenticatorData;
				let clientDataJSON = assertion.response.clientDataJSON;
				let rawId = assertion.rawId;
				let sig = assertion.response.signature;
				let userHandle = assertion.response.userHandle;

				const finishLoginObj = {
					id: assertion.id,
					rawId: bufferEncode(rawId),
					type: assertion.type,
					response: {
						authenticatorData: bufferEncode(authData),
						clientDataJSON: bufferEncode(clientDataJSON),
						signature: bufferEncode(sig),
						userHandle: bufferEncode(userHandle)
					}
				}

				const loginBodyStr = JSON.stringify(finishLoginObj);
				const authSessDataStr = JSON.stringify(user.authenticationSessionData)

				WebAuthnGoJS.FinishLogin(userStr, authSessDataStr, loginBodyStr, (err, result) => {
					console.debug("Login result", username, err, result);
					
					if (err) {
						//location.href = "/";
					}						
					setCredentials(username, userStr);
				});
			}).catch((err) => {
				console.error("Login failed", err);
				//location.href = "/";				
			});
	  });
	}	

	function urlParam(name)	{
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (!results) { return undefined; }
		return unescape(results[1] || undefined);
	}

	function registerUser() {
		const username = urlParam("i")
		const token = urlParam("t");
		
		if (!username || !token) {
			getCredentials(createUserCredentials);
		} else {
			createUserCredentials(username, token);
		}
	}	
	
	function createUserCredentials(username, token) 
	{
		if (!username || username.trim() === "" || !token || token.trim() === "") {
			//location.href = "/";
		}
		
		const displayName = username;
		username = username.toLocaleLowerCase().replaceAll(" ", "");		

		const createPromiseFunc = (credentialCreationOptions) => 
		{
			credentialCreationOptions.publicKey.challenge = bufferDecode(credentialCreationOptions.publicKey.challenge);
			credentialCreationOptions.publicKey.user.id = bufferDecode(credentialCreationOptions.publicKey.user.id);
			
			if (credentialCreationOptions.publicKey.excludeCredentials) 
			{
			  for (var i = 0; i < credentialCreationOptions.publicKey.excludeCredentials.length; i++) {
				credentialCreationOptions.publicKey.excludeCredentials[i].id = bufferDecode(credentialCreationOptions.publicKey.excludeCredentials[i].id);
			  }
			}

			return navigator.credentials.create({
			  publicKey: credentialCreationOptions.publicKey
			})
		}

		const user = {
			id: Math.floor(Math.random() * 1000000000),
			name: username,
			displayName: displayName,
			credentials: [],
		};
  
		const userStr = JSON.stringify(user);

		WebAuthnGoJS.BeginRegistration(userStr, (err, data) => 
		{
			if (err) {
				console.error("Registration failed", err);				
				//location.href = "/";
			}
			
			data = JSON.parse(data);
			user.registrationSessionData = data.registrationSessionData;

			createPromiseFunc(data.credentialCreationOptions).then((credential) => {
				let attestationObject = credential.response.attestationObject;
				let clientDataJSON = credential.response.clientDataJSON;
				let rawId = credential.rawId;

				const registrationBody = {
					id: credential.id,
					rawId: bufferEncode(rawId),
					type: credential.type,
					response: {
					  attestationObject: bufferEncode(attestationObject),
					  clientDataJSON: bufferEncode(clientDataJSON),
					},
				};

				// Stringify
				const regBodyStr = JSON.stringify(registrationBody);
				const sessDataStr = JSON.stringify(user.registrationSessionData)

				WebAuthnGoJS.FinishRegistration(userStr, sessDataStr, regBodyStr, (err, result) => 
				{
					if (err) {
						console.error("Registration failed", err);				
						//location.href = "/";
					}
					
					const credential = JSON.parse(result);
					credential.github_token = token;
					user.credentials.push(credential);						
					registerCredential(username, JSON.stringify(user));

				});
				
			}).catch((err) => {
				console.error("Registration failed", err);
				//location.href = "/";				
			});
		})
	}
	
	async function hashCode(target){
	   var buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(target));
	   var chars = Array.prototype.map.call(new Uint8Array(buffer), ch => String.fromCharCode(ch)).join('');
	   return btoa(chars);
	}
	
	function registerCredential(id, pass) {
		navigator.credentials.create({password: {id: id, password: pass}}).then(function(credential)
		{
			console.debug("registerCredential", credential);
		
			if (credential) {
				navigator.credentials.store(credential).then(function()
				{
					console.debug("registerCredential - storeCredentials stored");				
					setCredentials(id, pass);				

				}).catch(function (err) {
					console.error("registerCredential - storeCredentials error", err);
				});
			}

		}).catch(function (err) {
			console.error("registerCredential - storeCredentials error", err);		
		});			
	}	

    //-------------------------------------------------------
    //
    //  UI
    //
    //-------------------------------------------------------	
	
    function getCredentials(callback) {
        const template = 
`			<div class="modal-header">
				<h4 class="modal-title">CAS Omni - Login</h4>
			</div>
			<div class="modal-body">
				<form id="login_user" class="form-inline">
					<div class="form-group">
						<label for="user_name">Name</label>
						<input id="user_name" class="form-control" type="text"/>
					</div>
					<div class="form-group">
						<label for="user_password">Access Code</label>
						<input id="user_password" class="form-control" type="text"/>
					</div>
				</form>
			</div>
		`;

        if (!loginModal) {
            loginModal = new tingle.modal({
                footer: true,
                stickyFooter: false,
                closeMethods: ['overlay', 'button', 'escape'],
                closeLabel: 'Login',

                beforeOpen: function () {
                    console.debug("beforeOpen");
                }
            });

            loginModal.setContent(template);

            loginModal.addFooterBtn("Login", 'tingle-btn tingle-btn-primary', () => {
				const username = document.querySelector('#user_name').value;
				const password = document.querySelector('#user_password').value;

                console.debug("Login", username);	
				callback(username, password);
                loginModal.close();				
            });

            loginModal.addFooterBtn("Close", 'tingle-btn tingle-btn-secondary', () => {
                loginModal.close();
            });
        }

        loginModal.open();
    }	

	function newElement(parent, el, id, classNames, html) {
		const ele = document.createElement(el);
		if (id) ele.id = id;
		if (html) ele.innerHTML = html;

		if (classNames)	{
			for (className of classNames.split(" ")) {
				ele.classList.add(className);
			}
		}
		parent.appendChild(ele);
		return ele;
	}
	
	function setupUI() {
		const userName = document.querySelector("#user-name");
		userName.innerHTML = customerData.property.name;
		
		const userAvatar = document.querySelector("#user-avatar");
		userAvatar.src = createAvatar(customerData.property.name);
		
		const orderMenu = document.querySelector("aside.main-sidebar div.sidebar ul.nav-sidebar ul.nav.nav-treeview");		
		console.debug("setupUI", orderMenu);
		
		for (group of customerData.property.groups) {
			const orderName = group["cas-serve.order.number"];
			console.debug("setupUI menu", orderName);
		
			newElement(orderMenu, "li", null, "nav-item", `
                  <a href="#order-${orderName}" class="nav-link active">
                    <i class="nav-icon fa-regular fa-circle"></i>
                    <p>${orderName}</p>
                  </a>			
			`)
		}
		
		processHashLocation();  				
	}
	
	function createAvatar(nickname, width, height, font) {
		console.debug("createAvatar", nickname);	

		if (!nickname) nickname = "Unknown";
		nickname = nickname.toLowerCase();

		if (!width) width = 128;
		if (!height) height = 128;
		if (!font) font = "64px Arial";

		var canvas = document.createElement('canvas');
		canvas.style.display = 'none';
		canvas.width = width;
		canvas.height = height;
		document.body.appendChild(canvas);
		var context = canvas.getContext('2d');
		context.fillStyle = getRandomColor(nickname);
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.font = font;
		context.fillStyle = "#fff";
		context.textAlign = "center";		

		var first, last, pos = nickname.indexOf("@");
		if (pos > 0) nickname = nickname.substring(0, pos);

		// try to split nickname into words at different symbols with preference
		let words = nickname.split(/[, ]/); // "John W. Doe" -> "John "W." "Doe"  or  "Doe,John W." -> "Doe" "John" "W."
		if (words.length == 1) words = nickname.split("."); // "John.Doe" -> "John" "Doe"  or  "John.W.Doe" -> "John" "W" "Doe"
		if (words.length == 1) words = nickname.split("-"); // "John-Doe" -> "John" "Doe"  or  "John-W-Doe" -> "John" "W" "Doe"

		if (words && words[0] && words.first != '') {
			const firstInitial = words[0][0]; // first letter of first word
			var lastInitial = null; // first letter of last word, if any

			const lastWordIdx = words.length - 1; // index of last word
			
			if (lastWordIdx > 0 && words[lastWordIdx] && words[lastWordIdx] != '') {
				lastInitial = words[lastWordIdx][0]; // first letter of last word
			}

			// if nickname consist of more than one words, compose the initials as two letter
			var initials = firstInitial;
			
			if (lastInitial) {
				// if any comma is in the nickname, treat it to have the lastname in front, i.e. compose reversed
				initials = nickname.indexOf(",") == -1 ? firstInitial + lastInitial : lastInitial + firstInitial;
			}

			const metrics = context.measureText(initials.toUpperCase());
			context.fillText(initials.toUpperCase(), width / 2, (height - metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2 + metrics.actualBoundingBoxAscent);

			var data = canvas.toDataURL();
			document.body.removeChild(canvas);
		}

		return canvas.toDataURL();
	}	
	
	function getRandomColor(nickname) {
		if (nickColors[nickname])
		{
			return nickColors[nickname];
		}
		else {
			var letters = '0123456789ABCDEF';
			var color = '#';

			for (var i = 0; i < 6; i++) {
				color += letters[Math.floor(Math.random() * 16)];
			}
			nickColors[nickname] = color;
			return color;
		}
	}		

    //-------------------------------------------------------
    //
    //  External
    //
    //-------------------------------------------------------


	api.updateUser = async () => {
		const inputEmail = document.querySelector("#inputEmail").value;
		const inputName = document.querySelector("#inputName").value;
		const authorization = document.querySelector("#userToken").value;		
		const host = urlParam("s");
		console.debug('updateUser', inputEmail, inputName, authorization, host);
		
		if (authorization && host && userToken && inputEmail && inputName) {
			const url = location.protocol + "//" + host + "/teams/api/openlink/config/properties";	
			const body = JSON.stringify([
				{name: "name", value: inputName},
				{name: "email", value: inputEmail}				
			]);			
			const response = await fetch(url, {method: "POST", headers: {authorization}, body});
			console.debug("updateUser - response", response);
			location.reload();
		} else {
			alert("Bad data");
		}			
	}
	
	api.dispatchToUser = async () => {
		const inputEmail = document.querySelector("#inputEmail").value;		
		const userName = document.querySelector("#userName").value;	
		const authorization = document.querySelector("#userToken").value;		
		const host = urlParam("s");
		console.debug('dispatchToUser', userName, authorization, host);	

		if (authorization && host && userToken && inputEmail && inputName) {
			const url = location.protocol + "//" + host + "/teams/api/openlink/omni/sendmail";			
			const response = await fetch(url, {method: "POST", headers: {authorization}});
			console.debug("dispatchToUser - response", response);
			alert("Email sent to " + inputEmail);
		} else {
			alert("Bad data");
		}		
	}	
		
    return api;

}(cas_omni_api || {}));