"use strict";
(function ($) {
    "use strict";

    /*Ready DOM scripts*/
    $(document).ready(function () {
        stm_sticky_footer();
        stm_open_search();
        stmFullwidthRowJs();
        default_widgets_scripts();
        if (!$('body').hasClass('splashBaseball') && !$('body').hasClass('basketball_two')) {
            eventPaginations();
        }
        if (navigator.userAgent.indexOf('Macintosh') >= 0) {
            $('body').addClass('stm-macintosh');
        }
        $(".stm-post-comments").on('click', function (e) {
            e.preventDefault();
            $([document.documentElement, document.body]).animate({
                scrollTop: $("#comments").offset().top
            }, 600);
        });
        //Default plugins
        $("select:not(.disable-select2)").select2({
            width: '100%',
            minimumResultsForSearch: '1'
        });

        if ($('.read-content').length > 0) {
            $('.read-content').readingTime({
                success: function (data) {
                    $('.read_text').text(data.eta.time + ' ' + toRead);
                },
            });
        }

        $('.stm-iframe').fancybox({
            type: 'iframe',
            padding: 0,
            maxWidth: '800px',
            width: '100%',
            fitToView: false,
            beforeLoad: function () {
                this.href = $(this.element).data('url');
            }
        });

        $('.stm-fancybox').fancybox({
            fitToView: false,
            padding: 0,
            autoSize: true,
            closeClick: false,
            maxWidth: '100%',
            maxHeight: '90%',
            beforeShow: function () {
                $('body').addClass('stm_locked');
                this.title = $(this.element).attr("data-caption");
            },
            beforeClose: function () {
                $('body').removeClass('stm_locked');
            },
            helpers: {
                title: {
                    type: 'inside'
                },
                overlay: {
                    locked: false
                }
            }
        });

        $('button[name="calc_shipping"]').on('click', function () {
            $('body').find('select#calc_shipping_country').select2('destroy');
            setTimeout(function () {
                $('body').find('select#calc_shipping_country').select2({
                    width: '100%',
                    minimumResultsForSearch: '1'
                });
            }, 2500)
        })

        $('html').on('click', function (evt) {
            $('.search-input').removeClass('active');
            $('.search-submit').removeClass('activated');
            $('.bloglogo').removeClass("logoHide");
        });

        stm_sort_media();

        // Event form validation
        $('.donation-popup-form').on('submit', function (e) {
            e.preventDefault();
            var $this = $(this);
            $($this).removeClass('error');
            $($this).find('.loading').addClass('active');
            $(this).ajaxSubmit({
                url: ajaxurl,
                dataType: 'json',
                success: function (data) {
                    $($this).find('.loading').removeClass('active');
                    if (data['redirect_url']) {
                        top.location.href = data['redirect_url'];
                        $($this).replaceWith('<p class="alert alert-success heading-font">' + data['success'] + '</p>');
                    } else if (data['success']) {
                        $($this).replaceWith('<p class="alert alert-success heading-font">' + data['success'] + '</p>');
                    } else {
                        for (var k in data['errors']) {
                            $($this).find('input[name="donor[' + k + ']"]').addClass('error');
                            $($this).find('textarea[name="donor[' + k + ']"]').addClass('error');
                        }
                    }
                }
            });
            $($this).find('.error').on('mouseover', function () {
                $(this).removeClass('error');
            });
            return false;
        });

        $('.stm-load-more-images-grid').on('click', function (e) {
            e.preventDefault();
            $(this).closest('.stm-images-grid').find('.stm-waiting').addClass('animated fadeIn').removeClass('stm-waiting');
            $(this).remove();
        });

        $('.stm-media-load-more a').on('click', function (e) {
            e.preventDefault();

            var page = $(this).attr('data-page');
            var category = $(this).attr('data-category');
            var loadBy = $(this).attr('data-load');
            var player_id = 'none';
            if (typeof stm_player_id !== 'undefined') {
                player_id = stm_player_id;
            }
            $.ajax({
                url: ajaxurl,
                dataType: 'json',
                context: this,
                data: {
                    action: 'splash_load_media',
                    page: page,
                    load: loadBy,
                    category: category,
                    playerId: player_id,
                    security: splash_load_media
                },
                beforeSend: function () {
                    $(this).addClass('loading');
                },
                success: function (data) {
                    $(this).removeClass('loading');
                    if (data.offset !== 'none') {
                        $(this).attr('data-page', data.offset);
                    } else {
                        $(this).remove();
                    }

                    if (data.html) {
                        var $items = $(data.html);
                        $('#' + category + '_media .stm-medias-unit').append($items);
                        if ($.fn.isotope) {
                            $('#' + category + '_media .stm-medias-unit').isotope('appended', $items, false);
                        }
                        stm_sort_media();
                    }
                }
            });
        });

        $('.stm-single-product-content-right table.variations select').on("change", function () {
            $(this).parent().find('.select2-selection__rendered').text($(this).find('option[value="' + $(this).val() + '"]').text());
        });

        $('.stm-menu-toggle, .stm-menu-toggle-baseball').on('click', function (e) {
            e.preventDefault();
            $(this).toggleClass('opened');
            $('.stm-mobile-menu-unit').slideToggle();
            if ($(this).hasClass('opened')) {
                $('.stm-main-menu').addClass("opened");
                $('.stm-menu-overlay-fullscreen').addClass("opened");
            } else {
                $('.stm-main-menu').removeClass("opened");
                $('.stm-menu-overlay-fullscreen').removeClass("opened");
            }
        });

        $('body').on('click', '.stm-menu-overlay-fullscreen', function () {
            $('.stm-menu-toggle, .stm-menu-toggle-baseball').removeClass("opened");
            $('.stm-main-menu').removeClass("opened");
            $('.stm-menu-overlay-fullscreen').removeClass("opened");
        });

        $(document).on("click", ".stm-mobile-menu-list li a", function () {
            if ($(this).parent("li").hasClass("menu-item-has-children") && !$(this).parent("li").hasClass("active")) {
                $(this).closest("li").siblings().find("ul").slideUp();
                $(this).closest("li").siblings().find("li").toggleClass("active");

                $(this).next("ul").slideDown();
                $(this).parent("li").toggleClass("active");

                return false;
            }
        });

        $(document).on("click", ".mobile-menu-bsbl > li", function () {

            if ($(this).hasClass("menu-item-has-children") && !$(this).hasClass("active")) {
                $(this).siblings().find("ul").hide();
                $(this).siblings().find("li").toggleClass("active");

                $(this).find("ul").slideDown();
                $(this).addClass("active").siblings().toggleClass("active");

                return false;
            } else {

                $(".mobile-menu-bsbl li").each(function () {
                    $(this).find("ul").hide();
                    $(this).removeClass("active");
                });

                return true;
            }
        });

        $(".stm-stat-points").counterUp({
            delay: 10,
            time: 500
        });

        $(window).on("scroll", function () {
            //if(! /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ){
            if ($(window).scrollTop() !== 0) {
                $("#stm-top-bar").addClass("top-sticky");
            } else {
                $("#stm-top-bar").removeClass("top-sticky");
            }

            /*}else{
            }*/
        });

        $(".rev-close-btn").on("click", function () {
            $(this).removeClass("open");
            $.fancybox.close();
        });

        $(".rev-play-btn").on('click', function (e) {
            e.preventDefault();
            $(".rev-close-btn").addClass("open");
            $(".rev-play-btn").fancybox({
                'titleShow': false,
                'transitionIn': 'elastic',
                'transitionOut': 'elastic',
                'closeBtn': false,
                'closeClick': false,
                helpers: {
                    overlay: { closeClick: false }
                },
                'padding': 0,
                'href': this.href.replace(new RegExp("watch\\?v=", "i"), 'v/'),
                'type': 'swf',
                'swf': { 'wmode': 'transparent', 'allowfullscreen': 'true' },
            });
        });
    });

    /*Window load scripts*/

    $(window).on('load', function () {
        if ($('body').hasClass('preloader')) {
            $('body').removeClass('preloader');
        }
        stm_sticky_footer();
        stmFullwidthRowJs();
    });

    /*Window resize scripts*/
    $(window).on('resize', function () {
        stm_sticky_footer();
        stmFullwidthRowJs();
    });


    /*CUSTOM FUNCTIONS*/
    /*Sticky footer*/
    function stm_sticky_footer() {
        var winH = $(window).outerHeight();
        var footerH = $('.stm-footer').outerHeight();
        var siteMinHeight = winH - footerH;

        if ($('body').hasClass('splashBaseball') && $('body').hasClass('page-template-coming-soon') && siteMinHeight < 600) {
            siteMinHeight = siteMinHeight + 100;
        }

        $('#wrapper').css({
            'min-height': siteMinHeight + 'px'
        });

        $('body').css({
            'padding-bottom': (footerH - 1) + 'px'
        });

    }

    function stm_open_search() {
        $('.stm-header-search').on('click', function (e) {
            e.stopPropagation();
        });

        $('.search-submit').on('click', function (e) {
            $(".bloglogo").toggleClass("logoHide");
            $(this).toggleClass('activated');
            var inputText = $(this).closest('form').find('input');
            if (!$(this).parents('.widget').length && !inputText.hasClass('active') || inputText.val() == '') {
                e.preventDefault();
                inputText.toggleClass('active');
                inputText.focus();
            } else {
                $('.search-input').removeClass('active');
                $('.search-submit').removeClass('activated');
                $('.bloglogo').removeClass("logoHide");
            }

        });
    }

    function stm_sort_media() {
        // init Isotope
        if ($('.stm-medias-unit').length) {
            if (typeof imagesLoaded == 'function' && $.fn.isotope) {
                $('.stm-medias-unit').imagesLoaded(function () {
                    $('.stm-medias-unit').isotope({
                        itemSelector: '.stm-media-single-unit',
                        layoutMode: 'masonry'
                    });
                });
            }
        }

        $('.stm-media-tabs-nav a').on('shown.bs.tab', function (e) {
            var tabId = $(this).attr('href');
            if ($.fn.isotope) {
                $(tabId + ' .stm-medias-unit').isotope('layout');
            }
        })
    }

    function default_widgets_scripts() {
        var stm_menu_widget = $('.widget_nav_menu');
        var stm_categories_widget = $('.widget_categories');
        var stm_recent_entries = $('.widget_recent_entries');

        if (stm_menu_widget.length) {
            stm_menu_widget.each(function () {
                if ($(this).closest('.footer-widgets-wrapper').length == 0) {
                    $(this).addClass('stm-widget-menu');
                    $(this).find('a').each(function () {
                        $(this).html('<span>' + $(this).text() + '</span>');
                    });
                }
            });
        }

        if (stm_categories_widget.length) {
            stm_categories_widget.each(function () {
                $(this).find('a').each(function () {
                    $(this).html('<span>' + $(this).text() + '</span>');
                });
            });
        }

        if (stm_recent_entries.length) {
            stm_recent_entries.each(function () {
                if (!$(this).find('.post-date').length) {
                    $(this).addClass('no-date');
                }
            });
        }
    }

    function stmFullwidthRowJs() {
        var winW = $(window).outerWidth();
        var contW = $('.stm-fullwidth-row-js').find('.container').width();
        var contMargins = (winW - contW) / 2;
        $('.stm-fullwidth-row-js').css({
            'margin-left': -contMargins + 'px',
            'margin-right': -contMargins + 'px'
        })
    }

    lightbox.option({
        'resizeDuration': 200,
        'wrapAround': true
    })
    function eventPaginations() {
        if ($('.stm-upcoming-events_list').length > 0 && $('.stm-upcoming-events_list').hasClass('paginated-list')) {
            var container = $('.paginated-list');
            var limit = container.attr('data-rows');
            var listItem = container.find('li');
            var itemClass;
            if ($('body').hasClass('splashAmericanFootball') || $('body').hasClass('hockey')) {
                listItem = $('.stm-upcoming-events_list tr.sp-row');
            }
            if (listItem.length > limit) {
                listItem.each(function (i) {
                    itemClass = 'page-num-' + Math.ceil((i + 1) / limit);
                    if ((i + 1) > limit) {
                        $(this).addClass('hidden');
                    }
                    $(this).addClass(itemClass);
                });
                var paginate = '<ul class="custom-paginate">';
                for (var i = 1; i <= Math.ceil(listItem.length / limit); i++) {
                    var activeClass = i == 1 ? 'active' : '';
                    paginate += '<li><a href="page-num-' + i + '" class="' + activeClass + '">' + i + '</a></li>';
                }
                paginate += '</ul>';
                container.append(paginate);
            }

            $('body').on('click', '.custom-paginate a', function (e) {
                e.preventDefault();
                $('.custom-paginate a').removeClass('active');
                $(this).addClass('active');
                var activePage = $(this).attr('href');
                var eventItems = $('.stm-upcoming-events_list.paginated-list ul li.stm-event-item');
                if ($('body').hasClass('splashAmericanFootball') || $('body').hasClass('hockey')) {
                    eventItems = $('.stm-upcoming-events_list tr.sp-row');
                }
                eventItems.each(function () {
                    $(this).addClass('hidden');
                });
                $('.' + activePage).each(function () {
                    $(this).removeClass('hidden');
                });
                $([document.documentElement, document.body]).animate({
                    scrollTop: container.offset().top
                }, 500);
            });
        }
    }

    $('.sp-template-player-statistics .sp-table-wrapper').each(function () {
        new PerfectScrollbar(this);
    });

    $('.widget_sp_player_list .sp-table-wrapper').each(function () {
        new PerfectScrollbar(this);
    });

    $('.sp-template-event-performance .sp-table-wrapper').each(function () {
        new PerfectScrollbar(this);
    });

    $('.sp-template-player-list .sp-table-wrapper').each(function () {
        new PerfectScrollbar(this);
    });

})(jQuery);


if (document.querySelector('.widget_league_table .sp-table-wrapper') !== null) {
    new PerfectScrollbar('.widget_league_table .sp-table-wrapper');
}

if (document.querySelector('.stm-af-template-event-list .stm-ipad-block') !== null) {
    new PerfectScrollbar('.stm-af-template-event-list .stm-ipad-block');
}

if (document.querySelector('.sp-template-league-table .sp-table-wrapper') !== null) {
    new PerfectScrollbar('.sp-template-league-table .sp-table-wrapper');
}


function stm_like(t) {
    var post_id = t.attr('data-id');
    var count = parseInt(t.find("span").text());
    if (localStorage.getItem("liked_" + post_id)) {
        return false;
    } else {
        localStorage.setItem("liked_" + post_id, 1);
        jQuery.post(ajaxurl, { action: "stm_like", id: post_id, security: stm_like_nonce }).done(function () {
            t.addClass("disabled");
            count++;
            t.find("span").text(count);
        });
    }
}


jQuery(window).on('load', function () {
    jQuery('body.single #main > div.joomsport_team').each(function () {
        var jsPageTitle = ('.stm-page-title .container');
        var jsTeamEmbl = jQuery(this).find('.post-thumbnail');

        jQuery(jsTeamEmbl).detach().prependTo(jsPageTitle);
        jQuery(jsPageTitle).parents('.stm-title-box-unit').addClass('js-title-page');
    });
    jQuery('body.single-joomsport_match #jsMatchViewID').each(function () {
        jQuery(this).children('div').slice(0, 3).wrapAll('<div class="jsMatchScore">');
    });
    jQuery('#joomsport-container .namePlayerCart .PlayerCardPlNumber').each(function () {
        if (jQuery.trim(jQuery(this).text()) == "") {
            jQuery(this).remove();
        }
    });
});
