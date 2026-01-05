/**
 * SThemes
 * Created by Пользователь on 17.01.2017.
 */

(function($) {
    $(document).ready(function() {
        if($("body").find(".stmTickerPostsList").find("li").length > 0) {

            var tm = $(".stmTickerPostsList").attr("data-auto_play_speed");
            var animateSpeed = $(".stmTickerPostsList").attr("data-animate_speed");
            var timerId = setInterval(function () {
                var tickerList = $(".stmTickerPostsList");
                
                // Check if ticker list still exists and has items
                if (!tickerList.length || tickerList.find("li").length === 0) {
                    clearInterval(timerId);
                    return;
                }

                var tickerFirstItem = (tickerList.attr("data-direction") == "up") ? $(".stmTickerPostsList li:first-child") : $(".stmTickerPostsList li:last-child");
                
                // Check if first item exists
                if (!tickerFirstItem.length) {
                    clearInterval(timerId);
                    return;
                }

                // Get ticker items using jQuery for consistency and null safety
                var tickerItems = $(".stmTickerPostsList .tickerItem");
                
                // Check if ticker items exist
                if (tickerItems.length === 0) {
                    clearInterval(timerId);
                    return;
                }

                // Get the HTML safely using jQuery
                var tickerFirstItemHtml;
                if (tickerList.attr("data-direction") == "up") {
                    var firstTickerItem = tickerItems.first();
                    if (!firstTickerItem.length) {
                        clearInterval(timerId);
                        return;
                    }
                    tickerFirstItemHtml = firstTickerItem[0].outerHTML;
                } else {
                    var countPosts = parseInt(tickerList.attr("data-count-posts")) || tickerItems.length;
                    var lastTickerItem = tickerItems.eq(Math.min(countPosts - 1, tickerItems.length - 1));
                    if (!lastTickerItem.length) {
                        clearInterval(timerId);
                        return;
                    }
                    tickerFirstItemHtml = lastTickerItem[0].outerHTML;
                }

                // Check if HTML was successfully retrieved
                if (!tickerFirstItemHtml) {
                    clearInterval(timerId);
                    return;
                }

                if (tickerList.attr("data-direction") == "up") {
                    $(".stmTickerPostsList").append(tickerFirstItemHtml);
                    tickerFirstItem.animate({
                        'marginTop': '-60px'
                    }, animateSpeed, function () {
                        tickerFirstItem.remove();
                    });
                } else {
                    $(".stmTickerPostsList").prepend(tickerFirstItemHtml);

                    tickerFirstItem.animate({
                        'marginBottom': '-60px'
                    }, animateSpeed, function () {
                        tickerFirstItem.remove();
                    });
                }

            }, tm);
        }
    });
})(jQuery);
