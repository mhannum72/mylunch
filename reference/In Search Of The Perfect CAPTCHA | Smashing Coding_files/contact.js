/**
 * @package WordPress
 * @subpackage SmashingMagazine_Theme
 * @maintainer Smashing Media <admin@smashing-media.com>
 */

var ajaxurl = globals.wp_home+'/wp-admin/admin-ajax.php';

var contactForm =
{
    submit: function(event)
    {
        $('.contactform form.smashform input[type="submit"]').attr('disabled', 'disabled');
        $('.contactform form.smashform .container span.error').html('');

        var data = $('.contactform form.smashform').serialize();

        if(data.length>0)
        {
            data = data+"&action=validateSmashContactFormHandler";
        } else {
            data = "action=validateSmashContactFormHandler";
        }

        $.post(globals.wp_home+'/wp-admin/admin-ajax.php', data, function(response)
        {
            if($.fn.jquery == '1.2.6')
            {
                response = JSON.parse(response);
            }

            $.each(response.fields, function(index, value)
            {
                $('.contactform form.smashform .container.'+index+' span.error').html('<p>'+value+'</p>');
            });
            $('.contactform form.smashform input[type="submit"]').removeAttr("disabled");

            if(response.fields && response.fields.length == 0)
            {
                window.location = '/contact-form-thank-you/';
            } else {
                //$('body').stop().scrollTo( $("span.error p:nth-child(1)"), 100 );
            }
        });

        return false;	
    },
	restrict: function(limit)
	{
		var element = '.contactform #formlimitcounter';
		var limit = 420;
		var interval, f;
		var self = $(this);
		$(element).html(limit);			
		$(this).focus(function(){
			interval = window.setInterval(substring,100);
		});	
		$(this).blur(function(){
			clearInterval(interval);
			substring();
		});
		substringFunction = "function substring(){ var val = $(self).val();var length = val.length;if(length > limit){$(self).val($(self).val().substring(0,limit));}";
		if(typeof element != 'undefined')
			substringFunction += "if($(element).html() != limit-length){$(element).html((limit-length<=0)?'0':limit-length);}"
		substringFunction += "}";
		eval(substringFunction);
		substring();
	}
}

$(function() {

	subject_select = false;
	
	if($('.contactform').size())
	{
		contactForm.restrict;
	        $('.contactform #msg').keyup(contactForm.restrict);
	        $('.contactform form.smashform').submit(contactForm.submit);
	}
	
	initSubjectHighlighting();
	init_infofield();
});

function init_infofield()
{
	infofield_cnt = new Array();
        infofield_cnt['s_shop'] = 'To make it a bit easier for us to process your request, please always provide your order number (ex. <b>100012345</b>).';
	
	if(subject_select !== false)
	{
		toggle_infofield(subject_select);
	}

	$('.container label').click(function()
	{
		toggle_infofield(this.id);

	});
}

function toggle_infofield(label_id)
{
	if(isset(infofield_cnt[label_id]))
	{
		$('.infofield').html(infofield_cnt[label_id]).show();
	}else{
		$('.infofield').empty().hide();
	}
}

function initSubjectHighlighting()
{
	if(/\/contact?.+\//i.test(location.pathname))
	{
		var getparam = (unescape(location.search).length>0)?unescape(location.search.split('?')[1]):'';
		if(getparam !== '' && getparam !== 0)
		{
			if(isNaN(getparam))
			{
				var inputEl = $('input[value='+getparam+']');
				if(inputEl.length>0)
				{
					subject_select = inputEl.parent('label').attr('id');
					inputEl.parent('label').html('<input type="radio" value="'+getparam+'" name="subject" class="radio" checked="checked"><span class="highlighted">'+getparam+'</span>');
				}
			}else{
				var idx = parseFloat(getparam);
				if(idx >= 1 || idx < $('.subject label').length)
				{
					var label_el = $('.subject label');
					var label = label_el.slice(idx,idx+1);
					var text = label.text();	
					label.html('<input type="radio" value="'+text+'" name="subject" class="radio" checked="checked"><span class="highlighted">'+text+'</span>');
				}
			}
			$('.subject label input').change(function(e)
			{
				e.preventDefault();
				$('.subject label span.highlighted').removeClass('highlighted');
			});
		}
	}
}

function isset(varname)
{
	if(typeof(varname) !== 'undefined')
	{
		return true;
	}else{
		return false;
	}
}