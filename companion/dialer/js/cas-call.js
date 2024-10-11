export class CasCall extends LIT.LitElement {
  static get properties() {
    return {
      'initials': 	{type: String},
      'photo': 		{type: String},	  
      'name': 		{type: String},
      'duration': 	{type: String},
      'number': 	{type: String},
      'state': 		{type: String},
	  'soft': 		{type: Boolean},
	  'button': 	{type: Object}		  
    };
  }
  
  constructor() {
    super();
	this.duration = "";
	this.button = {
		call: {},
		keyValue: 'soft-panel-' + Math.floor(Math.random() * 16), 
		value: "anonymous", 
		label: "Anonymous"
	};
  }

  createRenderRoot() {
    return this;
  }
  
  render() {
	let background = "#2c2c2c";
	let buttonType = "";
	
	let setDefaultBackground = () => {
		if (this.button.type == "phone-number") {
			background = "#1f1f1f";	
			buttonType = "Directory Number";			
		}
		
		if (this.button.type == "teams-user" || this.button.type == "cas-serve-user") {
			background = "#3c3c3c";
			buttonType = "Direct Line";				
		}
		
		if (this.button.type == "PhoneNumber") {
			background = "darkgray";	
			buttonType = "DDI";				
		}
		
		if (this.button.type == "teams-meeting") {
			background = "#6c6c6c";	
			buttonType = "Online Meeting";				
		}
	}
	setDefaultBackground();;
	
	let actions = [];

	if (this.state == "Connecting" && this.button?.call?.direction == "Outgoing") {			
		actions = [{icon: "fas fa-tty", request: "Hangup Call", id: "hangup_call"}];
	}
	else
		
	if (this.state == "Connected") 	{
		background = "green";		
		actions = [
			{icon: "fa fa-pause", request: "Hold Call", id: "hold_call"}, 
			{icon: "fas fa-tty", request: "Hangup Call", id: "hangup_call"}, 
			{icon: "fa fa-share-square", request: "Transfer Call", id: "transfer_call"}, 
			{icon: "fa fa-user-friends", request: "Invite Participant", id: "invite_participant"}, 
			{icon: "fa fa-desktop", request: "Toggle Screen Share", id: "toggle_screenshare"}
		];
		
		if (!this.joins) {
			this.joins = (new Date()).getTime();
			this.updateClock();
		}
	}
	else
		
	if (this.state == "LocalHold") 	{	
		background = "orange";
		actions = [{icon: "fa fa-phone", request: "Resume Call", id: "resume_call"}];				
	}		
	else		
		
	if (this.state == "Disconnected" || this.state == "Missed") 	{	
		setDefaultBackground();
		if (this.soft) this.remove();
		delete this.joins;
		this.duration = "";
	}	
	else
		
	if (this.state == "None" && this.button?.call?.direction == "Incoming") 	{	
		background = "red";		
		actions = [{icon: "fa fa-phone", request: "Accept Call", id: "accept_call"}];			
	}
	
	if (this.button.threadId) {
		if (this.button.type == "GroupIntercom") {
			actions.push({icon: "fas fa-comments", request: "Group Chat", id: "group_chat"});
		}
		else
			
		if (this.button.type == "DirectLine") {
			actions.push({icon: "fas fa-comment", request: "Private Chat", id: "private_chat"});
		}	
	}
	
    return LIT.html
`		<div class="notification-card" style="background-color: ${background};">
			<div class=" col-md-12">
				<div class="d-flex">
					<div class="col-auto icon d-flex justify-content-center  align-items-center">
						<a style="cursor:pointer;" title="Make Call" @click=${this.makeCall}><div title="${this.initials}" class="initials "><img width=48 src=${this.photo}/></div></a>
					</div>
					<div class="col notification-card-details">
						<div class="name">
							<div class="row">
								<div class="col-auto"><b>${this.name}</b></div>
								<div class="col time"><span><i class="fa fa-clock"></i></span>${this.duration}</div>
							</div>
						</div>
						<div title="${this.number}" style="width:200px; overflow:hidden; text-overflow: ellipsis;  white-space: nowrap;" class="number"> <span><i class="${this.button?.call?.direction ? (this.button?.call?.direction == 'Incoming' ? 'fas fa-arrow-right' : 'fas fa-arrow-left') : ''} text-danger"></i></span>${buttonType}</div>
						<div class="actions">
							<div class="row justify-content-end">
								${ actions.map(action => this.renderAction(action)) }
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
`
  }

  reset() {
	  
  }

  renderAction(action) {
	let className = "cut-key";
	if (action.id == "private_chat" || action.id == "group_chat") className = "on-key";
    return LIT.html
`
	<div class="col-auto p-1">
		<a title="${action.request}" @click=${this.handleAction}><div class="${className}"><i data-id="${action.id}"  class="${action.icon}"></i></div></a>
	</div>	
`
  }
  
  updateClock() {
	const that = this;
	
    function formatTimeSpan(totalSeconds) {
        const secs = ('00' + parseInt(totalSeconds % 60, 10)).slice(-2);
        const mins = ('00' + parseInt((totalSeconds / 60) % 60, 10)).slice(-2);
        const hrs = ('00' + parseInt((totalSeconds / 3600) % 24, 10)).slice(-2);
        return `${hrs}:${mins}:${secs}`;
    }
	
	function updateClock() {
		that.duration = formatTimeSpan((Date.now() - that.joins) / 1000);

		if (that.joins) {
			setTimeout(updateClock, 1000);
		}		
	}
	updateClock();
  }
  
  makeCall(ev) {
	ev.stopPropagation();
	ev.preventDefault();

	console.log("makeCall", this.button.value, ev.target);	
	handleButtonPress(this.button.keyValue);
  }
  
  handleAction(ev) {
	ev.stopPropagation();
	ev.preventDefault();
	
	const id = ev.target.getAttribute("data-id");
	console.log("handleAction", id, this.button.call?.id, ev.target);

	if (id == "resume_call") 		resumeCall(this.button.call.id);
	if (id == "accept_call") 		acceptCall(this.button.call.id);			
	if (id == 'hold_call') 			holdCall(this.button.call.id);
	if (id == 'hangup_call') 		hangupCall(this.button.call.id);
	if (id == 'invite_participant') addThirdParty(this.button.call.id, this.getParticipant());
	if (id == 'transfer_call') 		transferCall(this.button.call.id, this.getParticipant());
	
	if (id == 'toggle_screenshare') 
	{
		if (this.button.call.__screensharing) {
			stopScreenShare(this.button.call.id);
		} else {
			startScreenShare(this.button.call.id);
		}
	}
	
	if (id == "private_chat")	openChat(this.button);		
	if (id == "group_chat")		openChat(this.button);		
  } 

  getParticipant() {
	let destination = prompt("Enter Email Address");
	
	if (destination) {
		destination = getDestinationFromEmail(destination);
	}
	return destination;	
  }
  
  connectedCallback() {
    super.connectedCallback();
    this.reset();
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
  }  
}
customElements.define('cas-call', CasCall);

