import Generate from "../generate/Generate";

export function meta() {
  return [{ title: "Genny.bot" }, { name: "description", content: "Welcome to Genny.bot!" }];
}

export default function Home() {
  return <Generate />;
}
