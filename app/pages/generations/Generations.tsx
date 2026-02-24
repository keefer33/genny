import { GenerationResults } from "~/pages/generate/components/GenerationResults";
import Mounted from "~/shared/Mounted";

export default function Generations() {
  return (
    <Mounted size="lg" pt={0}>
      <GenerationResults />
    </Mounted>
  );
}
