/**
 * @package WordPress
 * @subpackage SmashingMagazine_Theme
 * @maintainer Smashing Media <admin@smashing-media.com>
 */

var ajaxurl = globals.wp_home+'/wp-admin/admin-ajax.php';

$(function() {
	$("select#subsection-select").change(function () { location.href = $(this).val(); });
	
	//Fix bottom-border of anchors with a child img
	$('a img').parents('a').css({border: 'none'});
	
	//Removed all fixed width and height values from images
	$('img').removeAttr('width').removeAttr('height');

	$("select#networkselection").change(function () { location.href = $(this).val(); });
	$("form#search select").change(function() { $(this).prevAll(".select-content").text($(this).val()); });
	
	if($(".sub-tabs").size())
	{
	   var subTabber = jQuery( '.subtab-pages > div' );
	   $( '.sub-tabs li > a' ).click(function()
	   {
	       subTabber.hide();
	       subTabber.filter(this.hash).show();
	       $( '.sub-tabs li > a' ).removeClass( 'active' );
	       $(this).addClass( 'active' );
	       return false;
	   }).filter( ':first' ).click();
	}

	$('#tweetlist li a.tweet-status' ).timeago();
	SyntaxHighlighter.config.clipboardSwf = 'http://media.smashingmagazine.com/themes/smashingv4/javascripts/sh/clipboard.swf';
	SyntaxHighlighter.all();
	
	selectMenu();
	footnotes();
	
	$.each($(".reporttable"), function(index, value) {
		var table_id = this.id;
		
		$("#"+table_id+" tr:odd").addClass("odd");
		$("#"+table_id+" tr:not(.odd)").hide();
		$("#"+table_id+" tr:first-child").show();
		$("#"+table_id+" tr.odd").click(function(){
			$(this).next("tr").toggle();
			$(this).find(".arrow").toggleClass("up");
		});
	});
});

function footnotes()
{

	var links = $('.post p:not(.longtags) a[href]:not([href^=#],[href^=mailto],[rel=nofollow]), .post ul a[href]:not([href^=#],[href^=mailto],[rel=nofollow])');
	var notelist = $('<ul class="print_only_notelist"></ul>').insertAfter($('.post'));
	var i = 0;
	
	$('<li>', { html: '<h4>Footnotes:</h4>' }).appendTo(notelist);
	$.each(links, function(){
		var parent_class = $(this).parent().attr('class');
		if(parent_class.indexOf('author') == -1 && parent_class.indexOf('tags') === -1 && parent_class.indexOf('edit') === -1 && parent_class.indexOf('social-icons') === -1)
		{
			var link_url = $(this).attr('href');
			var link_text = $(this).text();
			if(link_url !== '' && (/^https?:\/\//.test(link_url)))
			{
				if(link_url.search(/\.(jpg|jpeg|gif|png|ico|css|js|zip|tgz|gz|rar|bz2|doc|xls|exe|pdf|ppt|txt|tar|mid|midi|wav|bmp|mp3)/) === -1)
				{
					if(link_text.search(/Share|On|Twitter/i) === -1)
					{
						if(link_url.search(/pk_campaign|pk_kwd/i) === -1)
						{					
							i = i+1;
							$('<sup>',{text:' '+i+''}).addClass('print_only').insertAfter($(this));				
							if(link_text.length > 0)
							{
								var ftext = link_text+' - '+link_url;
							}else{
								var ftext = link_url;
							}
							$('<li>', { html: '<sup>'+i+'</sup> '+ftext }).appendTo(notelist);
						}
					}
				}
			}
		}
	});
}

function selectMenu()
{
	var selectMenu = $("#search select");
	$('<input id="'+selectMenu.attr('id')+'-hidden" type="hidden" name="'+selectMenu.attr('name')+'" value="" />').insertAfter(selectMenu);
	selectMenu.hide();
	
	var newSelectMenu = '<div class="selectmenu"><div class="selectmenu-selected"><a rel="placeholder">Everything</a></div><ul class="selectmenu-menu"><li><a rel="placeholder">Everything</a></li>';

	selectMenu.find('option:gt(0)').each(function(){
		newSelectMenu += '<li><a rel="'+$(this).val()+'">'+$(this).text()+'</a></li>';
	});
	
	newSelectMenu += '</ul></div>';
	
	$(newSelectMenu).insertAfter(selectMenu);

	var newSelectMenu = $('div.selectmenu');
	
	$('div.selectmenu-selected a', newSelectMenu).live('click', function(){
		
		$('ul.selectmenu-menu', newSelectMenu).toggle();
		
		return false;
	});
	
	$('body').live('click', function(){
		$('ul.selectmenu-menu', newSelectMenu).hide();
	});
		
	$('ul.selectmenu-menu a', newSelectMenu).live('click', function(){
		
		var optionValue = $(this).attr('rel');
		var optionText = $(this).text();
		
		$('ul.selectmenu-menu', newSelectMenu).hide();
		
		$('div.selectmenu-selected a', newSelectMenu).text(optionText);
		$('#'+selectMenu.attr('id')+'-hidden').val(optionValue);
		
		var activeMessageType = $('ul.message-type.active');
			
		if(activeMessageType.length) {
		    activeMessageType.slideUp(300, function(){
		    	$('#'+optionValue).addClass('active').slideDown(300);
		    }).removeClass('active');
		} else {
		    $('#'+optionValue).addClass('active').slideDown(300);
		}		
		
		return false;
	});	
}
