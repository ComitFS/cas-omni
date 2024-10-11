window.addEventListener("load", function() {
	$('#zoomBtn').click(function() {
	  $('.zoom-btn-sm').toggleClass('scale-out');
	  if (!$('.zoom-card').hasClass('scale-out')) {
		$('.zoom-card').toggleClass('scale-out');
	  }
	});

	$('.zoom-btn-sm').click(function() {
	  var btn = $(this);
	  var card = $('.zoom-card');

	  if ($('.zoom-card').hasClass('scale-out')) {
		$('.zoom-card').toggleClass('scale-out');
	  }
	  
	});
	
	$('#nav div.zoom-card').hide();
	$('#nav ul li:first').addClass('active');
	
	$('#nav ul li a').click(function(){
		var currentTab = $(this).attr('href');
		var vis = $(currentTab).is(':visible'); 
		$('#nav div.zoom-card').hide();
	 
		$('#nav ul li').removeClass('active');
		$(this).parent().addClass('active'); 
		if(vis) {
			$(currentTab).hide();
		  
		} else {
			$(currentTab).show();
		  
		}
	});
});