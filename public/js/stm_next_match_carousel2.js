(function ($) {
    $(document).ready(function () {
        $my_nav = (slides_.navs_== 'disable') ? false : true;
        $my_dots = (slides_.dots_== 'disable') ? false : true;
        $('.stm-next-match-carousel2').owlCarousel({
            items: slides_.items,
            autoplay: false,
            slideBy: 1,
            margin: 30,
            nav: $my_nav,
            navText: ["<",">"],
            dots: $my_dots,
            loop: true,
            responsive: {
                0: {
                    items: 1
                },
                425: {
                    items: 1
                },
                520: {
                    items: 2
                },
                768: {
                    items: 2
                },
                1200: {
                    items: slides_.items
                }
            }
        });
    });
})(jQuery);