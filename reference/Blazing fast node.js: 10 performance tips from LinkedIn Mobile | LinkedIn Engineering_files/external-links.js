/**
 * Make all external links opened in new tab.
 * 
 * Copyright (c) 2011 LinkedIn Corporation. All rights reserved.
 * @author Tan Nhu, tnhu@linkedin.com
 * @date 2011-05-17
 */
(function($) {
	$(document).ready(function() {
		$("a").each(function() {
			var th = $(this),
				href = th.attr("href"),
				host = window.location.host,
				target = $.trim(th.attr("target")),
				test;
			
			if ( !target) {
				test = /^http:\/\//.test(href) && href.indexOf(host) == -1;
				
				if (test) {
					th.attr("target", "_blank");
				}
			}
		});
	});
})(jQuery);