import { PageHeader } from "@/components/ui";
import { GodfatherModule } from "@/components/modules/GmModules";

export default function GodfatherPage() {
  return (
    <>
      <PageHeader title="Godfather Offers" subtitle="Engineer a 'can't refuse' offer. Shift risk and watch CAC drop." />
      <div className="px-8 py-7 max-w-6xl">
        <GodfatherModule />
      </div>
    </>
  );
}
