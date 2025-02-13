type shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type Theme = {
  // Colors
  accent: string;
  darkSlate: {
    [key in shade]: string;
  };
  lightSlate: {
    [key in shade]: string;
  };
  lightGray: {
    [key in shade]: string;
  };
  darkGray: {
    [key in shade]: string;
  };
  primary: {
    [key in shade]: string;
  };
  red: {
    [key in shade]: string;
  };
  yellow: {
    [key in shade]: string;
  };
  green: {
    [key in shade]: string;
  };
  brands: {
    [key: string]: string;
  };
};

const theme = {
  colors: {
    accent: "var(--accent)",
    darkSlate: {
      50: "var(--darkSlate-50)",
      100: "var(--darkSlate-100)",
      200: "var(--darkSlate-200)",
      300: "var(--darkSlate-300)",
      400: "var(--darkSlate-400)",
      500: "var(--darkSlate-500)",
      600: "var(--darkSlate-600)",
      700: "var(--darkSlate-700)",
      800: "var(--darkSlate-800)",
      900: "var(--darkSlate-900)",
    },
    lightSlate: {
      50: "var(--lightSlate-50)",
      100: "var(--lightSlate-100)",
      200: "var(--lightSlate-200)",
      300: "var(--lightSlate-300)",
      400: "var(--lightSlate-400)",
      500: "var(--lightSlate-500)",
      600: "var(--lightSlate-600)",
      700: "var(--lightSlate-700)",
      800: "var(--lightSlate-800)",
      900: "var(--lightSlate-900)",
    },
    darkGray: {
      50: "var(--darkGray-50)",
      100: "var(--darkGray-100)",
      200: "var(--darkGray-200)",
      300: "var(--darkGray-300)",
      400: "var(--darkGray-400)",
      500: "var(--darkGray-500)",
      600: "var(--darkGray-600)",
      700: "var(--darkGray-700)",
      800: "var(--darkGray-800)",
      900: "var(--darkGray-900)",
    },
    lightGray: {
      50: "var(--lightGray-50)",
      100: "var(--lightGray-100)",
      200: "var(--lightGray-200)",
      300: "var(--lightGray-300)",
      400: "var(--lightGray-400)",
      500: "var(--lightGray-500)",
      600: "var(--lightGray-600)",
      700: "var(--lightGray-700)",
      800: "var(--lightGray-800)",
      900: "var(--lightGray-900)",
    },
    primary: {
      50: "var(--primary-50)",
      100: "var(--primary-100)",
      200: "var(--primary-200)",
      300: "var(--primary-300)",
      400: "var(--primary-400)",
      500: "var(--primary-500)",
      600: "var(--primary-600)",
      700: "var(--primary-700)",
      800: "var(--primary-800)",
      900: "var(--primary-900)",
    },
    red: {
      50: "var(--red-50)",
      100: "var(--red-100)",
      200: "var(--red-200)",
      300: "var(--red-300)",
      400: "var(--red-400)",
      500: "var(--red-500)",
      600: "var(--red-600)",
      700: "var(--red-700)",
      800: "var(--red-800)",
      900: "var(--red-900)",
    },
    yellow: {
      50: "var(--yellow-50)",
      100: "var(--yellow-100)",
      200: "var(--yellow-200)",
      300: "var(--yellow-300)",
      400: "var(--yellow-400)",
      500: "var(--yellow-500)",
      600: "var(--yellow-600)",
      700: "var(--yellow-700)",
      800: "var(--yellow-800)",
      900: "var(--yellow-900)",
    },
    green: {
      50: "var(--green-50)",
      100: "var(--green-100)",
      200: "var(--green-200)",
      300: "var(--green-300)",
      400: "var(--green-400)",
      500: "var(--green-500)",
      600: "var(--green-600)",
      700: "var(--green-700)",
      800: "var(--green-800)",
      900: "var(--green-900)",
    },
    brands: {
      curseforge: "var(--brands-curseforge)",
      modrinth: "var(--brands-modrinth)",
      twitchPurpleDark: "var(--brands-twitchPurpleDark)",
      twitchPurpleLight: "var(--brands-twitchPurpleLight)",
      twitchBlack: "var(--brands-twitchBlack)",
      twitchWhite: "var(--brands-twitchWhite)",
    },
    // TODO: Move satisfies to the entire theme when possible
  } satisfies Theme,
  animation: {
    keyframes: {
      loadingbar:
        "{ 0% { transform: translateX(0) scaleX(0); } 40% { transform: translateX(0) scaleX(0.4); } 100% { transform: translateX(100%) scaleX(0.5); } }",
      enterScaleIn:
        "{ 0% { transform: scale(.9); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }",
      scaleBounce:
        "{ 0% { transform: scale(1); } 50% { transform: scale(0); } 70% { transform: scale(1); } 85% { transform: scale(1.2); } 100% { transform: scale(1); } }",
      wiggle:
        "{ 0% { transform: rotate(0deg); } 25% { transform: rotate(10deg); } 50% { transform: rotate(-10deg); } 75% { transform: rotate(5deg); } 100% { transform: rotate(0deg); } }",
    },

    durations: {
      loadingbar: "1s",
      enterScaleIn: "200ms",
      scaleBounce: "600ms",
      wiggle: "300ms",
    },
    timingFns: {
      loadingbar: "linear",
      enterScaleIn: "ease-in-out",
      scaleBounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      wiggles: "ease-in-out",
    },
    counts: { loadingbar: "infinite" },
  },
  screens: {
    xs: { max: "800px" }, // For the condition width <= 800
    sm: { max: "999px" }, // For the condition width < 1000
    md: { max: "1499px" }, // For the condition width < 1500
    // Any width >= 1500 will be considered the default or 'lg' scenario
  },
};

export { theme };
