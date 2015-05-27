$(document).ready(function() {
  resizeDiv();
});

window.onresize = function(event) {
  resizeDiv();
}

function resizeDiv() {
  var width = $(window).width();
  var height = $(window).height();
  console.log(width);
  $('.home-center').css({'height': height + 'px'});
}

$(function() {
  // Pulls the pulldown menu from the top
  $('#swipe-down').on('click', function() {
    $('#swipe-down').css('visibility', 'hidden');
    $('.home-pulldown').css('visibility', 'visible');
    $('.home-pulldown').animate({top:'0px'});
  });

  // Sends pulldown menu to the top
  $('#swipe-up').on('click', function() {
    $('.home-pulldown').animate({top:'-140px'}, function() {
     $('#swipe-down').css('visibility', 'visible');
   });
  });
});

// Greys out rest of screen and spawns a dialog box
$(function() {
  $('.increase-skill').on('click', function() {
    $.blockUI({
      message: $('#adjust-skills'),
      css: {
        'text-align': 'center',
        width: '37%',
        'padding-right': '10px'
      }
    });
    initialSpeed = parseInt($('input[name="speed-qty"]').val());
    initialSight = parseInt($('input[name="sight-qty"]').val());
    initialStars = parseInt($('#adjust-stars').text());
  });

  // Resets values to what they were before
  $('#cancel-skill').on('click', function() {
    $('input[name="speed-qty"]').val(initialSpeed);
    $('input[name="sight-qty"]').val(initialSight);
    $('#adjust-stars').text(initialStars);
    $.unblockUI();
  });

  // Commits the changes, reflecting them onto the pulldown menu
  $('#confirm-skill').on('click', function() {
    $('#pulldown-speed-val').text(($('input[name="speed-qty"]').val()));
    $('#pulldown-sight-val').text('x' + ($('input[name="sight-qty"]').val()));
    $('#pulldown-stars-val').text(($('#adjust-stars').text()));
    $.unblockUI();
  });

  // Increments the appropriate value when the respective '+' buttons
  // are pressed and decrements the stars. If there are no stars, pressing
  // the button does nothing
  $('.qty-button').click(function(e){
    // Get the field name
    fieldName = $(this).attr('field');
    // Get its current value
    var currentVal = parseInt($('input[name='+fieldName+']').val());
    var numStars = parseInt($('#adjust-stars').text());
    // If is not undefined
    if (!isNaN(numStars) && numStars > 0 && !isNaN(currentVal)) {
      // Increment
      $('input[name='+fieldName+']').val(currentVal + 1);
      $('#adjust-stars').text(numStars - 1);
    }
  });

  $( '#woof1' ).bind("load",function(){
    $( '#home-dog' ).click(function() {
      $( '#woof1' ).trigger( 'play' );
    });
  });
    $( '#woof1' ).trigger('load');
    
});
