import { Carousel } from "@mantine/carousel";
import { Avatar, Box, Center, Stack, Text, Title } from "@mantine/core";
import React, { useEffect, useMemo, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import useAppStore from "~/lib/stores/appStore";

type Tool = {
  name: string;
  slug: string;
  logo: string | null;
};

// Provided JSON (trimmed to the fields we need for the UI)
const TOOLS: Tool[] = [
  { name: "Gmail", slug: "gmail", logo: "https://logos.composio.dev/api/gmail" },
  { name: "Composio", slug: "composio", logo: "https://logos.composio.dev/api/composio" },
  { name: "GitHub", slug: "github", logo: "https://logos.composio.dev/api/github" },
  {
    name: "Google Calendar",
    slug: "googlecalendar",
    logo: "https://logos.composio.dev/api/googlecalendar",
  },
  { name: "Notion", slug: "notion", logo: "https://logos.composio.dev/api/notion" },
  {
    name: "Google Sheets",
    slug: "googlesheets",
    logo: "https://logos.composio.dev/api/googlesheets",
  },
  { name: "Slack", slug: "slack", logo: "https://logos.composio.dev/api/slack" },
  { name: "Supabase", slug: "supabase", logo: "https://logos.composio.dev/api/supabase" },
  { name: "Outlook", slug: "outlook", logo: "https://logos.composio.dev/api/outlook" },
  {
    name: "Perplexity AI",
    slug: "perplexityai",
    logo: "https://logos.composio.dev/api/perplexityai",
  },
  { name: "Twitter", slug: "twitter", logo: "https://logos.composio.dev/api/twitter" },
  { name: "Google Drive", slug: "googledrive", logo: "https://logos.composio.dev/api/googledrive" },
  { name: "Google Docs", slug: "googledocs", logo: "https://logos.composio.dev/api/googledocs" },
  { name: "HubSpot", slug: "hubspot", logo: "https://logos.composio.dev/api/hubspot" },
  { name: "Linear", slug: "linear", logo: "https://logos.composio.dev/api/linear" },
  { name: "Airtable", slug: "airtable", logo: "https://logos.composio.dev/api/airtable" },
  {
    name: "Code Interpreter",
    slug: "codeinterpreter",
    logo: "https://logos.composio.dev/api/codeinterpreter",
  },
  { name: "SerpApi", slug: "serpapi", logo: "https://logos.composio.dev/api/serpapi" },
  { name: "Jira", slug: "jira", logo: "https://logos.composio.dev/api/jira" },
  { name: "Firecrawl", slug: "firecrawl", logo: "https://logos.composio.dev/api/firecrawl" },
  { name: "Tavily", slug: "tavily", logo: "https://logos.composio.dev/api/tavily" },
  { name: "YouTube", slug: "youtube", logo: "https://logos.composio.dev/api/youtube" },
  { name: "Slackbot", slug: "slackbot", logo: "https://logos.composio.dev/api/slackbot" },
  { name: "Canvas", slug: "canvas", logo: "https://logos.composio.dev/api/canvas" },
  { name: "Bitbucket", slug: "bitbucket", logo: "https://logos.composio.dev/api/bitbucket" },
  { name: "Google Tasks", slug: "googletasks", logo: "https://logos.composio.dev/api/googletasks" },
  { name: "Discord", slug: "discord", logo: "https://logos.composio.dev/api/discord" },
  { name: "Figma", slug: "figma", logo: "https://logos.composio.dev/api/figma" },
  {
    name: "Composio Search",
    slug: "composio_search",
    logo: "https://logos.composio.dev/api/composio_search",
  },
  { name: "Reddit", slug: "reddit", logo: "https://logos.composio.dev/api/reddit" },
  { name: "Cal", slug: "cal", logo: "https://logos.composio.dev/api/cal" },
  { name: "Wrike", slug: "wrike", logo: "https://logos.composio.dev/api/wrike" },
  { name: "Exa", slug: "exa", logo: "https://logos.composio.dev/api/exa" },
  { name: "Sentry", slug: "sentry", logo: "https://logos.composio.dev/api/sentry" },
  { name: "Snowflake", slug: "snowflake", logo: "https://logos.composio.dev/api/snowflake" },
  { name: "Hacker News", slug: "hackernews", logo: "https://logos.composio.dev/api/hackernews" },
  { name: "ElevenLabs", slug: "elevenlabs", logo: "https://logos.composio.dev/api/elevenlabs" },
  {
    name: "Microsoft Teams",
    slug: "microsoft_teams",
    logo: "https://logos.composio.dev/api/microsoft_teams",
  },
  { name: "Asana", slug: "asana", logo: "https://logos.composio.dev/api/asana" },
  {
    name: "People Data Labs",
    slug: "peopledatalabs",
    logo: "https://logos.composio.dev/api/peopledatalabs",
  },
  { name: "Shopify", slug: "shopify", logo: "https://logos.composio.dev/api/shopify" },
  { name: "LinkedIn", slug: "linkedin", logo: "https://logos.composio.dev/api/linkedin" },
  {
    name: "Google Maps",
    slug: "google_maps",
    logo: "https://logos.composio.dev/api/google_maps",
  },
  {
    name: "OneDrive",
    slug: "one_drive",
    logo: "https://logos.composio.dev/api/one_drive",
  },
  { name: "DocuSign", slug: "docusign", logo: "https://logos.composio.dev/api/docusign" },
  {
    name: "Discord Bot",
    slug: "discordbot",
    logo: "https://logos.composio.dev/api/discordbot",
  },
  { name: "Salesforce", slug: "salesforce", logo: "https://logos.composio.dev/api/salesforce" },
  { name: "Calendly", slug: "calendly", logo: "https://logos.composio.dev/api/calendly" },
  { name: "Trello", slug: "trello", logo: "https://logos.composio.dev/api/trello" },
  { name: "Apollo", slug: "apollo", logo: "https://logos.composio.dev/api/apollo" },
  { name: "Semrush", slug: "semrush", logo: "https://logos.composio.dev/api/semrush" },
  { name: "Mem0", slug: "mem0", logo: "https://logos.composio.dev/api/mem0" },
  { name: "Neon", slug: "neon", logo: "https://logos.composio.dev/api/neon" },
  {
    name: "OpenWeatherMap",
    slug: "weathermap",
    logo: "https://logos.composio.dev/api/weathermap",
  },
  { name: "PostHog", slug: "posthog", logo: "https://logos.composio.dev/api/posthog" },
  { name: "ClickUp", slug: "clickup", logo: "https://logos.composio.dev/api/clickup" },
  { name: "Brevo", slug: "brevo", logo: "https://logos.composio.dev/api/brevo" },
  { name: "Stripe", slug: "stripe", logo: "https://logos.composio.dev/api/stripe" },
  { name: "Klaviyo", slug: "klaviyo", logo: "https://logos.composio.dev/api/klaviyo" },
  {
    name: "Browserbase",
    slug: "browserbase_tool",
    logo: "https://logos.composio.dev/api/browserbase_tool",
  },
  { name: "Mailchimp", slug: "mailchimp", logo: "https://logos.composio.dev/api/mailchimp" },
  { name: "Attio", slug: "attio", logo: "https://logos.composio.dev/api/attio" },
  {
    name: "Google Meet",
    slug: "googlemeet",
    logo: "https://logos.composio.dev/api/googlemeet",
  },
  { name: "Text to PDF", slug: "text_to_pdf", logo: "https://logos.composio.dev/api/text_to_pdf" },
  { name: "Zoho", slug: "zoho", logo: "https://logos.composio.dev/api/zoho" },
  { name: "Fireflies", slug: "fireflies", logo: "https://logos.composio.dev/api/fireflies" },
  { name: "Dropbox", slug: "dropbox", logo: "https://logos.composio.dev/api/dropbox" },
  { name: "Shortcut", slug: "shortcut", logo: "https://logos.composio.dev/api/shortcut" },
  { name: "Confluence", slug: "confluence", logo: "https://logos.composio.dev/api/confluence" },
  { name: "Freshdesk", slug: "freshdesk", logo: "https://logos.composio.dev/api/freshdesk" },
  { name: "Borneo", slug: "borneo", logo: "https://logos.composio.dev/api/borneo" },
  { name: "Mixpanel", slug: "mixpanel", logo: "https://logos.composio.dev/api/mixpanel" },
];

export function ToolsSlider() {
  const [embla, setEmbla] = useState<EmblaCarouselType | null>(null);
  const { isMobile } = useAppStore();

  const tools = useMemo(() => TOOLS, []);
  const slideSize = isMobile ? "25%" : "15%";
  const slideGap = isMobile ? "sm" : "xl";

  useEffect(() => {
    if (!embla) return;

    const interval = window.setInterval(() => {
      embla.scrollNext();
    }, 600);

    return () => window.clearInterval(interval);
  }, [embla]);

  return (
    <Box mt="xl">
      <Stack gap="xs" mb="sm" align="center">
        <Title order={3}>Tools & Integrations</Title>
        <Text c="dimmed" size="sm">
          Connect your AI agents with over 1,000 tools and integrations.
        </Text>
      </Stack>

      <Carousel
        key={isMobile ? "mobile" : "desktop"}
        withControls={false}
        withIndicators={false}
        slideSize={slideSize}
        slideGap={slideGap}
        height={isMobile ? 100 : 110}
        type="container"
        emblaOptions={{
          loop: true,
          align: "start",
          containScroll: "trimSnaps",
        }}
        getEmblaApi={(api) => setEmbla(api)}
      >
        {tools.map((tool) => (
          <Carousel.Slide key={tool.slug}>
            <Center>
              <Stack>
                <Avatar src={tool.logo ?? undefined} alt={tool.name} size="lg" />
                <Text size="xs" c="dimmed" ta="center" lineClamp={1}>
                  {tool.name}
                </Text>
              </Stack>
            </Center>
          </Carousel.Slide>
        ))}
      </Carousel>
    </Box>
  );
}
