import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  route("/api-health-error", "pages/root/ApiHealthError.tsx"),
  layout("shared/LandingLayout.tsx", [
    route("/", "pages/root/Home.tsx"),
    route("/login", "pages/root/Login.tsx"),
    route("/privacy", "pages/root/PrivacyPolicy.tsx"),
    route("/terms", "pages/root/TermsOfService.tsx"),
    route("/contact", "pages/root/Contact.tsx"),
  ]),
  layout("shared/AuthedLayout.tsx", [
    route("/generate", "pages/generate/Generate.tsx"),
    route("/generate/:generation_type", "pages/generate/GenerateType.tsx"),
    layout("pages/generate/GenerateModelLayout.tsx", [
      route("/generate/:generation_type/:slug", "pages/generate/GenerateModel.tsx"),
    ]),
    route("/account/profile", "pages/account/UserProfile.tsx"),
    route("/account/billing", "pages/account/Billing.tsx"),
    route("/account/usage-log", "pages/account/UsageLog.tsx"),
    route("/account/support", "pages/account/Support.tsx"),
    route("/account/support/:ticketId", "pages/account/SupportTicket.tsx"),
    route("/mcpservers", "pages/mcp/McpServers.tsx"),
    route("/mcpservers/:name", "pages/mcp/McpServerDetail.tsx"),
    route("/tools", "pages/tools/Tools.tsx"),
    route("/tools/:slug", "pages/tools/ToolkitDetail.tsx"),
    route("/chats", "pages/chats/Chats.tsx"),
    route("/files", "pages/files/MemberFiles.tsx"),
    route("/generations", "pages/generations/Generations.tsx"),
  ]),
] satisfies RouteConfig;
