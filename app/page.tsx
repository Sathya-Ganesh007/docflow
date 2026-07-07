import { AuthGuard } from "@/components/AuthGuard";
import { DocsApp } from "@/components/DocsApp";

export default function Home() {
  return (
    <AuthGuard>
      <DocsApp />
    </AuthGuard>
  );
}
