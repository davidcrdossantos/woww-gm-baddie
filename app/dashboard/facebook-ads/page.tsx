import { PageHeader } from "@/components/ui";
import { FacebookAdModule } from "@/components/modules/GmModules";

export default function FacebookAdsPage() {
  return (
    <>
      <PageHeader title="Facebook Ad Generator" subtitle="8 angles. 3 output formats. Beast mode. Lead gen & e-commerce." />
      <div className="px-8 py-7 max-w-6xl">
        <FacebookAdModule />
      </div>
    </>
  );
}
