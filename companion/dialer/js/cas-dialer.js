export class CasDialer extends LIT.LitElement {
  static properties = {

  };

	constructor() {
		super();
	}

	createRenderRoot() {
		return this;
	}

	toggleDesktopShare() {		
		const remoteVideoContainer = document.getElementById('remotescreenshare');
		const dialerContainer = document.getElementById('dialer');	

		console.debug("toggleDesktopShare", remoteVideoContainer.hidden, dialerContainer.hidden);
		
		remoteVideoContainer.hidden = !remoteVideoContainer.hidden;
		dialerContainer.hidden = !dialerContainer.hidden;
	}
	
	showSettings() {
		location.href = "./options/index.html";
	}
	
	toggleChat() {
		const chatContainer = document.getElementById('chat');
		const dialerContainer = document.getElementById('dialer');	

		console.debug("toggleChat", chatContainer.hidden, dialerContainer.hidden);
		
		chatContainer.hidden = !chatContainer.hidden;
		dialerContainer.hidden = !dialerContainer.hidden;		
	}
  
	render() {
	return LIT.html
	`
	<div class="container container-md ">
		<div id="nav" class="zoom">
			<!--Start Floating Icons-->
			<a class="zoom-fab zoom-btn-large" id="zoomBtn"><i class="fa fa-bars"></i></a>
			<ul class="zoom-menu">
				<li><a title="Toggle Dial Pad" href="#tab1" class="zoom-fab zoom-btn-sm zoom-btn-person scale-transition scale-out"><i
							class="fa fa-phone-alt"></i></a></li>
				<li><a href="#tab2" class="zoom-fab zoom-btn-sm zoom-btn-doc scale-transition scale-out"><i
							class="fa fa-bars"></i></a></li>
				<li><a href="#tab3" class="zoom-fab zoom-btn-sm zoom-btn-tangram scale-transition scale-out"><i
							class="fa fa-search"></i></a></li>
				<li><a href="#tab4" class="zoom-fab zoom-btn-sm zoom-btn-report scale-transition scale-out"><i
							class="fa fa-list"></i></a></li>
				<li><a title="Toggle Desktop Share" @click=${this.toggleDesktopShare} href="#tab5" class="zoom-fab zoom-btn-sm zoom-btn-desktop scale-transition scale-out"><i
							class="fa fa-desktop"></i></a></li>						
				<li><a title="Toggle Chat Conversations" @click=${this.toggleChat} href="#tab7" class="zoom-fab zoom-btn-sm zoom-btn-settings scale-transition scale-out"><i
							class="fas fa-comments"></i></a></li>	
				<li><a title="Show Settings" @click=${this.showSettings} href="#tab6" class="zoom-fab zoom-btn-sm zoom-btn-settings scale-transition scale-out"><i
							class="fas fa-cog"></i></a></li>								

			</ul>
			<!--End Floating Icons-->
			<div id="tab1" class="active zoom-card scale-transition scale-out">
				<!--Start Dailer Pad Section-->
				<div id="dail" class="dial-pad-wrap">
					<div class="dial-pad">

						<div class="col-md-12 dailed-screen ">
							<div class="d-flex align-items-center">
								<div class="col justify-content-start"><i class="fa fa-bars"></i></div>
								<div class="col-md-8 ">
									<div class="dial-screen scroll-style1" contenteditable="false"></div>
								</div>
								<div class="col justify-content-end">
									<div class="del-btn dial-key-wrap" data-key="back">
										<div class="dial-key"><i class="fas fa-long-arrow-alt-left"></i>
										</div>

									</div>
								</div>
							</div>
						</div>

						<div class="dial-table">
							<div class="dial-table-row">
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="1">
										<div class="dial-key">1</div>
										<div class="dial-sub-key">&nbsp;</div>
									</div>
								</div>
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="2">
										<div class="dial-key">2</div>
										<div class="dial-sub-key">abc</div>
									</div>
								</div>
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="3">
										<div class="dial-key">3</div>
										<div class="dial-sub-key">def</div>
									</div>
								</div>
							</div>
							<div class="dial-table-row">
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="4">
										<div class="dial-key">4</div>
										<div class="dial-sub-key">ghi</div>
									</div>
								</div>
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="5">
										<div class="dial-key">5</div>
										<div class="dial-sub-key">jkl</div>
									</div>
								</div>
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="6">
										<div class="dial-key">6</div>
										<div class="dial-sub-key">mno</div>
									</div>
								</div>
							</div>
							<div class="dial-table-row">
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="7">
										<div class="dial-key">7</div>
										<div class="dial-sub-key">pqrs</div>
									</div>
								</div>
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="8">
										<div class="dial-key">8</div>
										<div class="dial-sub-key">tuv</div>
									</div>
								</div>
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="9">
										<div class="dial-key">9</div>
										<div class="dial-sub-key">wxyz</div>
									</div>
								</div>
							</div>
							<div class="dial-table-row">
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="*">
										<div class="dial-key">*</div>
										<div class="dial-sub-key">&nbsp;</div>
									</div>
								</div>
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="0">
										<div class="dial-key">0</div>
										<div class="dial-sub-key">+</div>
									</div>
								</div>
								<div class="dial-table-col">
									<div class="dial-key-wrap" data-key="#">
										<div class="dial-key">#</div>
										<div class="dial-sub-key">&nbsp;</div>
									</div>
								</div>
							</div>
							<div class="dial-table-row no-sub-key">

								<div class="dial-table-col ">
									<div class="dial-key-wrap-call" data-key="call">
										<div class="dial-key" @click=${this.makeCall}><i class="fa fa-phone-alt"></i>
										</div>
										<div class="dial-sub-key">Call</div>
									</div>
								</div>

							</div>
							<!--div class="dial-table-row headset ">
								<div class="dial-table-col left-headset">
									<i class="fa fa-phone-alt"></i> <span> Left </span>
								</div>
								<div class="dial-table-col status ">

									Active

								</div>
								<div class="dial-table-col right-headset">
									<span> Right </span> <i class="fa fa-phone"></i>
								</div>
							</div-->
						</div>
					</div>
				</div>
				<!--End Dailer Pad Section-->
				<!--Start Call List Section-->
				<div id="dail-list" class="dial-pad-wrap">
					<div class="dial-pad">

						<div class="col-md-12 dailed-screen ">
							<div class="header-sec d-flex align-items-center">
								<div class="col d-flex justify-content-start"><i class="fa fa-bars"></i></div>
								<div class="col-md-8">

								</div>
								<div class="col  d-flex justify-content-end">
									<div class="del-btn">
										<div @click=${this.switchTolist}><i class="fas fa-tty"></i>
										</div>

									</div>
								</div>
							</div>
						</div>

						<div class="call-table">
							<div class="call-list">
								<div class=" col-md-12">
									<div class="d-flex">
										<div class="col-auto icon d-flex justify-content-center  align-items-center">
											<div class=" "><i class="fa fa-phone "></i></div>
										</div>
										<div class="col call-list-details">
											<div class="name">
												<div class="row">
													<div class="col-auto"><b>Jappy Takhar</b></div>
													<div class="col time">Conference</div>
												</div>
											</div>
											<div class="number">3103</div>
											<div class="actions">
												<div class="row">
													<div class="col-auto">
														<span><i class="fa fa-record-vinyl text-danger"></i></span>
														00:00:00
													</div>
													<div class="col actions-list">
														<span><i class="fa fa-microphone-alt"></i></span><span><i
																class="fa fa-volume-up"></i></span><span><i
																class="fa fa-pause-circle"></i></span><span><i
																class="fa fa-record-vinyl"></i></span><span><i
																class="fa fa-phone-volume"></i></span></div>

												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class="call-list">
								<div class=" col-md-12">
									<div class="d-flex">
										<div class="col-auto icon d-flex justify-content-center  align-items-center">
											<div class=" "><i class="fa fa-phone "></i></div>
										</div>
										<div class="col call-list-details">
											<div class="name">
												<div class="row">
													<div class="col-auto"><b>Jappy Takhar</b></div>
													<div class="col time">On Call</div>
												</div>
											</div>
											<div class="number">4103</div>
											<div class="actions">
												<div class="row">
													<div class="col-auto">
														<span><i class="fa fa-record-vinyl text-danger"></i></span>
														00:00:00
													</div>
													<div class="col actions-list">
														<span><i class="fa fa-microphone-alt"></i></span><span><i
																class="fa fa-volume-up"></i></span><span><i
																class="fa fa-pause-circle"></i></span><span><i
																class="fa fa-record-vinyl"></i></span><span><i
																class="fa fa-phone-volume"></i></span></div>

												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class="call-list">
								<div class=" col-md-12">
									<div class="d-flex">
										<div class="col-auto icon d-flex justify-content-center  align-items-center">
											<div class=" "><i class="fa fa-phone "></i></div>
										</div>
										<div class="col call-list-details">
											<div class="name">
												<div class="row">
													<div class="col-auto"><b>Jappy Takhar</b></div>
													<div class="col time">Hold</div>
												</div>
											</div>
											<div class="number">4105</div>
											<div class="actions">
												<div class="row">
													<div class="col-auto">
														<span><i class="fa fa-record-vinyl text-danger"></i></span>
														00:00:00
													</div>
													<div class="col actions-list">
														<div class="dropdown record-selection">
															<button class="btn record-drp-btn dropdown-toggle"
																type="button" id="dropdownMenuButton1"
																data-bs-toggle="dropdown" aria-expanded="false">
																Select Record
															</button>
															<ul class="dropdown-menu"
																aria-labelledby="dropdownMenuButton1">
																<li><a class="dropdown-item" href="#"><span><i
																				class="fa fa-record-vinyl text-danger"></i></span>Record
																		1</a></li>
																<li><a class="dropdown-item" href="#"><span><i
																				class="fa fa-record-vinyl text-danger"></i></span>Record
																		2</a></li>
																<li><a class="dropdown-item" href="#"><span><i
																				class="fa fa-record-vinyl text-danger"></i></span>Record
																		3</a></li>
															</ul>
														</div>
														<div class="progress-sec">
															<div class="row  align-items-center">
																<div class="col-auto p-0"> <span><i
																			class="fa fa-record-vinyl text-danger"></i></span>
																</div>
																<div class="col">
																	<div class="progress">
																		<div class="progress-bar progress-bar-striped"
																			role="progressbar" style="width: 10%"
																			aria-valuenow="10" aria-valuemin="0"
																			aria-valuemax="100"></div>
																	</div>
																</div>
																<div class="col-auto pl-0 ">
																	00:00:00
																</div>
															</div>

														</div>


													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>


						</div>
					</div>
				</div>
				<!--End Call List Section-->
			</div>


			<div id="tab2" class="active zoom-card scale-transition scale-out">
				<!--Start Lines List Section-->
				<div class="dial-pad-wrap">
					<div class="dial-pad">

						<div class="col-md-12 dailed-screen ">
							<div class="header-sec  d-flex align-items-center">
								<div class="col d-flex justify-content-start"><i class="fa fa-bars"></i></div>
								<div class="col-md-8">

								</div>
								<div class="col d-flex justify-content-end">
									<div class="del-btn">
										<div><i class="fas fa-tty"></i>
										</div>

									</div>
								</div>
							</div>
						</div>

						<div class="line-table scroll-style">
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list ">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="line-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-check-circle text-success"></i></div>
										</div>
										<div class="col line-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">4001-Dailtone-1Z1</div>
													<div class="col add-icon ">
														<i class="fa fa-plus"></i></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="dial-table-row headset ">
							<div class="dial-table-col left-headset">
								<i class="fa fa-phone-alt"></i> <span> Left </span>
							</div>
							<div class="dial-table-col status ">

								Active

							</div>
							<div class="dial-table-col right-headset">
								<span> Right </span> <i class="fa fa-phone"></i>
							</div>
						</div>

					</div>
				</div>
				<!--End Lines List Section-->
			</div>

			<div id="tab3" class="active zoom-card scale-transition scale-out">
				<!--Start Search List Section-->
				<div class="dial-pad-wrap">
					<div class="dial-pad">

						<div class="col-md-12 dailed-screen ">
							<div class="header-sec d-flex align-items-center">

								<div class="col-md-6 d-flex justify-content-start"><i class="fa fa-bars"></i></div>

								<div class="col-md-6 d-flex justify-content-end">
									<div class="filter dropdown">
										<i class="fa fa-filter dropdown-toggle" type="button" data-bs-display="static"
											id="dropdownMenu2" data-bs-toggle="dropdown" aria-expanded="false">
										</i>
										<ul class="dropdown-menu dropdown-menu-end dropdown-menu-lg-start"
											aria-labelledby="dropdownMenu2">
											<li><button class="dropdown-item" type="button"><span><i
															class="fa fa-building"></i></span>Office</button></li>
											<li><button class="dropdown-item" type="button"><span><i
															class="fa fa-building"></i></span>Office</button></li>
											<li><button class="dropdown-item" type="button"><span><i
															class="fa fa-building"></i></span>Office</button></li>
										</ul>
									</div>
								</div>


							</div>
						</div>


						<div class="search-sec">


							<div class="search-block">
								<div class="input-group input-group-sm mb-3">

									<input type="text" class="form-control" placeholder="Search"
										aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm">
								</div>

								<div class="col-md-12 main-button d-flex justify-content-end align-items-center">
									<button type="button" class="btn btn-primary btn-sm">Search</button>
								</div>
							</div>
							<div class="call-table scroll-style search-result">
								<div class="call-list">
									<div class=" col-md-12">
										<div class="d-flex">
											<div
												class="col-auto icon d-flex justify-content-center  align-items-center">
												<div class="initials "><b>JT</b></div>
											</div>
											<div class="col call-list-details">
												<div class="name">
													<div class="row">
														<div class="col-auto"><b>Jappy Takhar</b></div>
														<div class="col d-flex justify-content-end "><a href="#"
																class="tag">Office</a></div>
													</div>
												</div>

												<div class="phone-numbers">
													<div class="row">
														<div class="col-md-6">
															<span><i class="fa fa-phone-alt text-primary"></i></span>
															077 111 1111
														</div>
														<div class="col-md-6">
															<span><i class="fa fa-tty text-primary"></i></span>
															077 111 1111
														</div>
														<div class="row">
															<div class="col-md-12">
																<span><i class="fa fa-building text-primary"></i></span>
																077 111 1111
															</div>

														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="call-list">
									<div class=" col-md-12">
										<div class="d-flex">
											<div
												class="col-auto icon d-flex justify-content-center  align-items-center">
												<div class="initials "><b>JT</b></div>
											</div>
											<div class="col call-list-details">
												<div class="name">
													<div class="row">
														<div class="col-auto"><b>Jappy Takhar</b></div>
														<div class="col d-flex justify-content-end "><a href="#"
																class="tag">Office</a></div>
													</div>
												</div>

												<div class="phone-numbers">
													<div class="row">
														<div class="col-md-6">
															<span><i class="fa fa-phone-alt text-primary"></i></span>
															077 111 1111
														</div>
														<div class="col-md-6">
															<span><i class="fa fa-tty text-primary"></i></span>
															077 111 1111
														</div>
														<div class="row">
															<div class="col-md-12">
																<span><i class="fa fa-building text-primary"></i></span>
																077 111 1111
															</div>

														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="call-list">
									<div class=" col-md-12">
										<div class="d-flex">
											<div
												class="col-auto icon d-flex justify-content-center  align-items-center">
												<div class="initials "><b>JT</b></div>
											</div>
											<div class="col call-list-details">
												<div class="name">
													<div class="row">
														<div class="col-auto"><b>Jappy Takhar</b></div>
														<div class="col d-flex justify-content-end "><a href="#"
																class="tag">Office</a></div>
													</div>
												</div>

												<div class="phone-numbers">
													<div class="row">
														<div class="col-md-6">
															<span><i class="fa fa-phone-alt text-primary"></i></span>
															077 111 1111
														</div>
														<div class="col-md-6">
															<span><i class="fa fa-tty text-primary"></i></span>
															077 111 1111
														</div>
														<div class="row">
															<div class="col-md-12">
																<span><i class="fa fa-building text-primary"></i></span>
																077 111 1111
															</div>

														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="call-list">
									<div class=" col-md-12">
										<div class="d-flex">
											<div
												class="col-auto icon d-flex justify-content-center  align-items-center">
												<div class="initials "><b>JT</b></div>
											</div>
											<div class="col call-list-details">
												<div class="name">
													<div class="row">
														<div class="col-auto"><b>Jappy Takhar</b></div>
														<div class="col d-flex justify-content-end "><a href="#"
																class="tag">Office</a></div>
													</div>
												</div>

												<div class="phone-numbers">
													<div class="row">
														<div class="col-md-6">
															<span><i class="fa fa-phone-alt text-primary"></i></span>
															077 111 1111
														</div>
														<div class="col-md-6">
															<span><i class="fa fa-tty text-primary"></i></span>
															077 111 1111
														</div>
														<div class="row">
															<div class="col-md-12">
																<span><i class="fa fa-building text-primary"></i></span>
																077 111 1111
															</div>

														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="call-list">
									<div class=" col-md-12">
										<div class="d-flex">
											<div
												class="col-auto icon d-flex justify-content-center  align-items-center">
												<div class="initials "><b>JT</b></div>
											</div>
											<div class="col call-list-details">
												<div class="name">
													<div class="row">
														<div class="col-auto"><b>Jappy Takhar</b></div>
														<div class="col d-flex justify-content-end "><a href="#"
																class="tag">Office</a></div>
													</div>
												</div>

												<div class="phone-numbers">
													<div class="row">
														<div class="col-md-6">
															<span><i class="fa fa-phone-alt text-primary"></i></span>
															077 111 1111
														</div>
														<div class="col-md-6">
															<span><i class="fa fa-tty text-primary"></i></span>
															077 111 1111
														</div>
														<div class="row">
															<div class="col-md-12">
																<span><i class="fa fa-building text-primary"></i></span>
																077 111 1111
															</div>

														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="call-list">
									<div class=" col-md-12">
										<div class="d-flex">
											<div
												class="col-auto icon d-flex justify-content-center  align-items-center">
												<div class="initials "><b>JT</b></div>
											</div>
											<div class="col call-list-details">
												<div class="name">
													<div class="row">
														<div class="col-auto"><b>Jappy Takhar</b></div>
														<div class="col d-flex justify-content-end "><a href="#"
																class="tag">Office</a></div>
													</div>
												</div>

												<div class="phone-numbers">
													<div class="row">
														<div class="col-md-6">
															<span><i class="fa fa-phone-alt text-primary"></i></span>
															077 111 1111
														</div>
														<div class="col-md-6">
															<span><i class="fa fa-tty text-primary"></i></span>
															077 111 1111
														</div>
														<div class="row">
															<div class="col-md-12">
																<span><i class="fa fa-building text-primary"></i></span>
																077 111 1111
															</div>

														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

						</div>
					</div>

				</div>
				<!--End Search List Section-->
			</div>
			<div id="tab4" class="active zoom-card scale-transition scale-out">
				<!--Start Record Section-->
				<div id="record-list" class="dial-pad-wrap">
					<div class="dial-pad">

						<div class="col-md-12 dailed-screen ">
							<div class="header-sec  d-flex align-items-center">
								<div class="col d-flex justify-content-start"><i class="fa fa-search"></i></div>
								<div class="col-md-8">

								</div>
								<div class="col d-flex justify-content-end">
									<div class="del-btn">
										<div class="dial-key" @click=${this.switchTorecord}><i
												class="fas fa-plus-circle"></i>
										</div>

									</div>
								</div>
							</div>
						</div>

						<div class="record-table  scroll-style">
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-pause-circle text-danger"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
							<div class="record-list">
								<div class=" col-md-12">
									<div class="d-flex justify-content-center align-items-center">
										<div class="col-auto icon d-flex">
											<div class=" "><i class="fa fa-play-circle text-success"></i></div>
										</div>
										<div class="col record-list-details ">
											<div class="name">
												<div class="row">
													<div class="col-auto label">Record1</div>
													<div class="col actions ">
														<span><i class="fa fa-file-archive"></i></span> <span><i
																class="fa fa-trash-alt"></i></span> <span><i
																class="fa fa-plus"></i></span></div>
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
						</div>

					</div>
					<div class="clearfix"></div>
				</div>

				<div id="record" class="dial-pad-wrap">
					<div class="dial-pad">

						<div class="col-md-12 dailed-screen ">
							<div class="header-sec  d-flex align-items-center">
								<div class="col d-flex justify-content-start"><i class="fa fa-bars"></i></div>
								<div class="col-md-8">

								</div>
								<div class="col d-flex justify-content-end">
									<div class="del-btn">
										<div class="dial-key"><i class="fas fa-tty"></i>
										</div>

									</div>
								</div>
							</div>
						</div>

						<div class="record-sec">

							<div class="col-md-12 time d-flex justify-content-center align-items-center">
								00:00:00
							</div>
							<div class="col-md-12 record-icon d-flex justify-content-center align-items-center">
								<i class="fa fa-record-vinyl text-danger"></i>
							</div>
							<div class="row record-actions">
								<div class="col-md-6 d-flex justify-content-center align-items-center">
									<i class="fa fa-pause"></i>
								</div>
								<div class="col-md-6 d-flex justify-content-center align-items-center">
									<i class="fa fa-play" @click=${this.switchTorecordsave}></i>
								</div>
							</div>



						</div>

					</div>
					<div class="clearfix"></div>
				</div>
				<div id="save-record" class="dial-pad-wrap">
					<div class="dial-pad">

						<div class="col-md-12 dailed-screen ">
							<div class="header-sec  d-flex align-items-center">
								<div class="col d-flex justify-content-start"><i class="fa fa-bars"></i></div>
								<div class="col-md-8">

								</div>
								<div class="col d-flex justify-content-end">
									<div class="del-btn">
										<div class="dial-key"><i class="fas fa-tty"></i>
										</div>

									</div>
								</div>
							</div>
						</div>
						<div class="save-rec">
							<div class="save-block">
								<div class="input-group input-group-sm mb-3">

									<input type="text" class="form-control" placeholder="Title"
										aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm">
								</div>
								<div class="input-group">

									<textarea class="form-control" placeholder="Description"
										aria-label="With textarea"></textarea>
								</div>
								<div class="col-md-12 main-button d-flex justify-content-end align-items-center">
									<button type="button" class="btn btn-primary btn-sm">Save</button>
								</div>
							</div>
						</div>
					</div>
					<div class="clearfix"></div>
				</div>

				<!--End Record  Section-->

			</div>
		</div>
	</div>
	`
	}

	reset() {
	  
	}
  
	makeCall() {
		$('.zoom-btn-sm').toggleClass('scale-out');
		$('.zoom-card').toggleClass('scale-out');	
		
		let destination = document.querySelector(".dial-screen").innerHTML;
		console.debug("makecall", destination);
		
		if (destination && destination.trim() != "") {			
			if (!destination.startsWith("+")) {
				const countryCode = getSetting("cas_telephone_contry_code", "en-GB").substring(3);
				const numberObjEvt = libphonenumber.parsePhoneNumber(destination, countryCode);
				destination = numberObjEvt.format('E.164');		
			}
			makeCall(destination);	// external
		}
	}

	switchTolist() {	
		if (document.getElementById('dail')) {

			if (document.getElementById('dail').style.display == 'none') {
				document.getElementById('dail').style.display = 'block';
				document.getElementById('dail-list').style.display = 'none';
			}
			else {
				document.getElementById('dail').style.display = 'none';
				document.getElementById('dail-list').style.display = 'block';
			}
		}	
	}

	switchTodail() {		
		if (document.getElementById('dail-list')) {

			if (document.getElementById('dail-list').style.display == 'none') {
				document.getElementById('dail-list').style.display = 'block';
				document.getElementById('dail').style.display = 'none';
			}
			else {
				document.getElementById('dail-list').style.display = 'none';
				document.getElementById('dail').style.display = 'block';
			}
		}
	}

	switchTorecord() {
	
		if (document.getElementById('record-list')) {

			if (document.getElementById('record-list').style.display == 'none') {
				document.getElementById('record-list').style.display = 'block';
				document.getElementById('record').style.display = 'none';
				document.getElementById('save-record').style.display = 'none';
			}
			else {
				document.getElementById('record-list').style.display = 'none';
				document.getElementById('record').style.display = 'block';
				
			}
		}	
	}
	
	switchTorecordsave() {
		
		if (document.getElementById('record')) {

			if (document.getElementById('record').style.display == 'none') {
				document.getElementById('record').style.display = 'block';
				document.getElementById('save-record').style.display = 'none';
			}
			else {
				document.getElementById('record').style.display = 'none';
				document.getElementById('save-record').style.display = 'block';
			}
		}	
	}  

  connectedCallback() {
    super.connectedCallback();
    this.reset();
  }
}
customElements.define('cas-dialer', CasDialer);

