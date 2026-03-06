import { PageHeader } from "@/components/ui";
import { LandingModule } from "@/components/modules/GmModules";

export default function LandingPagesPage() {
  return (
    <>
      <PageHeader title="Landing Pages" subtitle="Full HTML landing pages — beautiful, conversion-optimised, ready to deploy." />
      <div className="px-8 py-7 max-w-6xl">
        <LandingModule />
      </div>
    </>
  );
}
