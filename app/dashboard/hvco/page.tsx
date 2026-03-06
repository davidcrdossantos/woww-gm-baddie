import { PageHeader } from "@/components/ui";
import { LeadMagnetModule } from "@/components/modules/GmModules";

export default function HvcoPage() {
  return (
    <>
      <PageHeader title="HVCO Titles" subtitle="High Value Content Offer titles — the first offer in your funnel." />
      <div className="px-8 py-7 max-w-6xl">
        <LeadMagnetModule />
      </div>
    </>
  );
}
