import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import mantine from "@mantine/core/styles.css?url";
import notifications from "@mantine/notifications/styles.css?url";
import carousel from "@mantine/carousel/styles.css?url";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import type { Route } from "./+types/root";
import { useEffect } from "react";
import { MantineProvider } from "@mantine/core";
import { createThemeWithColor } from "./lib/theme";
import PageLoader from "./shared/PageLoader";
import { useAuth } from "./lib/hooks/useAuth";
import { createClient } from "@supabase/supabase-js";
import type { Model } from "./lib/stores/generateStore";
import { Notifications } from "@mantine/notifications";
import { PWAInstallPrompt } from "./shared/PWAInstallPrompt";

// Function to fetch all models from Supabase
async function getModels(supabaseClient: any): Promise<Model[]> {
  try {
    const { data, error } = await supabaseClient
      .from("models")
      .select(
        `
        *,
        brands (
          id,
          name,
          logo
        ),
        api(schema,pricing)
      `
      )
      .neq("status", false);

    if (error) {
      console.error("Error fetching models:", error);
      return [];
    }

    // Filter out any null or invalid models
    const validModels = (data || []).filter(
      (model) => model && model.id && model.name && model.generation_type
    );

    // Sort models by generation_type first, then by brand_id (from brands relationship)
    const sortedModels = validModels.sort((a, b) => {
      // First sort by generation_type
      const typeComparison = (a.generation_type || "").localeCompare(b.generation_type || "");
      if (typeComparison !== 0) {
        return typeComparison;
      }
      // If generation_type is the same, sort by brand_id
      // brand_id might be on the model directly or in brands.id
      const brandIdA = a.brand_id || a.brands?.id || "";
      const brandIdB = b.brand_id || b.brands?.id || "";
      return brandIdA.localeCompare(brandIdB);
    });

    return sortedModels;
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
}

export const loader = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  // Create server client using service role key for server-side operations
  const supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const loaderModels = await getModels(supabaseClient);
  return { loaderModels };
};

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
  const { appLoading, setIsMobile } = useAppStore();
  const { setModels } = useGenerateStore();
  const { loaderModels } = useLoaderData<typeof loader>();

  useAuth();

  // Detect mobile screen size and update store
  useEffect(() => {
    const checkIsMobile = () => {
      const isMobile = window.innerWidth < 992;
      setIsMobile(isMobile);
    };
    // Check on mount
    checkIsMobile();
    // Add resize listener
    window.addEventListener("resize", checkIsMobile);
    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [setIsMobile]);

  useEffect(() => {
    if (loaderModels) {
      setModels(loaderModels);
    }
  }, [loaderModels, setModels]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta
          name="description"
          content="A modern generative AI application for creating stunning images and videos using the latest AI models"
        />
        <meta name="theme-color" content="#00b8d4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Genny" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#00b8d4" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <Meta />
        <Links />
        <link rel="stylesheet" href={mantine} />
        <link rel="stylesheet" href={notifications} />
        <link rel="stylesheet" href={carousel} />
        <script src="https://accounts.google.com/gsi/client" async></script>
      </head>
      <body>
        <DynamicThemeProvider>
          {appLoading ? <PageLoader /> : children}
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
