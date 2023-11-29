let loginModal, configData;
	
var cas_omni_api = (function(api)
{
    window.addEventListener("unload", function()
    {
        console.debug("cas_omni_api addListener unload");
    });

    window.addEventListener("load", function()  {
		console.debug("window.load", window.location.hostname, window.location.origin);

		loadCSS('./tingle.min.css');	
		
		const username = sessionStorage.getItem("cas.omni.user");
		const password = sessionStorage.getItem("cas.omni.password");	

		if (!username || !password) {
			navigator.credentials.get({password: true}).then(function(credential) {
				console.debug("window.load credential", credential);	
				
				if (credential) {
					setCredentials(credential.id, credential.password);
				} else {
					registerUser();							
				}
			}).catch(function(err){
				console.error("window.load credential error", err);	
				registerUser();					
			});	
	
		} else {
			handleCredentials(username, password);
		}
    });

	function setCredentials(username, password) {
		sessionStorage.setItem("cas.omni.user", username);
		sessionStorage.setItem("cas.omni.password", password);			
		location.reload();
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
			console.log("User properties", property);		

			const payload = {action: 'config', config, property};
			configData = JSON.stringify(payload);

			console.debug("handleCredentials", username, password, configData);		
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

	function urlParam(name)	{
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (!results) { return undefined; }
		return unescape(results[1] || undefined);
	}

	function registerUser() {
		const username = urlParam("i")
		const token = urlParam("t");
		
		if (!username || !token) {
			getCredentials(registerCredential);
		} else {
			registerCredential(username, token);
		}
	}	
	
	function registerCredential(id, pass) {
		navigator.credentials.create({password: {id: id, password: pass}}).then(function(credential)
		{
			console.debug("registerCredential", credential);
		
			if (credential) {
				navigator.credentials.store(credential).then(function()
				{
					console.log("registerCredential - storeCredentials stored");				
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

    //-------------------------------------------------------
    //
    //  External
    //
    //-------------------------------------------------------
	
	api.configure = function() {
		if (configData) {
			chrome.runtime.sendMessage('ifohdfipnpbkalbeaefgecjkmfckchkd', configData);		// dev	
			chrome.runtime.sendMessage('ahmnkjfekoeoekkbgmpbgcanjiambfhc', configData);		// prod
		} else {
			alert("You are not authorizsed to do this");
		}		
	}

    return api;

}(cas_omni_api || {}));