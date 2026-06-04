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
    route("/dashboard", "pages/dashboard/Dashboard.tsx"),
    route("/account/profile", "pages/account/UserProfile.tsx"),
    route("/account/billing", "pages/account/Billing.tsx"),
    route("/account/usage-log", "pages/account/UsageLog.tsx"),
    route("/account/support", "pages/account/Support.tsx"),
    route("/account/support/:ticketId", "pages/account/SupportTicket.tsx"),
    route("/tools", "pages/tools/Tools.tsx"),
    route("/tools/:slug", "pages/tools/ToolkitDetail.tsx"),
    route("/agents", "pages/agents/Agents.tsx"),
    route("/files", "pages/files/MemberFiles.tsx"),
    route("/characters", "pages/characters/Characters.tsx"),
    layout("pages/characters/CharacterLayout.tsx", [
      route("/characters/:characterId", "pages/characters/CharacterDetail.tsx"),
    ]),
    route("/voices/library", "pages/voices/VoiceLibrary.tsx"),
    route("/voices", "pages/voices/Voices.tsx"),
    layout("pages/voices/VoiceLayout.tsx", [
      route("/voices/:voiceId", "pages/voices/VoiceDetail.tsx"),
    ]),
    route("/generations", "pages/generations/Generations.tsx"),
    route("/generate", "pages/generate/Generate.tsx"),
    layout("pages/generate/GenerateModelLayout.tsx", [
      route("/generate/:generation_type/*", "pages/generate/GenerateModel.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
