const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
const FEATURE_FLAGS_CONFIG = {
  // Layout features
  "layout.topbar": {
    key: "layout.topbar",
    defaultEnabled: true,
    description: "Top navigation bar with login/signup and social links",
    category: "layout"
  },
  "layout.header": {
    key: "layout.header",
    defaultEnabled: true,
    description: "Main header with logo and navigation menu",
    category: "layout"
  },
  "layout.footer": {
    key: "layout.footer",
    defaultEnabled: true,
    description: "Footer with contact info and newsletter",
    category: "layout"
  },
  "layout.mobileMenu": {
    key: "layout.mobileMenu",
    defaultEnabled: true,
    description: "Mobile navigation menu",
    category: "layout"
  },
  // Homepage features
  "home.postSlider": {
    key: "home.postSlider",
    defaultEnabled: true,
    description: "Hero post slider carousel",
    category: "homepage"
  },
  "home.newsTicker": {
    key: "home.newsTicker",
    defaultEnabled: true,
    description: "Scrolling news ticker",
    category: "homepage"
  },
  "home.marqueeMatchup": {
    key: "home.marqueeMatchup",
    defaultEnabled: true,
    description: "Featured match display",
    category: "homepage"
  },
  "home.nextMatchCarousel": {
    key: "home.nextMatchCarousel",
    defaultEnabled: true,
    description: "Upcoming matches carousel",
    category: "homepage"
  },
  "home.latestNews": {
    key: "home.latestNews",
    defaultEnabled: true,
    description: "Latest news grid with category filtering",
    category: "homepage"
  },
  "home.playerOfTheWeek": {
    key: "home.playerOfTheWeek",
    defaultEnabled: true,
    description: "Player of the week showcase",
    category: "homepage"
  },
  "home.statsSection": {
    key: "home.statsSection",
    defaultEnabled: true,
    description: "League statistics section",
    category: "homepage"
  },
  "home.statsLeaders": {
    key: "home.statsLeaders",
    defaultEnabled: true,
    description: "Stats leaders carousel",
    category: "homepage"
  },
  "home.mediaGallery": {
    key: "home.mediaGallery",
    defaultEnabled: true,
    description: "Media gallery section",
    category: "homepage"
  },
  "home.sponsors": {
    key: "home.sponsors",
    defaultEnabled: true,
    description: "Sponsors carousel",
    category: "homepage"
  },
  "home.registrationCta": {
    key: "home.registrationCta",
    defaultEnabled: true,
    description: "Registration call-to-action section",
    category: "homepage"
  },
  // Feature modules
  "module.news": {
    key: "module.news",
    defaultEnabled: true,
    description: "News articles and blog functionality",
    category: "module"
  },
  "module.matches": {
    key: "module.matches",
    defaultEnabled: true,
    description: "Match fixtures and results",
    category: "module"
  },
  "module.players": {
    key: "module.players",
    defaultEnabled: true,
    description: "Player profiles and directory",
    category: "module"
  },
  "module.standings": {
    key: "module.standings",
    defaultEnabled: true,
    description: "League standings and rankings",
    category: "module"
  },
  "module.media": {
    key: "module.media",
    defaultEnabled: true,
    description: "Media gallery functionality",
    category: "module"
  },
  "module.team": {
    key: "module.team",
    defaultEnabled: true,
    description: "Team pages and profiles",
    category: "module"
  },
  "module.registration": {
    key: "module.registration",
    defaultEnabled: true,
    description: "League registration functionality",
    category: "module"
  },
  "module.comments": {
    key: "module.comments",
    defaultEnabled: true,
    description: "Comments system",
    category: "module"
  },
  "module.cms": {
    key: "module.cms",
    defaultEnabled: true,
    description: "Content Management System",
    category: "module"
  },
  // CMS sub-features
  "cms.news": {
    key: "cms.news",
    defaultEnabled: true,
    description: "CMS: News article management",
    category: "cms"
  },
  "cms.matches": {
    key: "cms.matches",
    defaultEnabled: true,
    description: "CMS: Match management",
    category: "cms"
  },
  "cms.players": {
    key: "cms.players",
    defaultEnabled: true,
    description: "CMS: Player management",
    category: "cms"
  },
  "cms.media": {
    key: "cms.media",
    defaultEnabled: true,
    description: "CMS: Media management",
    category: "cms"
  },
  "cms.teams": {
    key: "cms.teams",
    defaultEnabled: true,
    description: "CMS: Team management",
    category: "cms"
  },
  "cms.seasons": {
    key: "cms.seasons",
    defaultEnabled: true,
    description: "CMS: Season management",
    category: "cms"
  },
  "cms.leagues": {
    key: "cms.leagues",
    defaultEnabled: true,
    description: "CMS: League management",
    category: "cms"
  },
  "cms.staff": {
    key: "cms.staff",
    defaultEnabled: true,
    description: "CMS: Staff management",
    category: "cms"
  }
};
function parseEnvBoolean(value, defaultValue) {
  if (!value) return defaultValue;
  const normalized = value.toLowerCase().trim();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}
function getFeatureFlagFromEnv(flag) {
  const envKey = `FEATURE_FLAG_${flag.toUpperCase().replace(/\./g, "_")}`;
  const envValue = Object.assign(__vite_import_meta_env__, {})[envKey];
  if (envValue === void 0) return null;
  return parseEnvBoolean(envValue, true);
}
function getFeatureFlagsFromEnv() {
  const flags = {};
  const jsonConfig = Object.assign(__vite_import_meta_env__, {}).FEATURE_FLAGS;
  if (jsonConfig) {
    try {
      const parsed = typeof jsonConfig === "string" ? JSON.parse(jsonConfig) : jsonConfig;
      Object.entries(parsed).forEach(([key, value]) => {
        if (key in FEATURE_FLAGS_CONFIG) {
          flags[key] = parseEnvBoolean(String(value), true);
        }
      });
      return flags;
    } catch (error) {
      console.warn("Failed to parse FEATURE_FLAGS JSON:", error);
    }
  }
  Object.keys(FEATURE_FLAGS_CONFIG).forEach((flag) => {
    const envValue = getFeatureFlagFromEnv(flag);
    if (envValue !== null) {
      flags[flag] = envValue;
    }
  });
  return flags;
}
let featureFlagsCache = null;
function getFeatureFlags(forceRefresh = false) {
  if (featureFlagsCache && !forceRefresh) {
    return featureFlagsCache;
  }
  const envFlags = getFeatureFlagsFromEnv();
  const flags = {};
  Object.entries(FEATURE_FLAGS_CONFIG).forEach(([key, config]) => {
    flags[key] = envFlags[key] ?? config.defaultEnabled;
  });
  featureFlagsCache = flags;
  return flags;
}
function isFeatureEnabled(flag) {
  const flags = getFeatureFlags();
  return flags[flag] ?? false;
}

export { getFeatureFlags as g, isFeatureEnabled as i };
