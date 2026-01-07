import { MobileFooterFiles } from "~/shared/MobileFooterFiles";
import { MobileFooterGenerate } from "~/shared/MobileFooterGenerate";
import { MobileFooterGenerations } from "~/shared/MobileFooterGenerations";
import { MobileFooterBilling } from "~/shared/MobileFooterBilling";
import { MobileFooterTokensLog } from "~/shared/MobileFooterTokensLog";
import { MobileHeaderFiles } from "~/shared/MobileHeaderFiles";
import { MobileHeaderGenerate } from "~/shared/MobileHeaderGenerate";
import { MobileHeaderGenerations } from "~/shared/MobileHeaderGenerations";

export const mobileUI = {
  pages: {
    "pages/generate/GenerateModel": {
      header: {
        height: 100,
        component: <MobileHeaderGenerate />,
      },
      footer: {
        height: 60,
        component: <MobileFooterGenerate />,
      },
    },
    "pages/generations/Generations": {
      header: {
        height: 100,
        component: <MobileHeaderGenerations />,
      },
      footer: {
        height: 60,
        component: <MobileFooterGenerations />,
      },
    },
    "pages/files/MemberFiles": {
      header: {
        height: 110,
        component: <MobileHeaderFiles />,
      },
      footer: {
        height: 60,
        component: <MobileFooterFiles />,
      },
    },
    "pages/account/Billing": {
      header: {
        height: 60,
        component: null,
      },
      footer: {
        height: 60,
        component: <MobileFooterBilling />,
      },
    },
    "pages/account/TokensLog": {
      header: {
        height: 60,
        component: null,
      },
      footer: {
        height: 60,
        component: <MobileFooterTokensLog />,
      },
    },
  },
  "pages/generate/Generate": {
    header: {
      height: 60,
      component: null,
    },
    footer: {
      height: 0,
      component: null,
    },
  },
};
