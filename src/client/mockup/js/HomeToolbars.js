/* This file holds the functionality for the toolbars/icons used 
on the homescreen*/
$(function() {
	$background = $('#home-popup-background');
	
	/* Each of these lines defines an on-click function that makes all 
	home-toolbar-details invisible before making the details correspoding to the
	clicked element visible.*/
	$( '#home-food' ).click(function() {
		var isVisible = true;
		var $invisClass = $('.invisible');

		//if the home-food bar is invisible, then make it appear
		for (var i = 0; i < 4; i++) {
			if (($invisClass[i]) && ($invisClass[i].id === 'home-food-details')) {
				isVisible = false;
				$( '.home-toolbar-details').addClass( 'invisible' );
				$( '#home-food-details').removeClass( 'invisible' );
				$background.removeClass('invisible');
				break;
			}
		}
		
		//if the home-food bar is already showing, then make it disappear
		if (isVisible) {
			$('#home-food-details').addClass('invisible');
			$background.addClass('invisible');
		}
	});

	$('#home-clothes' ).click(function() {
		var isVisible = true;
		var $invisClass = $('.invisible');

		//if the home-clothes bar is invisible, then make it appear
		for (var i = 0; i < 4; i++) {
			if (($invisClass[i]) && ($invisClass[i].id === 'home-clothes-details')) {
				isVisible = false;
				$( '.home-toolbar-details').addClass( 'invisible' );
				$( '#home-clothes-details').removeClass( 'invisible' );
				$background.removeClass('invisible');
				break;
			}
		}

		//if the home-clothes bar is already showing, then make it disappear
		if (isVisible) {
			$('#home-clothes-details').addClass('invisible');
			$background.addClass('invisible');
		}
	});

	$('#home-groom').click(function() {
		var isVisible = true;
		var $invisClass = $('.invisible');

		//if the home-food bar is invisible, then make it appear
		for (var i = 0; i < 4; i++) {
			if (($invisClass[i]) && ($invisClass[i].id === 'home-groom-details')) {
				isVisible = false;
				$( '.home-toolbar-details').addClass( 'invisible' );
				$( '#home-groom-details').removeClass( 'invisible' );
				$background.removeClass('invisible');
				break;
			}
		}
		
		//if the home-food bar is already showing, then make it disappear
		if (isVisible) {
			$('#home-groom-details').addClass('invisible');
			$background.addClass('invisible');
		}
	});
});