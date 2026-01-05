import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, r as renderTemplate, u as unescapeHTML, k as renderComponent, q as renderSlot } from '../chunks/astro/server_c8H0H61q.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_0fak_qL3.mjs';
import { $ as $$Footer, M as MobileMenu, a as $$Header, b as $$TopBar, P as PageLoader } from '../chunks/PageLoader_D_5s45Mo.mjs';
import 'clsx';
import { f as formatMatchDate } from '../chunks/utils_D-DJdZHD.mjs';
import { d as getLeagueName, g as getTeam1Name, a as getTeam1Logo, b as getTeam2Name, c as getTeam2Logo } from '../chunks/league-helpers_BQcVt2so.mjs';
/* empty css                                 */
import { $ as $$Spacing } from '../chunks/Spacing_BPc02AQQ.mjs';
import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import { useState, useEffect, useRef, useMemo } from 'react';
import { create } from 'zustand';
import { r as reverseCategoryMap } from '../chunks/types_DXfYTmyI.mjs';
import { i as isFeatureEnabled } from '../chunks/feature-flags_DTlWIEXZ.mjs';
export { renderers } from '../renderers.mjs';

function getStageDisplayName(stage) {
  if (!stage) return "";
  const displayNames = {
    REGULAR_SEASON: "Regular Season",
    PRESEASON: "Preseason",
    EXHIBITION: "Exhibition",
    PLAYOFF: "Playoff",
    QUARTER_FINALS: "Quarter Finals",
    SEMI_FINALS: "Semi Finals",
    CHAMPIONSHIP: "Championship",
    QUALIFIER: "Qualifier",
    OTHER: "Other"
  };
  return displayNames[stage] || stage;
}

const $$Astro$1 = createAstro();
const $$MarqueeMatchup = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$MarqueeMatchup;
  let match = null;
  try {
    const championshipUrl = new URL("/api/matches", Astro2.url.origin);
    championshipUrl.searchParams.set("status", "UPCOMING");
    championshipUrl.searchParams.set("stage", "CHAMPIONSHIP");
    championshipUrl.searchParams.set("sort", "date-asc");
    championshipUrl.searchParams.set("limit", "1");
    let response = await fetch(championshipUrl.toString());
    if (response.ok) {
      const matches = await response.json();
      if (matches && matches.length > 0) {
        match = matches[0];
      }
    }
    if (!match) {
      const apiUrl = new URL("/api/matches", Astro2.url.origin);
      apiUrl.searchParams.set("status", "UPCOMING");
      apiUrl.searchParams.set("sort", "date-asc");
      apiUrl.searchParams.set("limit", "1");
      response = await fetch(apiUrl.toString());
      if (response.ok) {
        const matches = await response.json();
        match = matches && matches.length > 0 ? matches[0] : null;
      }
    }
  } catch (error) {
    console.error("Error fetching next match from API:", error);
  }
  if (!match) {
    return null;
  }
  const matchDate = formatMatchDate(match.date);
  const matchUrl = `/matches/${match.id}`;
  const leagueName = getLeagueName(match) || "";
  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);
  const stageDisplay = match.stage ? getStageDisplayName(match.stage).toUpperCase() : "UPCOMING MATCH";
  return renderTemplate`${maybeRenderHead()}<section class="marquee-matchup-section section" aria-label="Featured match" data-astro-cid-2hp5kkb6> <div class="container" data-astro-cid-2hp5kkb6> <div class="marquee-matchup-hero" data-astro-cid-2hp5kkb6> <div class="marquee-matchup-content" data-astro-cid-2hp5kkb6> <h1 class="marquee-matchup-title" data-astro-cid-2hp5kkb6>MARQUEE MATCHUP</h1> <p class="marquee-matchup-league" data-astro-cid-2hp5kkb6>${leagueName}</p> <div class="marquee-matchup-teams" data-astro-cid-2hp5kkb6> <div class="marquee-matchup-team" data-astro-cid-2hp5kkb6> <a${addAttribute(matchUrl, "href")} data-astro-cid-2hp5kkb6> ${team1Logo && renderTemplate`<img${addAttribute(team1Logo, "src")}${addAttribute(team1Name, "alt")} class="marquee-matchup-logo" data-astro-cid-2hp5kkb6>`} ${!team1Logo && renderTemplate`<div class="marquee-matchup-logo marquee-matchup-logo-placeholder" data-astro-cid-2hp5kkb6> <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-2hp5kkb6> <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" data-astro-cid-2hp5kkb6></path> </svg> </div>`} </a> <div class="marquee-matchup-team-name marquee-matchup-team-1" data-astro-cid-2hp5kkb6> <a${addAttribute(matchUrl, "href")} data-astro-cid-2hp5kkb6>${team1Name}</a> </div> </div> <div class="marquee-matchup-vs" data-astro-cid-2hp5kkb6>VS</div> <div class="marquee-matchup-team" data-astro-cid-2hp5kkb6> <a${addAttribute(matchUrl, "href")} data-astro-cid-2hp5kkb6> ${team2Logo && renderTemplate`<img${addAttribute(team2Logo, "src")}${addAttribute(team2Name, "alt")} class="marquee-matchup-logo" data-astro-cid-2hp5kkb6>`} ${!team2Logo && renderTemplate`<div class="marquee-matchup-logo marquee-matchup-logo-placeholder" data-astro-cid-2hp5kkb6> <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-2hp5kkb6> <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" data-astro-cid-2hp5kkb6></path> </svg> </div>`} </a> <div class="marquee-matchup-team-name marquee-matchup-team-2" data-astro-cid-2hp5kkb6> <a${addAttribute(matchUrl, "href")} data-astro-cid-2hp5kkb6>${team2Name}</a> </div> </div> </div> <div class="marquee-matchup-date" data-astro-cid-2hp5kkb6>${matchDate}</div> </div> <div class="marquee-matchup-overlay" data-astro-cid-2hp5kkb6>${stageDisplay}</div> </div> </div> </section> `;
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/home/components/MarqueeMatchup.astro", void 0);

const playerOfTheWeek = {
  name: "Paul Angwenyi",
  image: "images/IMG_9750-min-scaled.jpg",
  imageAlt: "Paul Angwenyi - Player of the Week",
  description: `Paul Angwenyi cemented his status as the star of the 2024 Elevate Ballers League Finals, leading Advance Basketball to a dominant series sweep over Lokoz. The ball-dominant point guard dazzled with his flashy playstyle, reminiscent of LaMelo Ball, combining creativity and court vision to keep defenders on their heels. Angwenyi averaged an impressive 25 points and 7 assists across the three-game series, orchestrating Advance Basketball's offense with poise and flair. His performance not only secured the championship but also showcased his undeniable talent and ability to shine on the biggest stage.

Beyond the numbers, Paul Angwenyi's impact on the court was undeniable. His ability to control the tempo of the game and make clutch plays elevated Advance Basketball when it mattered most. Whether it was a no-look dime to a cutting teammate or a deep three to ignite the crowd, Angwenyi's flair for the dramatic left fans and opponents in awe. His leadership and composure under pressure were key factors in Advance Basketball's success, proving that he is not just a flashy player but a true floor general capable of guiding his team to victory.`,
  signature: ""
};
const stats = [
  {
    id: "matches",
    value: 130,
    label: "matches played",
    icon: "images/court.png",
    iconAlt: "Basketball court icon"
  },
  {
    id: "players",
    value: 265,
    label: "players",
    icon: "images/basketball-player.png",
    iconAlt: "Basketball player icon"
  },
  {
    id: "teams",
    value: 25,
    label: "teams",
    icon: "images/playing.png",
    iconAlt: "Playing icon"
  },
  {
    id: "awards",
    value: 10,
    label: "awards won",
    icon: "images/award_1.png",
    iconAlt: "Award icon"
  }
];
const sponsors = [
  {
    id: "khoops",
    image: "images/khoopslogo-200x100.jpg",
    alt: "khoopslogo",
    title: "khoopslogo",
    width: 200,
    height: 100
  },
  {
    id: "beams",
    image: "images/beamslogo-200x100.jpg",
    alt: "beamslogo",
    title: "beamslogo",
    width: 200,
    height: 100
  },
  {
    id: "anto",
    image: "images/Photo-from-Anto-200x92.jpg",
    alt: "Photo from Anto",
    title: "Photo from Anto",
    width: 200,
    height: 92
  },
  {
    id: "horizon",
    image: "images/horizon-logo-200x100.jpg",
    alt: "horizon-logo",
    title: "horizon-logo",
    width: 200,
    height: 100
  }
];

const $$PlayerOfTheWeek = createComponent(($$result, $$props, $$slots) => {
  const player = playerOfTheWeek;
  const descriptionHtml = player.description.split("\n\n").map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
  return renderTemplate`${maybeRenderHead()}<div class="stm-coach-excerption-wrapp"> <div class="stm-title-wrapp"> <h3>PLAYER OF THE WEEK</h3> </div> <div class="clearfix"></div> <div class="stm-data-wrapp"> <div class="stm-photo-wrapp"> <img decoding="async"${addAttribute(player.image, "src")}${addAttribute(player.imageAlt, "alt")}> </div> <div class="stm-excerption-wrapp"> <span class="stm-excerption"><div class="stm-name-sign-wrapp"> <span class="stm-coach-name heading-font">${player.name}</span> ${player.signature} </div> ${unescapeHTML(descriptionHtml)}</span> </div> </div> </div>`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/home/components/PlayerOfTheWeek.astro", void 0);

const $$StatsSection = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="stm-statistics-wrapper"> <div class="vc_row wpb_row vc_inner vc_row-fluid"> <div class="wpb_column vc_column_container vc_col-sm-6 vc_col-lg-3 vc_col-md-3"> <div class="vc_column-inner"> <div class="wpb_wrapper"> <div class="stm-stats-wrapp default"> <img decoding="async"${addAttribute(stats[0].icon, "src")}${addAttribute(stats[0].iconAlt, "alt")}> <div class="stm-stat-info-wrapp"> <span class="stm-stat-points heading-font">${stats[0].value}</span> <span class="stm-stat-title normal_font">${stats[0].label}</span> </div> </div> </div> </div> </div> ${renderComponent($$result, "Spacing", $$Spacing, { "id": "stm-spacing-stat-1", "lg": "0", "md": "0", "sm": "0", "xs": "30" })} <div class="wpb_column vc_column_container vc_col-sm-6 vc_col-lg-3 vc_col-md-3"> <div class="vc_column-inner"> <div class="wpb_wrapper"> <div class="stm-stats-wrapp default"> <img decoding="async"${addAttribute(stats[1].icon, "src")}${addAttribute(stats[1].iconAlt, "alt")}> <div class="stm-stat-info-wrapp"> <span class="stm-stat-points heading-font">${stats[1].value}</span> <span class="stm-stat-title normal_font">${stats[1].label}</span> </div> </div> </div> </div> </div> ${renderComponent($$result, "Spacing", $$Spacing, { "id": "stm-spacing-stat-2", "lg": "0", "md": "0", "sm": "30", "xs": "30" })} <div class="wpb_column vc_column_container vc_col-sm-6 vc_col-lg-3 vc_col-md-3"> <div class="vc_column-inner"> <div class="wpb_wrapper"> <div class="stm-stats-wrapp default"> <img decoding="async"${addAttribute(stats[2].icon, "src")}${addAttribute(stats[2].iconAlt, "alt")}> <div class="stm-stat-info-wrapp"> <span class="stm-stat-points heading-font">${stats[2].value}</span> <span class="stm-stat-title normal_font">${stats[2].label}</span> </div> </div> </div> </div> </div> ${renderComponent($$result, "Spacing", $$Spacing, { "id": "stm-spacing-stat-3", "lg": "0", "md": "0", "sm": "30", "xs": "30" })} <div class="wpb_column vc_column_container vc_col-sm-6 vc_col-lg-3 vc_col-md-3"> <div class="vc_column-inner"> <div class="wpb_wrapper"> <div class="stm-stats-wrapp default"> <img decoding="async"${addAttribute(stats[3].icon, "src")}${addAttribute(stats[3].iconAlt, "alt")}> <div class="stm-stat-info-wrapp"> <span class="stm-stat-points heading-font">${stats[3].value}</span> <span class="stm-stat-title normal_font">${stats[3].label}</span> </div> </div> </div> </div> </div> </div> </div>`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/features/home/components/StatsSection.astro", void 0);

const useCarouselStore = create((set, get) => ({
  currentSlide: 0,
  totalSlides: 0,
  isAutoPlaying: false,
  goToSlide: (index) => {
    const { totalSlides } = get();
    if (index >= 0 && index < totalSlides) {
      set({ currentSlide: index });
    }
  },
  nextSlide: () => {
    const { currentSlide, totalSlides } = get();
    set({ currentSlide: (currentSlide + 1) % totalSlides });
  },
  prevSlide: () => {
    const { currentSlide, totalSlides } = get();
    set({ currentSlide: currentSlide === 0 ? totalSlides - 1 : currentSlide - 1 });
  },
  setTotalSlides: (total) => set({ totalSlides: total }),
  toggleAutoPlay: () => set((state) => ({ isAutoPlaying: !state.isAutoPlaying })),
  setAutoPlay: (value) => set({ isAutoPlaying: value })
}));

function PostSlider() {
  const { currentSlide, goToSlide, setTotalSlides } = useCarouselStore();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function fetchFeaturedArticles() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/news?featured=true");
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(`Failed to fetch featured articles: ${response.status} ${response.statusText}`);
        }
        const articles = await response.json();
        console.log("Fetched featured articles:", articles.length);
        if (articles.length === 0) {
          console.warn("No featured articles found. Make sure you have articles with feature=true and published=true in the database.");
        }
        const limitedArticles = articles.slice(0, 5);
        const mappedSlides = limitedArticles.map((article) => {
          let processedExcerpt = article.excerpt || "";
          if (typeof window !== "undefined") {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = processedExcerpt;
            processedExcerpt = tempDiv.textContent || tempDiv.innerText || "";
          } else {
            processedExcerpt = processedExcerpt.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
          }
          if (processedExcerpt.length > 180) {
            processedExcerpt = processedExcerpt.substring(0, 180).trim() + "...";
          }
          return {
            id: article.id,
            image: article.image || "/images/default-slide.jpg",
            category: reverseCategoryMap[article.category] || article.category,
            title: article.title,
            excerpt: processedExcerpt,
            url: `/news/${article.slug}`,
            shareUrl: `/news/${article.slug}`
          };
        });
        setSlides(mappedSlides);
      } catch (err) {
        console.error("Error fetching featured articles:", err);
        setError(err instanceof Error ? err.message : "Failed to load featured articles");
        setSlides([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFeaturedArticles();
  }, []);
  useEffect(() => {
    if (slides.length > 0) {
      setTotalSlides(slides.length);
    }
  }, [slides.length, setTotalSlides]);
  useEffect(() => {
    if (slides.length === 0) return;
    const slideElements = document.querySelectorAll(".stm-slide");
    slideElements.forEach((el, index) => {
      if (index === currentSlide) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
    const navElements = document.querySelectorAll(".stm-post__slider__nav li");
    navElements.forEach((el, index) => {
      if (index === currentSlide) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }, [currentSlide, slides.length]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "stm-post__slider container", children: /* @__PURE__ */ jsx("div", { className: "stm-post__slides", children: /* @__PURE__ */ jsx("div", { className: "stm-slide active", children: /* @__PURE__ */ jsx("div", { className: "stm-post__slider__data container", children: /* @__PURE__ */ jsx("div", { className: "row", children: /* @__PURE__ */ jsx("div", { className: "col-md-7 col-sm-6", children: /* @__PURE__ */ jsx("div", { className: "stm-slide__title heading-font", children: "Loading featured articles..." }) }) }) }) }) }) });
  }
  if (error) {
    console.error("PostSlider error:", error);
    return null;
  }
  if (slides.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "stm-post__slider container", children: [
    /* @__PURE__ */ jsx("div", { className: "stm-post__slides", children: slides.map((slide, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: `stm-slide ${index === currentSlide ? "active" : ""}`,
        id: slide.id,
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "stm-post__slider__image",
              style: { backgroundImage: `url(${slide.image})` }
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "stm-post__slider__data container", children: /* @__PURE__ */ jsx("div", { className: "row", children: /* @__PURE__ */ jsxs("div", { className: "col-md-7 col-sm-6", children: [
            /* @__PURE__ */ jsx("span", { className: "stm-slide__category", children: slide.category }),
            /* @__PURE__ */ jsx("div", { className: "stm-slide__title heading-font", children: slide.title }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "stm-slide__excerpt",
                style: {
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: "1.5",
                  maxHeight: "4.5em"
                  // Approximately 3 lines
                },
                children: slide.excerpt
              }
            ),
            /* @__PURE__ */ jsxs("a", { href: slide.url, className: "stm-slide__link heading-font", children: [
              "Read more ",
              /* @__PURE__ */ jsx("i", { className: "icon-mg-icon-arrow-italic" })
            ] })
          ] }) }) })
        ]
      },
      slide.id
    )) }),
    /* @__PURE__ */ jsx("ul", { className: "stm-post__slider__nav", children: slides.map((slide, index) => /* @__PURE__ */ jsx(
      "li",
      {
        className: index === currentSlide ? "active" : "",
        children: /* @__PURE__ */ jsx(
          "a",
          {
            href: `#${slide.id}`,
            onClick: (e) => {
              e.preventDefault();
              goToSlide(index);
            },
            children: slide.title
          }
        )
      },
      slide.id
    )) })
  ] }) });
}

function NewsTicker() {
  const tickerRef = useRef(null);
  const tickerInitializedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const [tickerItems, setTickerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;
    async function fetchTickerArticles() {
      try {
        setLoading(true);
        const response = await fetch("/api/news?limit=5");
        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.status}`);
        }
        const articles = await response.json();
        if (!isMounted) return;
        const items = articles.slice(0, 5).map((article) => {
          const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          }) : new Date(article.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          });
          return {
            id: article.id,
            title: article.title,
            date,
            url: `/news/${article.slug}`
          };
        });
        setTickerItems(items);
      } catch (err) {
        console.error("Error fetching ticker articles:", err);
        if (isMounted) {
          setTickerItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchTickerArticles();
    return () => {
      isMounted = false;
    };
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !window.jQuery || tickerItems.length === 0 || loading || tickerInitializedRef.current || isInitializingRef.current) {
      return;
    }
    isInitializingRef.current = true;
    const timer = setTimeout(() => {
      if (tickerInitializedRef.current || !tickerRef.current) {
        isInitializingRef.current = false;
        return;
      }
      const $ = window.jQuery;
      const ticker = $(tickerRef.current);
      if (ticker.length && typeof ticker.stmTickerPosts === "function") {
        try {
          tickerInitializedRef.current = true;
          isInitializingRef.current = false;
          ticker.stmTickerPosts({
            direction: "up",
            auto_play_speed: 1e4,
            animate_speed: 700,
            count_posts: 5
          });
        } catch (error) {
          console.error("Error initializing ticker:", error);
          tickerInitializedRef.current = false;
          isInitializingRef.current = false;
        }
      } else {
        isInitializingRef.current = false;
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      isInitializingRef.current = false;
    };
  }, [tickerItems.length, loading]);
  return /* @__PURE__ */ jsx("div", { className: "stmTickerWrapper default", style: { background: "#ffba00" }, children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: "stmTickerContent", children: [
    /* @__PURE__ */ jsxs("div", { className: "stmTickerTitle heading-font right", style: { order: 2, color: "#0e1d1f" }, children: [
      /* @__PURE__ */ jsx("span", { style: { color: "#ffffff" }, children: "ELEVATE" }),
      " NEWS"
    ] }),
    /* @__PURE__ */ jsx("div", { className: "stmTickerPostsWrapper", children: loading ? /* @__PURE__ */ jsx(
      "ul",
      {
        ref: tickerRef,
        className: "stmTickerPostsList stmTickerPostsListTop",
        children: /* @__PURE__ */ jsx("li", { className: "tickerItem", children: /* @__PURE__ */ jsx("div", { className: "stm-ticker-post", children: /* @__PURE__ */ jsx("span", { className: "normal_font", children: "Loading latest news..." }) }) })
      }
    ) : tickerItems.length === 0 ? /* @__PURE__ */ jsx(
      "ul",
      {
        ref: tickerRef,
        className: "stmTickerPostsList stmTickerPostsListTop",
        children: /* @__PURE__ */ jsx("li", { className: "tickerItem", children: /* @__PURE__ */ jsx("div", { className: "stm-ticker-post", children: /* @__PURE__ */ jsx("span", { className: "normal_font", children: "No news available" }) }) })
      }
    ) : /* @__PURE__ */ jsx(
      "ul",
      {
        ref: tickerRef,
        className: "stmTickerPostsList stmTickerPostsListTop",
        "data-direction": "up",
        "data-auto_play_speed": "10000",
        "data-animate_speed": "700",
        "data-count-posts": "5",
        suppressHydrationWarning: true,
        children: tickerItems.map((item) => /* @__PURE__ */ jsx("li", { className: "tickerItem", "data-id": item.id, suppressHydrationWarning: true, children: /* @__PURE__ */ jsxs("div", { className: "stm-ticker-post", children: [
          /* @__PURE__ */ jsx("i", { className: "icon-soccer_ico_ticker_post" }),
          /* @__PURE__ */ jsx("a", { href: item.url, children: /* @__PURE__ */ jsx("span", { className: "normal_font", children: item.title }) }),
          /* @__PURE__ */ jsx("span", { className: "ticker-post-divider normal_font", children: "/" }),
          /* @__PURE__ */ jsx("span", { children: item.date })
        ] }) }, item.id))
      }
    ) })
  ] }) }) });
}

function NextMatchCarousel() {
  const carouselRef = useRef(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/matches?status=upcoming").then((res) => res.json()).then((data) => {
      setMatches(data.slice(0, 5));
      setLoading(false);
    }).catch((err) => {
      console.error("Error fetching matches:", err);
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !window.jQuery || matches.length === 0) {
      return;
    }
    const $ = window.jQuery;
    const owl = $(carouselRef.current);
    const initCarousel = () => {
      if ($.fn.owlCarousel && owl.length) {
        owl.owlCarousel({
          items: 1,
          dots: true,
          nav: false,
          autoplay: false,
          loop: matches.length > 1
        });
      }
    };
    if ($.fn.owlCarousel) {
      initCarousel();
    } else {
      const checkInterval = setInterval(() => {
        if ($.fn.owlCarousel) {
          clearInterval(checkInterval);
          initCarousel();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
    return () => {
      if (owl && owl.data("owl.carousel")) {
        owl.trigger("destroy.owl.carousel");
      }
    };
  }, [matches]);
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "stm-next-match-carousel-wrap style_3", children: [
      /* @__PURE__ */ jsx("h2", { className: "stm-carousel-title", children: "UPCOMING MATCHES" }),
      /* @__PURE__ */ jsx("div", { className: "loading-matches", children: "Loading matches..." })
    ] });
  }
  if (matches.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "stm-next-match-carousel-wrap style_3", children: [
      /* @__PURE__ */ jsx("h2", { className: "stm-carousel-title", children: "UPCOMING MATCHES" }),
      /* @__PURE__ */ jsx("div", { className: "no-matches", children: "No upcoming matches scheduled." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "stm-next-match-carousel-wrap style_3", children: [
    /* @__PURE__ */ jsx("h2", { className: "stm-carousel-title", children: "UPCOMING MATCHES" }),
    /* @__PURE__ */ jsx("div", { className: "stm-next-match-carousel2", children: /* @__PURE__ */ jsx("div", { ref: carouselRef, className: "stm-next-match-carousel__item", children: matches.map((match) => /* @__PURE__ */ jsxs("div", { className: "stm-next-match-carousel__item", children: [
      /* @__PURE__ */ jsxs("div", { className: "event-results", children: [
        match.team1Logo && /* @__PURE__ */ jsx(
          "img",
          {
            decoding: "async",
            src: match.team1Logo,
            alt: match.team1Name,
            onError: (e) => {
              e.target.style.display = "none";
            }
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "post-score heading-font", children: "vs" }),
        match.team2Logo && /* @__PURE__ */ jsx(
          "img",
          {
            decoding: "async",
            src: match.team2Logo,
            alt: match.team2Name,
            onError: (e) => {
              e.target.style.display = "none";
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "event-data", children: [
        /* @__PURE__ */ jsx("div", { className: "teams-titles", children: /* @__PURE__ */ jsxs("a", { href: `/matches/${match.id}`, children: [
          match.team1Name,
          " vs ",
          match.team2Name
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "event-league", children: getLeagueName(match) || match.leagueName || "" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "event-date", children: formatMatchDate(match.date) })
    ] }, match.id)) }) })
  ] });
}

const useNewsStore = create((set) => ({
  activeTab: "All",
  setActiveTab: (tab) => set({ activeTab: tab })
}));

function normalizeImageUrl(imageUrl) {
  if (!imageUrl || imageUrl.trim() === "") {
    return "/images/placeholder-350x250.gif";
  }
  const trimmedUrl = imageUrl.trim();
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }
  if (trimmedUrl.startsWith("/")) {
    return trimmedUrl;
  }
  if (trimmedUrl.startsWith("wp-content/") || trimmedUrl.startsWith("images/")) {
    return `/${trimmedUrl}`;
  }
  return `/${trimmedUrl}`;
}
function LatestNews() {
  const { activeTab, setActiveTab } = useNewsStore();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function fetchLatestArticles() {
      try {
        setLoading(true);
        setError(null);
        const categoryParam = activeTab === "All" ? "" : `&category=${encodeURIComponent(activeTab)}`;
        const response = await fetch(`/api/news?limit=5${categoryParam}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.status}`);
        }
        const data = await response.json();
        setArticles(data.slice(0, 5));
      } catch (err) {
        console.error("Error fetching latest articles:", err);
        setError(err instanceof Error ? err.message : "Failed to load articles");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLatestArticles();
  }, [activeTab]);
  const filteredNews = useMemo(() => {
    return articles.map((article, index) => {
      const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }) : new Date(article.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const category = reverseCategoryMap[article.category] || article.category;
      const hasVideo = article.content.includes("youtube") || article.content.includes("vimeo");
      const numericId = article.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1e4;
      const normalizedImage = normalizeImageUrl(article.image);
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("Article image URL:", {
          original: article.image,
          normalized: normalizedImage,
          title: article.title
        });
      }
      return {
        id: numericId,
        title: article.title,
        date,
        category,
        image: normalizedImage,
        excerpt: article.excerpt || "",
        url: `/news/${article.slug}`,
        commentsCount: article.commentsCount,
        format: hasVideo ? "video" : "standard",
        feature: article.feature || false
      };
    });
  }, [articles]);
  const tabs = ["All", "Interviews", "Championships", "Match report", "Analysis"];
  const handleTabClick = (tab, e) => {
    e.preventDefault();
    setActiveTab(tab);
  };
  return /* @__PURE__ */ jsxs("div", { className: "stm-news-grid style_2 stm-media-tabs stm-news-tabs-wrapper", children: [
    /* @__PURE__ */ jsxs("div", { className: "clearfix", children: [
      /* @__PURE__ */ jsx("div", { className: "stm-title-left", children: /* @__PURE__ */ jsx("h2", { className: "stm-main-title-unit", children: "Latest news" }) }),
      /* @__PURE__ */ jsx("div", { id: "media_tabs_nav", className: "stm-media-tabs-nav", children: /* @__PURE__ */ jsx("ul", { className: "stm-list-duty heading-font", role: "tablist", children: tabs.map((tab) => /* @__PURE__ */ jsx("li", { className: activeTab === tab ? "active" : "", children: /* @__PURE__ */ jsx(
        "a",
        {
          href: `#${tab}`,
          "aria-controls": tab,
          role: "tab",
          "data-toggle": "tab",
          onClick: (e) => handleTabClick(tab, e),
          className: activeTab === tab ? "active" : "",
          id: `tab-${tab.toLowerCase().replace(" ", "-")}`,
          children: /* @__PURE__ */ jsx("span", { children: tab })
        }
      ) }, tab)) }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "tab-content", children: tabs.map((tab) => /* @__PURE__ */ jsx(
      "div",
      {
        role: "tabpanel",
        className: `tab-pane fade ${activeTab === tab ? "in active" : ""}`,
        id: tab,
        "aria-labelledby": `tab-${tab.toLowerCase().replace(" ", "-")}`,
        children: activeTab === tab && /* @__PURE__ */ jsxs(Fragment, { children: [
          loading && /* @__PURE__ */ jsx("div", { className: "stm-latest-news-wrapp", style: { textAlign: "center", padding: "2rem" }, children: /* @__PURE__ */ jsx("p", { children: "Loading latest articles..." }) }),
          error && /* @__PURE__ */ jsx("div", { className: "stm-latest-news-wrapp", style: { textAlign: "center", padding: "2rem", color: "#ef4444" }, children: /* @__PURE__ */ jsxs("p", { children: [
            "Error: ",
            error
          ] }) }),
          !loading && !error && filteredNews.length === 0 && /* @__PURE__ */ jsx("div", { className: "stm-latest-news-wrapp", style: { textAlign: "center", padding: "2rem" }, children: /* @__PURE__ */ jsx("p", { children: "No articles found in this category." }) }),
          !loading && !error && filteredNews.length > 0 && /* @__PURE__ */ jsx("div", { className: "stm-latest-news-wrapp", children: filteredNews.map((item, index) => /* @__PURE__ */ jsx(NewsCard, { item }, `article-${articles[index]?.id || index}`)) })
        ] })
      },
      tab
    )) })
  ] });
}
function NewsCard({ item }) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(item.image);
  const [imageLoading, setImageLoading] = useState(true);
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setImageSrc(item.image);
    if (item.image) {
      const img = new Image();
      img.onload = () => {
        setImageLoading(false);
        setImageError(false);
      };
      img.onerror = () => {
        console.warn("Image failed to load:", item.image);
        setImageError(true);
        setImageLoading(false);
        setImageSrc("/images/placeholder-350x250.gif");
      };
      img.src = item.image;
    } else {
      setImageLoading(false);
      setImageError(true);
      setImageSrc("/images/placeholder-350x250.gif");
    }
  }, [item.image]);
  const handleImageError = (e) => {
    if (!imageError) {
      console.warn("Image error event triggered for:", imageSrc);
      setImageError(true);
      setImageLoading(false);
      setImageSrc("/images/placeholder-350x250.gif");
      e.currentTarget.src = "/images/placeholder-350x250.gif";
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "stm-latest-news-single", children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: `stm-single-post-loop post-${item.id} post type-post status-publish format-${item.format || "standard"} has-post-thumbnail hentry category-${item.category.toLowerCase()}`,
      children: [
        /* @__PURE__ */ jsx("a", { href: item.url, title: item.title, children: /* @__PURE__ */ jsxs("div", { className: `image ${item.format === "video" ? "video" : ""}`, children: [
          imageLoading && !imageError && /* @__PURE__ */ jsx("div", { style: {
            width: "350px",
            height: "250px",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }, children: /* @__PURE__ */ jsx("span", { style: { color: "#999", fontSize: "14px" }, children: "Loading..." }) }),
          /* @__PURE__ */ jsx(
            "img",
            {
              decoding: "async",
              width: "350",
              height: "250",
              src: imageSrc,
              className: "img-responsive wp-post-image",
              alt: item.title,
              style: { display: imageLoading && !imageError ? "none" : "block" },
              onError: handleImageError,
              onLoad: () => setImageLoading(false)
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "stm-news-data-wrapp", children: [
          /* @__PURE__ */ jsx("div", { className: "date heading-font clear", children: item.date }),
          /* @__PURE__ */ jsx("div", { className: "title heading-font clear", children: /* @__PURE__ */ jsx("a", { href: item.url, children: item.title }) }),
          /* @__PURE__ */ jsxs("div", { className: "post-meta normal_font clear", children: [
            /* @__PURE__ */ jsxs("div", { className: "news-category", children: [
              /* @__PURE__ */ jsx("i", { className: "fa fa-folder-o", "aria-hidden": "true" }),
              item.category
            ] }),
            /* @__PURE__ */ jsx("div", { className: "comments-number", children: /* @__PURE__ */ jsxs("a", { href: `${item.url}#comments`, children: [
              /* @__PURE__ */ jsx("i", { className: "fa fa-comment-o", "aria-hidden": "true" }),
              /* @__PURE__ */ jsx("span", { children: item.commentsCount })
            ] }) })
          ] })
        ] })
      ]
    }
  ) });
}

function Sponsors() {
  const carouselRef = useRef(null);
  useEffect(() => {
    if (typeof window === "undefined" || !window.jQuery) {
      return;
    }
    const $ = window.jQuery;
    const owl = $(carouselRef.current);
    const initCarousel = () => {
      if ($.fn.owlCarousel && owl.length) {
        const desktopItems = 5;
        owl.owlCarousel({
          items: 4,
          dots: false,
          autoplay: false,
          slideBy: 4,
          loop: true,
          responsive: {
            0: {
              items: 1,
              slideBy: 1
            },
            420: {
              items: 3,
              slideBy: 3
            },
            768: {
              items: 3,
              slideBy: 3
            },
            992: {
              items: 4,
              slideBy: 4
            },
            1100: {
              items: desktopItems,
              slideBy: desktopItems
            }
          }
        });
      }
    };
    if ($.fn.owlCarousel) {
      initCarousel();
    } else {
      const checkInterval = setInterval(() => {
        if ($.fn.owlCarousel) {
          clearInterval(checkInterval);
          initCarousel();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
    return () => {
      if (owl && owl.data("owl.carousel")) {
        owl.trigger("destroy.owl.carousel");
      }
    };
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("h2", { style: { fontSize: "50px", textAlign: "center" }, className: "vc_custom_heading", children: "Our Sponsors" }),
    /* @__PURE__ */ jsxs("div", { className: "stm-image-carousel stm-images-carousel-sponsors", children: [
      /* @__PURE__ */ jsx("div", { className: "clearfix", children: /* @__PURE__ */ jsxs("div", { className: "stm-carousel-controls-right stm-image-controls", style: { display: "none" }, children: [
        /* @__PURE__ */ jsx("div", { className: "stm-carousel-control-prev", children: /* @__PURE__ */ jsx("i", { className: "fa fa-angle-left" }) }),
        /* @__PURE__ */ jsx("div", { className: "stm-carousel-control-next", children: /* @__PURE__ */ jsx("i", { className: "fa fa-angle-right" }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "stm-image-carousel-init-unit", children: /* @__PURE__ */ jsx("div", { ref: carouselRef, className: "stm-image-carousel-init", children: sponsors.map((sponsor) => /* @__PURE__ */ jsx("div", { className: "stm-single-image-carousel", children: /* @__PURE__ */ jsx(
        "img",
        {
          loading: "lazy",
          decoding: "async",
          src: sponsor.image,
          width: sponsor.width,
          height: sponsor.height,
          alt: sponsor.alt,
          title: sponsor.title
        }
      ) }, sponsor.id)) }) })
    ] })
  ] });
}

const useMediaStore = create((set) => ({
  activeMediaTab: "all_medias",
  setActiveMediaTab: (tab) => set({ activeMediaTab: tab })
}));

const allMediaItems = [
  {
    id: 1038,
    type: "image",
    title: "cheerleader",
    url: "https://elevateballers.com/wp-content/uploads/2016/04/IMG_2739-scaled.jpg",
    thumbnail: "images/IMG_2739-360x495.jpg",
    thumbnailAlt: "cheerleader",
    fancyboxGroup: "stm_photos"
  },
  {
    id: 1037,
    type: "image",
    title: "Tasur or Ghost, who ya got to win it all?",
    url: "https://elevateballers.com/wp-content/uploads/2024/01/IMG_6493-2-scaled.jpg",
    thumbnail: "images/IMG_6493-2-735x240.jpg",
    thumbnailAlt: "Tasur or Ghost, who ya got to win it all?",
    fancyboxGroup: "stm_photos"
  },
  {
    id: 1036,
    type: "image",
    title: "Jordo and gang",
    url: "https://elevateballers.com/wp-content/uploads/2024/01/IMG_6596-scaled.jpg",
    thumbnail: "images/IMG_6596-360x240.jpg",
    thumbnailAlt: "Jordo and gang",
    fancyboxGroup: "stm_photos"
  },
  {
    id: 360,
    type: "image",
    title: "Fan Corner",
    url: "https://elevateballers.com/wp-content/uploads/2016/06/IMG_2927-scaled.jpg",
    thumbnail: "images/IMG_2927-360x495.jpg",
    thumbnailAlt: "Fan Corner",
    fancyboxGroup: "stm_photos"
  },
  {
    id: 1034,
    type: "image",
    title: "Father TJ awards Stingers",
    url: "https://elevateballers.com/wp-content/uploads/2016/06/IMG_3681-scaled.jpg",
    thumbnail: "images/IMG_3681-360x240.jpg",
    thumbnailAlt: "Father TJ awards Stingers",
    fancyboxGroup: "stm_photos"
  },
  {
    id: 353,
    type: "audio",
    title: "Stingers champion",
    url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/242120896&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true",
    thumbnail: "images/IMG_3730-360x240.jpg",
    thumbnailAlt: "Stingers champion",
    fancyboxGroup: "stm_audio"
  },
  {
    id: 352,
    type: "image",
    title: "DB Nets media day",
    url: "https://elevateballers.com/wp-content/uploads/2016/04/519A0025-scaled.jpg",
    thumbnail: "images/519A0025-360x240.jpg",
    thumbnailAlt: "DB Nets media day",
    fancyboxGroup: "stm_photos"
  }
];
function filterMediaByType(items, type) {
  if (type === "all_medias") {
    return items;
  }
  const typeMap = {
    image_media: "image",
    audio_media: "audio",
    video_media: "video"
  };
  const mediaType = typeMap[type] || "image";
  return items.filter((item) => item.type === mediaType);
}

function MediaGallery() {
  const { activeMediaTab, setActiveMediaTab } = useMediaStore();
  const filteredMedia = useMemo(() => {
    return filterMediaByType(allMediaItems, activeMediaTab);
  }, [activeMediaTab]);
  const tabs = [
    { id: "all_medias", label: "All" },
    { id: "image_media", label: "Images" },
    { id: "audio_media", label: "Audio" }
  ];
  const handleTabClick = (tab, e) => {
    e.preventDefault();
    setActiveMediaTab(tab);
  };
  const getMediaSizeClass = (index, total) => {
    if (index === 0) return "stm-360-495";
    if (index === 1) return "stm-735-240";
    if (index === 2) return "stm-360-240";
    if (index === 3) return "stm-360-495";
    if (index === 4) return "stm-360-240";
    return "stm-360-240";
  };
  if (filteredMedia.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "stm-media-tabs _gallery style_3_3", children: /* @__PURE__ */ jsx("div", { className: "alert alert-info", children: "No media items available." }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "stm-media-tabs _gallery style_3_3", children: [
    /* @__PURE__ */ jsxs("div", { className: "clearfix", children: [
      /* @__PURE__ */ jsx("div", { className: "stm-title-left", children: /* @__PURE__ */ jsx("h2", { className: "stm-main-title-unit", children: "Media Gallery" }) }),
      /* @__PURE__ */ jsx("div", { className: "stm-media-tabs-nav", children: /* @__PURE__ */ jsx("ul", { className: "stm-list-duty heading-font", role: "tablist", children: tabs.map((tab) => /* @__PURE__ */ jsx("li", { className: activeMediaTab === tab.id ? "active" : "", children: /* @__PURE__ */ jsx(
        "a",
        {
          href: `#${tab.id}`,
          "aria-controls": tab.id,
          role: "tab",
          "data-toggle": "tab",
          onClick: (e) => handleTabClick(tab.id, e),
          children: /* @__PURE__ */ jsx("span", { children: tab.label })
        }
      ) }, tab.id)) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "tab-content", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          role: "tabpanel",
          className: `tab-pane fade ${activeMediaTab === "all_medias" ? "in active" : ""}`,
          id: "all_medias",
          children: /* @__PURE__ */ jsx("div", { className: "stm-medias-unit-wider", children: /* @__PURE__ */ jsx("div", { className: "stm-medias-unit clearfix", children: filteredMedia.map((item, index) => /* @__PURE__ */ jsx(MediaCard, { item, sizeClass: getMediaSizeClass(index, filteredMedia.length) }, item.id)) }) })
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          role: "tabpanel",
          className: `tab-pane fade ${activeMediaTab === "image_media" ? "in active" : ""}`,
          id: "image_media",
          children: /* @__PURE__ */ jsx("div", { className: "stm-medias-unit-wider", children: /* @__PURE__ */ jsx("div", { className: "stm-medias-unit clearfix", children: filteredMedia.filter((item) => item.type === "image").map((item, index) => /* @__PURE__ */ jsx(
            MediaCard,
            {
              item,
              sizeClass: getMediaSizeClass(index, filteredMedia.length)
            },
            item.id
          )) }) })
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          role: "tabpanel",
          className: `tab-pane fade ${activeMediaTab === "audio_media" ? "in active" : ""}`,
          id: "audio_media",
          children: /* @__PURE__ */ jsx("div", { className: "stm-medias-unit-wider", children: /* @__PURE__ */ jsx("div", { className: "stm-medias-unit clearfix", children: filteredMedia.filter((item) => item.type === "audio").map((item, index) => /* @__PURE__ */ jsx(
            MediaCard,
            {
              item,
              sizeClass: getMediaSizeClass(index, filteredMedia.length)
            },
            item.id
          )) }) })
        }
      )
    ] })
  ] });
}
function MediaCard({ item, sizeClass }) {
  const isAudio = item.type === "audio";
  const linkProps = isAudio ? {
    href: "#",
    "data-url": item.url,
    className: "stm-iframe",
    "data-fancybox-group": item.fancyboxGroup
  } : {
    href: item.url,
    className: "stm-fancybox",
    title: item.title,
    "data-fancybox-group": item.fancyboxGroup
  };
  return /* @__PURE__ */ jsx("div", { className: `${sizeClass} stm-media-single-unit stm-media-single-unit-${item.type}`, children: /* @__PURE__ */ jsx("div", { className: "stm-media-preview", children: /* @__PURE__ */ jsxs("a", { ...linkProps, children: [
    /* @__PURE__ */ jsx("img", { decoding: "async", src: item.thumbnail, alt: item.thumbnailAlt || item.title }),
    /* @__PURE__ */ jsx("div", { className: "icon" }),
    /* @__PURE__ */ jsx("div", { className: "title", children: item.title })
  ] }) }) });
}

const $$Astro = createAstro();
const $$FeatureGate = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$FeatureGate;
  const { feature, fallback = null } = Astro2.props;
  const isEnabled = isFeatureEnabled(feature);
  return renderTemplate`${isEnabled && renderTemplate`${renderSlot($$result, $$slots["default"])}`}${!isEnabled && fallback}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/components/FeatureGate.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a, _b;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate(_b || (_b = __template([" ", " ", '<a href="#main-content" class="skip-link">Skip to main content</a> <div id="wrapper"> ', " ", " ", ' <main id="main" role="main"> <!-- Hero Section: Post Slider --> ', " <!-- News Ticker Section --> ", " <!-- Marquee Matchup Section --> ", " <!-- Next Match Carousel Section --> ", " <!-- Latest News Section --> ", " <!-- Player of the Week Section --> ", " <!-- Stats Leaders Section --> ", " <!-- Statistics Section --> ", " <!-- Media Gallery Section --> ", " <!-- Sponsors Section --> ", " <!-- Registration CTA Section --> ", " </main> ", ` <div class="sp-footer-sponsors"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> </div>  <div class="rev-close-btn" aria-hidden="true"> <span class="close-left"></span> <span class="close-right"></span> </div>  <script type="speculationrules">
    {
      "prefetch": [
        {
          "source": "document",
          "where": {
            "and": [
              { "href_matches": "/*" },
              {
                "not": {
                  "href_matches": [
                    "/wp-*.php",
                    "/wp-admin/*",
                    "/wp-content/uploads/*",
                    "/wp-content/*",
                    "/wp-content/plugins/*",
                    "/wp-content/themes/elevate/*",
                    "/*\\\\?(.+)"
                  ]
                }
              },
              { "not": { "selector_matches": "a[rel~=\\"nofollow\\"]" } },
              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }
            ]
          },
          "eagerness": "conservative"
        }
      ]
    }
  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div>  <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header");
          var sponsors = $(".sp-header-sponsors");
          if (header.length && sponsors.length) {
            header.prepend(sponsors);
          }
        });
      }
    })();
  <\/script> <script>
    (function () {
      function maybePrefixUrlField() {
        const value = this.value.trim();
        if (value !== "" && value.indexOf("http") !== 0) {
          this.value = "http://" + value;
        }
      }

      const urlFields = document.querySelectorAll(
        '.mc4wp-form input[type="url"]'
      );
      for (let j = 0; j < urlFields.length; j++) {
        urlFields[j].addEventListener("blur", maybePrefixUrlField);
      }
    })();
  <\/script> <style type="text/css">
    /* Hide reCAPTCHA V3 badge */
    .grecaptcha-badge {
      visibility: hidden !important;
    }

    /* Landing Page Specific Styles */
    .hero-section {
      padding: 0;
    }

    .news-ticker-section {
      width: 100%;
    }

    .marquee-matchup-section {
      background-color: var(--color-gray-100, #f0f0f0);
    }

    .next-match-section {
      background: var(--color-accent-dark, #2d1e49) url('/images/basketball-game-concept-scaled.jpg') center center no-repeat;
      background-size: cover;
      position: relative;
      color: white;
    }

    .next-match-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(45, 30, 73, 0.8);
      z-index: 0;
    }

    .next-match-section > * {
      position: relative;
      z-index: 1;
    }

    .latest-news-section {
      background-color: var(--color-white, #ffffff);
    }

    .player-week-section {
      background-color: var(--color-white, #ffffff);
    }

    .stats-leaders-section {
      background-color: var(--color-white, #ffffff);
    }

    .stats-leaders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-8, 2rem);
      flex-wrap: wrap;
      gap: var(--spacing-4, 1rem);
    }

    .section-title {
      margin: 0;
    }

    .statistics-section {
      background-color: var(--color-secondary, #ffba00);
    }

    .media-gallery-section {
      background-color: var(--color-white, #ffffff);
    }

    .sponsors-section {
      background-color: var(--color-gray-100, #f2f4f7);
    }

    .registration-cta-section {
      background: var(--color-accent-dark, #301e48) url('/images/award.png') center center no-repeat;
      background-size: contain;
      position: relative;
      text-align: center;
      color: white;
    }

    .registration-cta-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .registration-title {
      font-size: clamp(2rem, 4vw + 1rem, 4.5rem);
      color: white;
      margin-bottom: var(--spacing-6, 1.5rem);
    }

    .registration-title a {
      color: white;
      text-decoration: none;
      transition: color var(--transition-base, 250ms);
    }

    .registration-title a:hover,
    .registration-title a:focus {
      color: var(--color-secondary, #ffba00);
    }

    .registration-description {
      font-size: var(--font-size-lg, 1.25rem);
      margin-bottom: var(--spacing-8, 2rem);
      color: rgba(255, 255, 255, 0.9);
    }

    .sp-footer-sponsors {
      background: #f4f4f4;
      color: #363f48;
    }
    .sp-footer-sponsors .sp-sponsors .sp-sponsors-title {
      color: #363f48;
    }

    /* Responsive Adjustments */
    @media (max-width: 768px) {
      .stats-leaders-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .registration-title {
        font-size: clamp(1.5rem, 5vw, 3rem);
      }
    }
  </style>  <link rel="stylesheet" id="stm_post_slider-css" href="/css/stm_post_slider.css" type="text/css" media="all"> <link rel="stylesheet" id="stm_next_match_carousel2-css" href="/css/stm_next_match_carousel2.css" type="text/css" media="all"> <link rel="stylesheet" id="stm_media_tabs_default-css" href="/css/stm_media_tabs_default.css" type="text/css" media="all"> <link rel="stylesheet" id="rs-plugin-settings-css" href="/css/rs6.css" type="text/css" media="all">  <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?ver=4.3.9" id="stm_gmap-js"><\/script> <script type="text/javascript" src="/js/jquery.min.js" id="jquery-core-js"><\/script> <script type="text/javascript" src="/js/jquery-migrate.min.js" id="jquery-migrate-js"><\/script> <script type="text/javascript" src="/js/perfect-scrollbar.min.js" id="perfect-scrollbar-js"><\/script> <script type="text/javascript" src="/js/bootstrap.min.js" id="bootstrap-js"><\/script> <script type="text/javascript" src="/js/select2.full.min.js" id="select2-js" defer="defer"><\/script> <script type="text/javascript" src="/js/owl.carousel.min.js" id="owl-carousel-js"><\/script> <script type="text/javascript" src="/js/jquery.fancybox.pack.js" id="fancybox-js"><\/script> <script type="text/javascript" src="/js/imagesloaded.min.js" id="imagesloaded-js"><\/script> <script type="text/javascript" src="/js/isotope.pkgd.min.js" id="isotope-js"><\/script> <script type="text/javascript" src="/js/waypoints.min.js" id="waypoint-js"><\/script> <script type="text/javascript" src="/js/jquery.counterup.min.js" id="counterup-js"><\/script> <script type="text/javascript" src="/js/lightbox.js" id="lightbox-js"><\/script> <script type="text/javascript" src="/js/splash.js" id="stm-theme-scripts-js"><\/script> <script type="text/javascript" src="/js/header.js" id="stm-theme-scripts-header-js"><\/script> <script type="text/javascript" src="/js/ticker_posts.js" id="stm-ticker-posts-js"><\/script> <script type="text/javascript" src="/js/ajax.submit.js" id="ajax-submit-js"><\/script> <script type="text/javascript" src="/js/hooks.min.js" id="wp-hooks-js"><\/script> <script type="text/javascript" src="/js/i18n.min.js" id="wp-i18n-js"><\/script> <script type="text/javascript" id="wp-i18n-js-after">
    /* <![CDATA[ */
    wp.i18n.setLocaleData({ "text direction\\u0004ltr": ["ltr"] });
    //# sourceURL=wp-i18n-js-after
    /* ]]> */
  <\/script> <script type="text/javascript" src="/js/index.js" id="swv-js"><\/script> <script type="text/javascript" id="contact-form-7-js-before">
    /* <![CDATA[ */
    var wpcf7 = {
      api: {
        root: "https:\\/\\/elevateballers.com\\/wp-json\\/",
        namespace: "contact-form-7\\/v1",
      },
    };
    //# sourceURL=contact-form-7-js-before
    /* ]]> */
  <\/script> <script type="text/javascript" src="/js/index_1.js" id="contact-form-7-js"><\/script> <script type="text/javascript" src="/js/rbtools.min.js" defer="" async="" id="tp-tools-js"><\/script> <script type="text/javascript" src="/js/rs6.min.js" defer="" async="" id="revmin-js"><\/script> <script type="text/javascript" src="/js/jquery.dataTables.min.js" id="jquery-datatables-js"><\/script> <script type="text/javascript" id="sportspress-js-extra">
    /* <![CDATA[ */
    var localized_strings = {
      days: "days",
      hrs: "hrs",
      mins: "mins",
      secs: "secs",
      previous: "Previous",
      next: "Next",
    };
    //# sourceURL=sportspress-js-extra
    /* ]]> */
  <\/script> <script type="text/javascript" src="/js/sportspress.js" id="sportspress-js"><\/script> <script type="text/javascript" src="/js/jquery.waypoints.min.js" id="jquery-waypoints-js"><\/script> <script type="text/javascript" src="/js/sportspress-match-stats.js" id="sportspress-match-stats-js"><\/script> <script type="text/javascript" src="/js/sportspress-scoreboard.js" id="sportspress-scoreboard-js"><\/script> <script type="text/javascript" src="/js/sportspress-sponsors.js" id="sportspress-sponsors-js"><\/script> <script type="text/javascript" src="/js/sportspress-tournaments.js" id="sportspress-tournaments-js"><\/script> <script type="text/javascript" src="/js/js_composer_front.min.js" id="wpb_composer_front_js-js"><\/script> <script type="text/javascript" src="/js/stm_post_slider.js" id="stm_post_slider-js"><\/script> <script type="text/javascript" id="stm_next_match_carousel2-js-extra">
    /* <![CDATA[ */
    var slides_ = { items: "1", navs_: "disable", dots_: "enable" };
    //# sourceURL=stm_next_match_carousel2-js-extra
    /* ]]> */
  <\/script> <script type="text/javascript" src="/js/stm_next_match_carousel2.js" id="stm_next_match_carousel2-js"><\/script> <script type="text/javascript" defer="" src="/js/forms.js" id="mc4wp-forms-api-js"><\/script> <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header-loaded");
          var menu = $(".sp-league-menu");
          if (header.length && menu.length) {
            header.prepend(menu);
          }
        });
      }
    })();
  <\/script> <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header-loaded");
          var scoreboard = $(".sp-header-scoreboard");
          if (header.length && scoreboard.length) {
            header.prepend(scoreboard);
          }
        });
      }
    })();
  <\/script> `], [" ", " ", '<a href="#main-content" class="skip-link">Skip to main content</a> <div id="wrapper"> ', " ", " ", ' <main id="main" role="main"> <!-- Hero Section: Post Slider --> ', " <!-- News Ticker Section --> ", " <!-- Marquee Matchup Section --> ", " <!-- Next Match Carousel Section --> ", " <!-- Latest News Section --> ", " <!-- Player of the Week Section --> ", " <!-- Stats Leaders Section --> ", " <!-- Statistics Section --> ", " <!-- Media Gallery Section --> ", " <!-- Sponsors Section --> ", " <!-- Registration CTA Section --> ", " </main> ", ` <div class="sp-footer-sponsors"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div> </div>  <div class="rev-close-btn" aria-hidden="true"> <span class="close-left"></span> <span class="close-right"></span> </div>  <script type="speculationrules">
    {
      "prefetch": [
        {
          "source": "document",
          "where": {
            "and": [
              { "href_matches": "/*" },
              {
                "not": {
                  "href_matches": [
                    "/wp-*.php",
                    "/wp-admin/*",
                    "/wp-content/uploads/*",
                    "/wp-content/*",
                    "/wp-content/plugins/*",
                    "/wp-content/themes/elevate/*",
                    "/*\\\\\\\\?(.+)"
                  ]
                }
              },
              { "not": { "selector_matches": "a[rel~=\\\\"nofollow\\\\"]" } },
              { "not": { "selector_matches": ".no-prefetch, .no-prefetch a" } }
            ]
          },
          "eagerness": "conservative"
        }
      ]
    }
  <\/script>  <div class="sp-header-sponsors" style="margin-top: 10px; margin-right: 10px;" aria-hidden="true"> <div class="sportspress"><div class="sp-sponsors"></div></div> </div>  <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header");
          var sponsors = $(".sp-header-sponsors");
          if (header.length && sponsors.length) {
            header.prepend(sponsors);
          }
        });
      }
    })();
  <\/script> <script>
    (function () {
      function maybePrefixUrlField() {
        const value = this.value.trim();
        if (value !== "" && value.indexOf("http") !== 0) {
          this.value = "http://" + value;
        }
      }

      const urlFields = document.querySelectorAll(
        '.mc4wp-form input[type="url"]'
      );
      for (let j = 0; j < urlFields.length; j++) {
        urlFields[j].addEventListener("blur", maybePrefixUrlField);
      }
    })();
  <\/script> <style type="text/css">
    /* Hide reCAPTCHA V3 badge */
    .grecaptcha-badge {
      visibility: hidden !important;
    }

    /* Landing Page Specific Styles */
    .hero-section {
      padding: 0;
    }

    .news-ticker-section {
      width: 100%;
    }

    .marquee-matchup-section {
      background-color: var(--color-gray-100, #f0f0f0);
    }

    .next-match-section {
      background: var(--color-accent-dark, #2d1e49) url('/images/basketball-game-concept-scaled.jpg') center center no-repeat;
      background-size: cover;
      position: relative;
      color: white;
    }

    .next-match-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(45, 30, 73, 0.8);
      z-index: 0;
    }

    .next-match-section > * {
      position: relative;
      z-index: 1;
    }

    .latest-news-section {
      background-color: var(--color-white, #ffffff);
    }

    .player-week-section {
      background-color: var(--color-white, #ffffff);
    }

    .stats-leaders-section {
      background-color: var(--color-white, #ffffff);
    }

    .stats-leaders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-8, 2rem);
      flex-wrap: wrap;
      gap: var(--spacing-4, 1rem);
    }

    .section-title {
      margin: 0;
    }

    .statistics-section {
      background-color: var(--color-secondary, #ffba00);
    }

    .media-gallery-section {
      background-color: var(--color-white, #ffffff);
    }

    .sponsors-section {
      background-color: var(--color-gray-100, #f2f4f7);
    }

    .registration-cta-section {
      background: var(--color-accent-dark, #301e48) url('/images/award.png') center center no-repeat;
      background-size: contain;
      position: relative;
      text-align: center;
      color: white;
    }

    .registration-cta-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .registration-title {
      font-size: clamp(2rem, 4vw + 1rem, 4.5rem);
      color: white;
      margin-bottom: var(--spacing-6, 1.5rem);
    }

    .registration-title a {
      color: white;
      text-decoration: none;
      transition: color var(--transition-base, 250ms);
    }

    .registration-title a:hover,
    .registration-title a:focus {
      color: var(--color-secondary, #ffba00);
    }

    .registration-description {
      font-size: var(--font-size-lg, 1.25rem);
      margin-bottom: var(--spacing-8, 2rem);
      color: rgba(255, 255, 255, 0.9);
    }

    .sp-footer-sponsors {
      background: #f4f4f4;
      color: #363f48;
    }
    .sp-footer-sponsors .sp-sponsors .sp-sponsors-title {
      color: #363f48;
    }

    /* Responsive Adjustments */
    @media (max-width: 768px) {
      .stats-leaders-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .registration-title {
        font-size: clamp(1.5rem, 5vw, 3rem);
      }
    }
  </style>  <link rel="stylesheet" id="stm_post_slider-css" href="/css/stm_post_slider.css" type="text/css" media="all"> <link rel="stylesheet" id="stm_next_match_carousel2-css" href="/css/stm_next_match_carousel2.css" type="text/css" media="all"> <link rel="stylesheet" id="stm_media_tabs_default-css" href="/css/stm_media_tabs_default.css" type="text/css" media="all"> <link rel="stylesheet" id="rs-plugin-settings-css" href="/css/rs6.css" type="text/css" media="all">  <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?ver=4.3.9" id="stm_gmap-js"><\/script> <script type="text/javascript" src="/js/jquery.min.js" id="jquery-core-js"><\/script> <script type="text/javascript" src="/js/jquery-migrate.min.js" id="jquery-migrate-js"><\/script> <script type="text/javascript" src="/js/perfect-scrollbar.min.js" id="perfect-scrollbar-js"><\/script> <script type="text/javascript" src="/js/bootstrap.min.js" id="bootstrap-js"><\/script> <script type="text/javascript" src="/js/select2.full.min.js" id="select2-js" defer="defer"><\/script> <script type="text/javascript" src="/js/owl.carousel.min.js" id="owl-carousel-js"><\/script> <script type="text/javascript" src="/js/jquery.fancybox.pack.js" id="fancybox-js"><\/script> <script type="text/javascript" src="/js/imagesloaded.min.js" id="imagesloaded-js"><\/script> <script type="text/javascript" src="/js/isotope.pkgd.min.js" id="isotope-js"><\/script> <script type="text/javascript" src="/js/waypoints.min.js" id="waypoint-js"><\/script> <script type="text/javascript" src="/js/jquery.counterup.min.js" id="counterup-js"><\/script> <script type="text/javascript" src="/js/lightbox.js" id="lightbox-js"><\/script> <script type="text/javascript" src="/js/splash.js" id="stm-theme-scripts-js"><\/script> <script type="text/javascript" src="/js/header.js" id="stm-theme-scripts-header-js"><\/script> <script type="text/javascript" src="/js/ticker_posts.js" id="stm-ticker-posts-js"><\/script> <script type="text/javascript" src="/js/ajax.submit.js" id="ajax-submit-js"><\/script> <script type="text/javascript" src="/js/hooks.min.js" id="wp-hooks-js"><\/script> <script type="text/javascript" src="/js/i18n.min.js" id="wp-i18n-js"><\/script> <script type="text/javascript" id="wp-i18n-js-after">
    /* <![CDATA[ */
    wp.i18n.setLocaleData({ "text direction\\\\u0004ltr": ["ltr"] });
    //# sourceURL=wp-i18n-js-after
    /* ]]> */
  <\/script> <script type="text/javascript" src="/js/index.js" id="swv-js"><\/script> <script type="text/javascript" id="contact-form-7-js-before">
    /* <![CDATA[ */
    var wpcf7 = {
      api: {
        root: "https:\\\\/\\\\/elevateballers.com\\\\/wp-json\\\\/",
        namespace: "contact-form-7\\\\/v1",
      },
    };
    //# sourceURL=contact-form-7-js-before
    /* ]]> */
  <\/script> <script type="text/javascript" src="/js/index_1.js" id="contact-form-7-js"><\/script> <script type="text/javascript" src="/js/rbtools.min.js" defer="" async="" id="tp-tools-js"><\/script> <script type="text/javascript" src="/js/rs6.min.js" defer="" async="" id="revmin-js"><\/script> <script type="text/javascript" src="/js/jquery.dataTables.min.js" id="jquery-datatables-js"><\/script> <script type="text/javascript" id="sportspress-js-extra">
    /* <![CDATA[ */
    var localized_strings = {
      days: "days",
      hrs: "hrs",
      mins: "mins",
      secs: "secs",
      previous: "Previous",
      next: "Next",
    };
    //# sourceURL=sportspress-js-extra
    /* ]]> */
  <\/script> <script type="text/javascript" src="/js/sportspress.js" id="sportspress-js"><\/script> <script type="text/javascript" src="/js/jquery.waypoints.min.js" id="jquery-waypoints-js"><\/script> <script type="text/javascript" src="/js/sportspress-match-stats.js" id="sportspress-match-stats-js"><\/script> <script type="text/javascript" src="/js/sportspress-scoreboard.js" id="sportspress-scoreboard-js"><\/script> <script type="text/javascript" src="/js/sportspress-sponsors.js" id="sportspress-sponsors-js"><\/script> <script type="text/javascript" src="/js/sportspress-tournaments.js" id="sportspress-tournaments-js"><\/script> <script type="text/javascript" src="/js/js_composer_front.min.js" id="wpb_composer_front_js-js"><\/script> <script type="text/javascript" src="/js/stm_post_slider.js" id="stm_post_slider-js"><\/script> <script type="text/javascript" id="stm_next_match_carousel2-js-extra">
    /* <![CDATA[ */
    var slides_ = { items: "1", navs_: "disable", dots_: "enable" };
    //# sourceURL=stm_next_match_carousel2-js-extra
    /* ]]> */
  <\/script> <script type="text/javascript" src="/js/stm_next_match_carousel2.js" id="stm_next_match_carousel2-js"><\/script> <script type="text/javascript" defer="" src="/js/forms.js" id="mc4wp-forms-api-js"><\/script> <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header-loaded");
          var menu = $(".sp-league-menu");
          if (header.length && menu.length) {
            header.prepend(menu);
          }
        });
      }
    })();
  <\/script> <script type="text/javascript">
    (function() {
      if (typeof jQuery !== 'undefined') {
        jQuery(document).ready(function ($) {
          var header = $(".sp-header-loaded");
          var scoreboard = $(".sp-header-scoreboard");
          if (header.length && scoreboard.length) {
            header.prepend(scoreboard);
          }
        });
      }
    })();
  <\/script> `])), renderComponent($$result2, "PageLoader", PageLoader, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/components/PageLoader", "client:component-export": "default" }), maybeRenderHead(), isFeatureEnabled("layout.topbar") && renderTemplate`${renderComponent($$result2, "TopBar", $$TopBar, {})}`, isFeatureEnabled("layout.header") && renderTemplate`${renderComponent($$result2, "Header", $$Header, {})}`, isFeatureEnabled("layout.mobileMenu") && renderTemplate`${renderComponent($$result2, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/layout/components/MobileMenu", "client:component-export": "default" })}`, renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.postSlider" }, { "default": ($$result3) => renderTemplate` <section class="hero-section" aria-label="Featured content"> <div class="container"> ${renderComponent($$result3, "PostSlider", PostSlider, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/home/components/PostSlider", "client:component-export": "default" })} </div> </section> ` }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.newsTicker" }, { "default": ($$result3) => renderTemplate` <section class="news-ticker-section" aria-label="Latest news ticker"> ${renderComponent($$result3, "NewsTicker", NewsTicker, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/home/components/NewsTicker", "client:component-export": "default" })} </section> ` }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.marqueeMatchup" }, { "default": ($$result3) => renderTemplate` <section class="marquee-matchup-section section" aria-label="Featured match"> <div class="container"> ${renderComponent($$result3, "MarqueeMatchup", $$MarqueeMatchup, {})} </div> </section> ` }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.nextMatchCarousel" }, { "default": ($$result3) => renderTemplate` <section class="next-match-section section" aria-label="Upcoming matches"> <div class="container"> ${renderComponent($$result3, "NextMatchCarousel", NextMatchCarousel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/home/components/NextMatchCarousel", "client:component-export": "default" })} </div> </section> ` }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.latestNews" }, { "default": ($$result3) => renderTemplate` <section class="latest-news-section section" id="main-content" aria-label="Latest news"> <div class="container"> ${renderComponent($$result3, "LatestNews", LatestNews, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/home/components/LatestNews", "client:component-export": "default" })} </div> </section> ` }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.playerOfTheWeek" }, { "default": ($$result3) => renderTemplate` <section class="player-week-section section" aria-label="Player of the week"> <div class="container"> ${renderComponent($$result3, "PlayerOfTheWeek", $$PlayerOfTheWeek, {})} </div> </section> ` }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.statsLeaders" }, { "default": ($$result3) => renderTemplate(_a || (_a = __template([` <section class="stats-leaders-section section" aria-label="Statistics and leaders"> <div class="container"> <div class="stats-leaders-header"> <h2 class="section-title">Stats Leaders</h2> <a href="http://elevateballers.com/stats/" class="btn btn-primary btn-lg" title="View all statistics">
View All Stats
</a> </div> <!-- Stats Players Carousel - Legacy support --> <div class="stats-players-wrapper"> <div class="stm-player-ids style_2 stm-players-5715 carousel_yes"> <div class="clearfix"> <div class="stm-carousel-controls-center"> <button class="stm-carousel-control-prev" aria-label="Previous players" type="button"> <i class="fa fa-angle-left" aria-hidden="true"></i> </button> <button class="stm-carousel-control-next" aria-label="Next players" type="button"> <i class="fa fa-angle-right" aria-hidden="true"></i> </button> </div> </div> <div class="stm-player-list-wrapper"> <div class="stm-players clearfix"></div> </div> </div> </div> <script type="text/javascript">
            (function () {
              "use strict";
              if (typeof jQuery === 'undefined') return;
              var $ = jQuery;
              var unique_class = "stm-players-5715";
              var owl = $("." + unique_class + " .stm-players");
              if (!owl.length) return;
              $(document).ready(function () {
                initOwl(owl, unique_class);
                var tm = null;
                $(".vc_tta-tab").on("click", function () {
                  var tabId = $(this).find("a").attr("href");
                  var owlTab = $(tabId + " .stm-players");
                  if (tm) clearTimeout(tm);
                  tm = setTimeout(function () {
                    initOwl(owlTab, tabId);
                    owlTab.trigger("destroy.owl.carousel");
                    owlTab
                      .html(
                        owlTab.find(".owl-stage-outer").html()
                      )
                      .removeClass("owl-loaded");
                    initOwl(owlTab, tabId);
                  }, 200);
                });

                function initOwl(owl, uniqId) {
                  owl.owlCarousel({
                    items: 4,
                    dots: false,
                    autoplay: false,
                    slideBy: 4,
                    loop: true,
                    responsive: {
                      0: {
                        items: 1,
                        slideBy: 1,
                      },
                      440: {
                        items: 2,
                        slideBy: 2,
                      },
                      768: {
                        items: 3,
                        slideBy: 3,
                      },
                      992: {
                        items: 3,
                        slideBy: 3,
                      },
                      1100: {
                        items: 4,
                        slideBy: 4,
                      },
                    },
                  });
                  $(
                    "." +
                      unique_class +
                      " .stm-carousel-control-prev"
                  ).on("click", function () {
                    owl.trigger("prev.owl.carousel");
                  });
                  $(
                    "." +
                      unique_class +
                      " .stm-carousel-control-next"
                  ).on("click", function () {
                    owl.trigger("next.owl.carousel");
                  });
                }
              });
            })();
          <\/script> </div> </section> `]))) }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.statsSection" }, { "default": ($$result3) => renderTemplate` <section class="statistics-section section" aria-label="League statistics"> <div class="container"> ${renderComponent($$result3, "StatsSection", $$StatsSection, {})} </div> </section> ` }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.mediaGallery" }, { "default": ($$result3) => renderTemplate` <section class="media-gallery-section section" aria-label="Media gallery"> <div class="container"> ${renderComponent($$result3, "MediaGallery", MediaGallery, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/media/components/MediaGallery", "client:component-export": "default" })} </div> </section> ` }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.sponsors" }, { "default": ($$result3) => renderTemplate` <section class="sponsors-section section" aria-label="Our sponsors"> <div class="container"> ${renderComponent($$result3, "Sponsors", Sponsors, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/User/Desktop/projects/elevateballers/src/features/home/components/Sponsors", "client:component-export": "default" })} </div> </section> ` }), renderComponent($$result2, "FeatureGate", $$FeatureGate, { "feature": "home.registrationCta" }, { "default": ($$result3) => renderTemplate` <section class="registration-cta-section section" aria-label="Join the league"> <div class="container"> <div class="registration-cta-content"> <h2 class="registration-title"> <a href="https://elevateballers.com/registration-test/" title="Register to Join the League">
Register to Join the League
</a> </h2> <p class="registration-description">
Be part of the premier basketball league. Join us today and elevate your game!
</p> <a class="btn btn-secondary btn-lg" href="http://elevateballers.com/registration-test" title="Join Us">
Join Us
</a> </div> </div> </section> ` }), isFeatureEnabled("layout.footer") && renderTemplate`${renderComponent($$result2, "Footer", $$Footer, {})}`) })}`;
}, "C:/Users/User/Desktop/projects/elevateballers/src/pages/index.astro", void 0);

const $$file = "C:/Users/User/Desktop/projects/elevateballers/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
