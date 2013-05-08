/**
 * Image border radius fix.
 * Source: http://sandbox.thewikies.com/img-w-radius/
 */
(function($) {
	$(document).ready(function() {
		$("img.border-radius, img.border-radius-top-left, img.border-radius-top-right, img.border-radius-bottom-left, img.border-radius-bottom-right").each(function() {
			var th = $(this),
				img = th.get(0),
				imgSrc = th.attr("src");
				imgStyle = img.style;
				
			if (imgStyle.backgroundSize == undefined && imgStyle.MozBackgroundSize == undefined) {
				return; // stop if background-size isn't supported
			}
			//else imgStyle.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="'+img.src+'",sizingMethod="scale")'; // ie6-8 didn't support radius anyway
			imgStyle.backgroundImage = 'url('+imgSrc+')'; // set background as src
			imgStyle.backgroundSize = '100% 100%'; // set background to stretch
			imgStyle.MozBackgroundSize = '100% 100%'; // ^^ but for Firefox 3.6
			img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; // set src as 1x1 blank gif
		});
	});
})(jQuery);