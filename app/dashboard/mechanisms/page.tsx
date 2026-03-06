import { PageHeader } from "@/components/ui";
import { MechanismModule } from "@/components/modules/GmModules";

export default function MechanismsPage() {
  return (
    <>
      <PageHeader title="Hero Mechanisms" subtitle="The single biggest conversion multiplier. Answers: 'Why you, why now?'" />
      <div className="px-8 py-7 max-w-6xl">
        <MechanismModule />
      </div>
    </>
  );
}
