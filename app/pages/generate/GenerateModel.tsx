import { useParams } from "react-router";
import ModelSchemaForm from "./components/ModelSchemaForm";

export default function GenerateModel() {
  const params = useParams();
  const formKey = `${params.generation_type ?? ""}:${(params["*"] ?? "").trim()}`;

  return <ModelSchemaForm key={formKey} />;
}
