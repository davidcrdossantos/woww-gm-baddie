import { PageHeader } from "@/components/ui";
import { ProductModule } from "@/components/modules/GmModules";

export default function ClientsPage() {
  return (
    <>
      <PageHeader title="Clients" subtitle="Create and manage your client briefs. All other modules pull from here." />
      <div className="px-8 py-7 max-w-6xl">
        <ProductModule />
      </div>
    </>
  );
}
