initiate();
handleDevices();
loadJS("settings.js");		

// -------------------------------------------------------
//
//  Functions
//
// -------------------------------------------------------

function initiate() {
	this.manifest = {
		"name": "CAS Companion | 0.0.1",
		"icon": "./comitfs-32.png",
		"settings": [	
			{
				"tab": i18n.get("Configuration"),
				"group": i18n.get("Setup"),
				"name": "cas_server_url",
				"type": "text",
				"label": i18n.get("CAS Server Url"),
				"text": "http://localhost:7070"
			},	
			{
				"tab": i18n.get("Configuration"),
				"group": i18n.get("Setup"),
				"name": "cas_server_token",
				"type": "text",
				"label": i18n.get("CAS Server Token"),
				"text": "cCWcsOsxprO2BhnUnondjSqBLzPk1dCFf4Bb24JE",
				"masked": true					
			},	
			{
				"tab": i18n.get("Configuration"),
				"group": i18n.get("Connection"),
				"name": "factory_reset",
				"type": "button",
				"text": i18n.get("Factory Reset")
			},			
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Stream Deck"),
				"name": "cas_enable_streamdeck",
				"type": "checkbox",
				"label": i18n.get("Enable Device")
			},	
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Stream Deck"),
				"name": "brightness_range",
				"type": "slider",
				"label": i18n.get("Adjust Brightness"),
				"max": 100,
				"min": 0,
				"step": 10
			},	
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Stream Deck"),
				"name": "pair_stream_deck",
				"type": "button",
				"text": i18n.get("Pair Stream Deck Device")
			},
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("WebHID Control"),
				"name": "cas_hid_control",
				"type": "popupButton",
				"label": i18n.get("Speakerphone Call Control"),
				"options": [
					{"text": "No Device", "value": "none"},						
					{"text": "Jabra SPEAK 410", "value": "jabra-410"},
					{"text": "Jabra SPEAK 510", "value": "jabra-510"},				
					{"text": "Yealink MP50", "value": "yealink-mp50"}							
				]
			},			
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("WebHID Control"),
				"name": "pair_hid",
				"type": "button",
				"text": i18n.get("Pair HID Device")
			},			
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("WebHID Control"),
				"name": "forget_device",
				"type": "button",
				"text": i18n.get("Forget Device")
			},	
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_enable_active_call",
				"type": "checkbox",
				"label": i18n.get("Enable CAS Companion")
			},
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_use_active_call_control",
				"type": "checkbox",
				"label": i18n.get("Use ACS Call Control")
			},			
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_enable_shared_active_call_notification",
				"type": "checkbox",
				"label": i18n.get("Enable Shared Call Notification")
			},
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_enable_voice_transcription",
				"type": "checkbox",
				"label": i18n.get("Enable Voice Transcription")
			},
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_embed_in_teams",
				"type": "checkbox",
				"label": i18n.get("Embed in MS Teams. When current call is connected, move active call window to CAS Companion tab in MS Teans")
			},			
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_active_call_action_keywords",
				"type": "textarea",
				"label": i18n.get(""),
				"text": i18n.get("List of Action Keywords. For example:\n\nnext week\nfollow up\ncall me\nnext step"),
			},			
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_active_call_group_id",
				"type": "text",
				"label": i18n.get("Collaboration Group Id"),
				"text": "fam"
			},	
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_active_call_thread_id",
				"type": "text",
				"label": i18n.get("Collaboration Thread Id"),
				"text": "19:83ec482c-3bc5-4116-acee-e081cc720630_ba9e081a-5748-40ca-8fd5-ab9c74dae3d1@unq.gbl.spaces"
			},			
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_one_note_section_id",
				"type": "text",
				"label": i18n.get("OneNote Section Id"),
				"text": "1-34167a55-e4a4-4c4c-ac99-dec00153c31a"
			},
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_delegate_username",
				"type": "text",
				"label": i18n.get("Delegate User Name"),
				"text": "florence"
			},	
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_delegate_userid",
				"type": "text",
				"label": i18n.get("Delegate User Id"),
				"text": "ba9e081a-5748-40ca-8fd5-ab9c74dae3d1"
			},	
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("General"),
				"name": "cas_deep_link_id",
				"type": "text",
				"label": i18n.get("Deep Link Id"),
				"text": "eaf9ea54-1859-4b20-bafb-8cb665f1ef37"
			},				
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("Intelliflo"),
				"name": "cas_enable_intelliflo",
				"type": "checkbox",
				"label": i18n.get("Enable Workflow. Sync Intelliflo clients with Teams contacts. Popup will only happen when open workstation button is pressed")
			},	
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("Intelliflo"),
				"name": "cas_autopop_intelliflo",
				"type": "checkbox",
				"label": i18n.get("Auto-popup Client Details. Navigate Intelliflo to the client dashboard page of the caller when call is active.")
			},	
			{
				"tab": i18n.get("CAS Companion"),
				"group": i18n.get("Intelliflo"),
				"name": "cas_embed_in_workstation",
				"type": "checkbox",
				"label": i18n.get("Embed in Client Workstation. When current call is connected, move active call window to an Intelliflo widget.")
			},			
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Preferences"),
				"name": "cas_enable_dialer",
				"type": "checkbox",
				"label": i18n.get("Enable CAS Dialer")
			},						
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Preferences"),
				"name": "cas_enable_web_apps",
				"type": "checkbox",
				"label": i18n.get("Enable Web Apps for Active Calls")
			},			
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Preferences"),
				"name": "cas_enable_audioonly",
				"type": "checkbox",
				"label": i18n.get("Enable Audio Only Mode")
			},			
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Preferences"),
				"name": "cas_enable_notifications",
				"type": "checkbox",
				"label": i18n.get("Enable Notification Popups")
			},			
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Preferences"),
				"name": "cas_enable_tel_protocol",
				"type": "checkbox",
				"label": i18n.get("Enable TEL: Protocol Handler")
			},	
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Preferences"),
				"name": "cas_default_web_app",
				"type": "text",
				"label": i18n.get("Default Web App"),
				"text": "https://comitfs.github.io/cas-omni/demo/crm/"
			},			
			{
				"tab": i18n.get("User Interface"),
				"group": i18n.get("Preferences"),
				"name": "cas_telephone_contry_code",
				"type": "popupButton",
				"label": i18n.get("Telephone Country Code"),
				"options": [
					{"text": "Algeria", "value": "ar-DZ"},
					{"text": "Argentina", "value": "es-AR"},
					{"text": "Australia", "value": "en-AU"},
					{"text": "Bahrain", "value": "ar-BH"},
					{"text": "Bolivia", "value": "es-BO"},
					{"text": "Brazil", "value": "pt-BR"},
					{"text": "Bulgaria", "value": "bg-BG"},
					{"text": "Canada", "value": "en-CA"},
					{"text": "Chile", "value": "es-CL"},
					{"text": "China (Simp.)", "value": "cmn-Hans-CN"},
					{"text": "Colombia", "value": "es-CO"},
					{"text": "Costa Rica", "value": "es-CR"},
					{"text": "Croatia", "value": "hr_HR"},
					{"text": "Czech Republic", "value": "cs-CZ"},
					{"text": "Denmark", "value": "da-DK"},
					{"text": "Dominican Republic", "value": "es-DO"},
					{"text": "Ecuador", "value": "es-EC"},
					{"text": "Egypt", "value": "ar-EG"},
					{"text": "El Salvador", "value": "es-SV"},
					{"text": "Finland", "value": "fi-FI"},
					{"text": "France", "value": "fr-FR"},
					{"text": "Germany", "value": "de-DE"},
					{"text": "Greece", "value": "el-GR"},
					{"text": "Guatemala", "value": "es-GT"},
					{"text": "Honduras", "value": "es-HN"},
					{"text": "Hong Kong SAR (Trad.)", "value": "cmn-Hans-HK"},
					{"text": "Hong Kong", "value": "yue-Hant-HK"},
					{"text": "Hungary", "value": "hu-HU"},
					{"text": "Iceland", "value": "is-IS"},
					{"text": "India", "value": "en-IN"},
					{"text": "India", "value": "hi-IN"},
					{"text": "Indonesia", "value": "id-ID"},
					{"text": "Iran", "value": "fa-IR"},
					{"text": "Iraq", "value": "ar-IQ"},
					{"text": "Ireland", "value": "en-IE"},
					{"text": "Israel", "value": "he-IL"},
					{"text": "Israel", "value": "ar-IL"},
					{"text": "Italy", "value": "it-IT"},
					{"text": "Japan", "value": "ja-JP"},
					{"text": "Jordan", "value": "ar-JO"},
					{"text": "Korea", "value": "ko-KR"},
					{"text": "Kuwait", "value": "ar-KW"},
					{"text": "Lebanon", "value": "ar-LB"},
					{"text": "Lithuania", "value": "lt-LT"},
					{"text": "Malaysia", "value": "ms-MY"},
					{"text": "Morocco", "value": "ar-MA"},
					{"text": "México", "value": "es-MX"},
					{"text": "Netherlands", "value": "nl-NL"},
					{"text": "New Zealand", "value": "en-NZ"},
					{"text": "Nicaragua", "value": "es-NI"},
					{"text": "Norway", "value": "nb-NO"},
					{"text": "Oman", "value": "ar-OM"},
					{"text": "Palestinian Territory", "value": "ar-PS"},
					{"text": "Panamá", "value": "es-PA"},
					{"text": "Paraguay", "value": "es-PY"},
					{"text": "Perú", "value": "es-PE"},
					{"text": "Philippines", "value": "en-PH"},
					{"text": "Philippines", "value": "fil-PH"},
					{"text": "Poland", "value": "pl-PL"},
					{"text": "Portugal", "value": "pt-PT"},
					{"text": "Puerto Rico", "value": "es-PR"},
					{"text": "Qatar", "value": "ar-QA"},
					{"text": "Romania", "value": "ro-RO"},
					{"text": "Russia", "value": "ru-RU"},
					{"text": "Saudi Arabia", "value": "ar-SA"},
					{"text": "Serbia", "value": "sr-RS"},
					{"text": "Slovakia", "value": "sk-SK"},
					{"text": "Slovenia", "value": "sl-SI"},
					{"text": "South Africa", "value": "en-ZA"},
					{"text": "Spain", "value": "es-ES"},
					{"text": "Sweden", "value": "sv-SE"},
					{"text": "Switzerland", "value": "it-CH"},
					{"text": "Taiwan (Trad.)", "value": "cmn-Hant-TW"},
					{"text": "Thailand", "value": "th-TH"},
					{"text": "Tunisia", "value": "ar-TN"},
					{"text": "Turkey", "value": "tr-TR"},
					{"text": "UAE", "value": "ar-AE"},
					{"text": "Ukraine", "value": "uk-UA"},
					{"text": "United Kingdom", "value": "en-GB"},
					{"text": "United States", "value": "en-US"},
					{"text": "Uruguay", "value": "es-UY"},
					{"text": "Venezuela", "value": "es-VE"},
					{"text": "Viet Nam", "value": "vi-VN"}
				]
			}						
		],
		"alignment": [
			[
				"cas_endpoint_phone",
				"cas_controlpoint_address",
				"cas_endpoint_url",
				"cas_endpoint_name",
				"cas_endpoint_address",				
				"cas_pass_key",	
				"cas_client_id",
				"cas_redirect_url",
				"cas_access_token",
				"cas_server_token",
				"cas_server_url",
				"cas_personal_ddi"
			],
			[
				"cas_microphone",
				"cas_speaker",
				"cas_camera"
			],
			[
				"cas_delegate_userid",
				"cas_delegate_username",
				"cas_active_call_thread_id",
				"cas_active_call_group_id",
				"cas_one_note_section_id",
				"cas_deep_link_id"
			]
		]
	};
	
	if (getSetting('cas_enable_streamdeck')) {
		doSpeedDials();
	}	
}

function handleDevices() {	
	const devices = {microphones: [{"text": "None", "value": "none"}], speakers: [{"text": "None", "value": "none"}], cameras: [{"text": "None", "value": "none"}]};
	
	if (devices) {			
		this.manifest.settings.push(
		{
			"tab": i18n.get("User Interface"),
			"group": i18n.get("Devices"),
			"name": "cas_microphone",
			"type": "popupButton",
			"label": i18n.get("Microphone"),
			"options": devices.microphones
		});
		
		this.manifest.settings.push(
		{
			"tab": i18n.get("User Interface"),
			"group": i18n.get("Devices"),
			"name": "cas_speaker",
			"type": "popupButton",
			"label": i18n.get("Speaker"),
			"options": devices.speakers
		});	
		
		this.manifest.settings.push(
		{
			"tab": i18n.get("User Interface"),
			"group": i18n.get("Devices"),
			"name": "cas_camera",
			"type": "popupButton",
			"label": i18n.get("Camera"),
			"options": devices.cameras
		});			
	}
}

function doSpeedDials()
{
	const names = [];
	
	for (let i=0; i<32; i++) {		
		const label = "cas_touch_label_" + i;
		names.push(label);		
		
		this.manifest.settings.push(
		{
			"tab": i18n.get("Touch Points"),
			"group": i18n.get("Touch Point " + (i + 1)),
			"name": label,
			"type": "text",
			"label": i18n.get("Label"),
			"text": "Contact name"
		});	

		const name = "cas_touch_name_" + i;
		names.push(name);
			
		this.manifest.settings.push(
		{
			"tab": i18n.get("Touch Points"),
			"group": i18n.get("Touch Point " + (i + 1)),
			"name": name,
			"type": "text",
			"label": i18n.get("Address"),
			"text": "8:acs:7278b90e-91bb-4a42-8913-9233b5d4ad4f_0000000e-ee2c-3718-1252-573a0d00912b"
		});	

		const avatar = "cas_touch_avatar_" + i;
		names.push(avatar);
			
		this.manifest.settings.push(
		{
			"tab": i18n.get("Touch Points"),
			"group": i18n.get("Touch Point " + (i + 1)),
			"name": avatar,
			"type": "text",
			"label": i18n.get("Avatar"),
			"text": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
		});		
		
		const url = "cas_touch_appurl_" + i;
		names.push(url);
			
		this.manifest.settings.push(
		{
			"tab": i18n.get("Touch Points"),
			"group": i18n.get("Touch Point " + (i + 1)),
			"name": url,
			"type": "text",
			"label": i18n.get("App URL"),
			"text": "https://comitfs.github.io/cas-serve/demo/crm/"
		});			
		
		this.manifest.settings.push(
		{
			"tab": i18n.get("Touch Points"),
			"group": i18n.get("Touch Point " + (i + 1)),
			"name": "cas_touch_type_" + i,
			"type": "popupButton",
			"label": i18n.get("Type"),
			"options": [
				{"text": "None", "value": "none"},			
				{"text": "Telephone Number", "value": "phone-number"},
				{"text": "Microsoft Teams User", "value": "teams-user"},
				{"text": "Microsoft Teams User (Audio Only)", "value": "teams-user-audio"},					
				{"text": "Microsoft Teams Meeting", "value": "teams-meeting"},				
				{"text": "Microsoft Teams Meeting (Audio Only)", "value": "teams-meeting-audio"},					
				{"text": "CAS Omni User", "value": "cas-serve-user"},				
				{"text": "CAS Omni Group", "value": "cas-serve-group"},				
				{"text": "CAS Omni Room", "value": "cas-serve-room"}						
			]
		});	
	}
	
	this.manifest.alignment.push(names);		
}