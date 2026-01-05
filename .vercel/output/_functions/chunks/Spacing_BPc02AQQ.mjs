import { e as createComponent, f as createAstro, r as renderTemplate, w as defineScriptVars, h as addAttribute, m as maybeRenderHead } from './astro/server_c8H0H61q.mjs';
import 'piccolore';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Spacing = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Spacing;
  const { id, lg = "0", md = "0", sm = "0", xs = "0" } = Astro2.props;
  return renderTemplate(_a || (_a = __template(["", '<div class="stm-spacing"', "></div> <script>(function(){", `
  (function(){
    "use strict";
    var spacingID = spacingID,
        lgSpacing = lgSpacing,
        mdSpacing = mdSpacing,
        smSpacing = smSpacing,
        xsSpacing = xsSpacing;

    function stmSpacing($) {
      if (!$ || !$.fn) return;
      var element = $('#' + spacingID);
      if (!element.length) return;

      if (window.matchMedia("(min-width: 1200px)").matches && lgSpacing) {
        element.css("height", lgSpacing + 'px');
      } else if (window.matchMedia("(max-width: 1199px) and (min-width: 992px)").matches && mdSpacing) {
        element.css("height", mdSpacing + 'px');
      } else if (window.matchMedia("(max-width: 991px) and (min-width: 768px)").matches && smSpacing) {
        element.css("height", smSpacing + 'px');
      } else if (window.matchMedia("(max-width: 767px)").matches && xsSpacing) {
        element.css("height", xsSpacing + 'px');
      } else {
        element.css("height", "");
      }
    }

    function initSpacing() {
      var $ = typeof window !== 'undefined' ? (window.jQuery || window.$) : null;
      if ($ && $.fn) {
        $(document).ready(function() {
          stmSpacing($);
        });

        $(window).resize(function() {
          stmSpacing($);
        });
      } else {
        // Wait for jQuery to load
        var checkJQuery = setInterval(function() {
          if (typeof window !== 'undefined' && typeof window.jQuery !== 'undefined') {
            clearInterval(checkJQuery);
            var $ = window.jQuery;
            $(document).ready(function() {
              stmSpacing($);
            });
            $(window).resize(function() {
              stmSpacing($);
            });
          }
        }, 50);
        
        // Clear interval after 10 seconds to prevent infinite checking
        setTimeout(function() {
          clearInterval(checkJQuery);
        }, 10000);
      }
    }

    initSpacing();
  })();
})();<\/script>`])), maybeRenderHead(), addAttribute(id, "id"), defineScriptVars({ spacingID: id, lgSpacing: lg, mdSpacing: md, smSpacing: sm, xsSpacing: xs }));
}, "C:/Users/User/Desktop/projects/elevateballers/src/shared/components/ui/Spacing.astro", void 0);

export { $$Spacing as $ };
