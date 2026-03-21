import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import mantine from "@mantine/core/styles.css?url";
import notifications from "@mantine/notifications/styles.css?url";
import carousel from "@mantine/carousel/styles.css?url";
import globalStyles from "./global.css?url";
import useAppStore from "~/lib/stores/appStore";
import { useEffect } from "react";
import { MantineProvider } from "@mantine/core";
import { createThemeWithColor } from "./lib/theme";
import { useAuth } from "./lib/hooks/useAuth";
import { Notifications } from "@mantine/notifications";
import { PWAInstallPrompt } from "./shared/PWAInstallPrompt";
import type { Route } from "./+types/root";

function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeColor, setThemeColor } = useAppStore();

  // Load theme settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("themeSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.themeColor && settings.themeColor !== themeColor) {
          setThemeColor(settings.themeColor);
        }
      } catch (error) {
        console.error("Error loading theme settings:", error);
      }
    }
  }, []);

  const dynamicTheme = createThemeWithColor(themeColor);

  return (
    <MantineProvider theme={dynamicTheme} defaultColorScheme="dark">
      <Notifications />
      {children}
    </MantineProvider>
  );
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Lilita+One&display=swap",
  },
  {
    rel: "preconnect",
    href: "https://accounts.google.com/gsi/client",
  },
  { rel: "manifest", href: "/manifest.json" },
  { rel: "apple-touch-icon", href: "/icons/icon-192x192.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { setIsMobile } = useAppStore();
  useAuth();

  // Detect mobile screen size and update store
  useEffect(() => {
    const checkIsMobile = () => {
      const isMobile = window.innerWidth < 992;
      setIsMobile(isMobile);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [setIsMobile]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta
          name="description"
          content="A modern generative AI application for creating stunning images and videos using the latest AI models"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Genny" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <Meta />
        <Links />
        <link rel="stylesheet" href={mantine} />
        <link rel="stylesheet" href={notifications} />
        <link rel="stylesheet" href={carousel} />
        <link rel="stylesheet" href={globalStyles} />
        <script src="https://accounts.google.com/gsi/client" async></script>
      </head>
      <body>
        <DynamicThemeProvider>
          {children}
          <PWAInstallPrompt />
        </DynamicThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
