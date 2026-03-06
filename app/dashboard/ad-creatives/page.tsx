import { PageHeader } from "@/components/ui";
import { AdCreativesModule } from "@/components/modules/GmModules";

export default function AdCreativesPage() {
  return (
    <>
      <PageHeader title="Ad Creatives" subtitle="AI-generated images + native ad templates. Design, generate, download." />
      <div className="px-8 py-7 max-w-6xl">
        <AdCreativesModule />
      </div>
    </>
  );
}
