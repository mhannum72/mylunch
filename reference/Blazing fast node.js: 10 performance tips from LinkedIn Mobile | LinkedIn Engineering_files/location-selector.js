/**
 * Location/Country selector handles location popup.
 * 
 * Copyright (c) 2011 LinkedIn Corporation. All rights reserved.
 * @author Tan Nhu, tnhu@linkedin.com
 * @date 2011-05-10
 */
(function($) {
	var selector = $(".location-selector ul"),
		isMouseInSelector = false,
		isMouseInAnchor = false;

	/**
	 * Hide language selector.
	 */
	function hideLanguageSelector() {
		isMouseInSelector = false;
		isMouseInAnchor = false;
		selector.css("display", "none");
	}

	/**
	 * Timeout function to hide language selector.
	 */
	function hideSelectorTimeout() {
		if ( !isMouseInSelector && !isMouseInAnchor) {
			hideLanguageSelector();
		} else {
			setTimeout(hideSelectorTimeout, 1000);
		}
	}
	
	$(".location-selector > a").bind("mouseenter", function() {
		var th = $(this),
			offset = th.offset();

		selector.appendTo("body").css({ 
			left: offset.left + "px", 
			top: (offset.top + 15) + "px",
			display: "block" 
		});
		
		isMouseInAnchor = true;
		hideSelectorTimeout();
	}).bind("mouseleave", function() {
		isMouseInAnchor = false;
	});

	selector.bind("mouseenter", function() {
		isMouseInSelector = true;
	}).bind("mouseleave", function() {
		isMouseInSelector = false;
	});
})(jQuery);