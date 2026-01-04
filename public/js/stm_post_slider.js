'use strict';

(function ($) {
	$(document).ready(function () {
		stmPostSlider();
	});
	var stmPostSlider = function stmPostSlider() {

		$('.stm-post__slider__nav li a').on('click', function (e) {
			e.preventDefault();
			var activeSlide = $(this).attr('href');
			$('.stm-slide').removeClass('active');
			$(activeSlide).addClass('active');
			$('.stm-post__slider__nav li').removeClass('active');
			$(this).parent().addClass('active');
		});
	};
})(jQuery);