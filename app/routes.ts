import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  layout("shared/GenerateLayout.tsx", [
    route("/", "pages/root/Home.tsx"),
    route("/generate", "pages/generate/Generate.tsx"),
    route("/login", "pages/root/Login.tsx"),
    route("/generate/:generation_type", "pages/generate/GenerateType.tsx"),
    layout("shared/AuthWrapper.tsx", [
      route("/account/profile", "pages/account/UserProfile.tsx"),
      route("/account/billing", "pages/account/Billing.tsx"),
      route("/account/tokens-log", "pages/account/TokensLog.tsx"),
      route("/files", "pages/files/MemberFiles.tsx"),
      route("/generations", "pages/generations/Generations.tsx"),
      route("/generate/:generation_type/:slug", "pages/generate/GenerateModel.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
