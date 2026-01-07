import useAppStore from "~/lib/stores/appStore";
import { MobileFooterGenerate } from "./MobileFooterGenerate";
import { MobileFooterGenerations } from "./MobileFooterGenerations";
import { MobileFooterFiles } from "./MobileFooterFiles";

export function MobileFooter() {
  const { getPage } = useAppStore();
  const page = getPage();

  if (page === "pages/generate/GenerateModel") {
    return <MobileFooterGenerate />;
  }
  if (page === "pages/generations/Generations") {
    return <MobileFooterGenerations />;
  }
  if (page === "pages/files/MemberFiles") {
    return <MobileFooterFiles />;
  }
  return null;
}
