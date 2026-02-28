import { permanentRedirect } from "next/navigation";

export default function StartupAliasPage() {
  permanentRedirect("/startups");
}
