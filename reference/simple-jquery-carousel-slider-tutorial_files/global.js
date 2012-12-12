jQuery(function($) {
  
  prettyPrint();
  
  
  // right column fixed side bar
  var $right_column_offset = $('#tpl-right').offset().top;
  
  $(window).scroll(function (){
    
    if ($(window).scrollTop() > $right_column_offset) {
      $('#tpl-right').css({
        'position' : 'fixed',
        'top' : '10px',
        'margin-left': '630px'
      });
    }
    
    if ($(window).scrollTop() < $right_column_offset) {
      
      $('#tpl-right').css({
        'position' : 'relative',
        'top' : 'auto',
        'margin-left': '0'
      });
    }

    
  });
  
  
  
  
  
  $(window).load(function() {    
//    $('.mod.calendar .fc-event').mouseenter(function(){      
//      alert($(this).find('.fc-event-title').text());
//    });
  });
  
  

});
