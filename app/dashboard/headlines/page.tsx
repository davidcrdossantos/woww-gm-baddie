import { PageHeader } from "@/components/ui";
import { HeadlineModule } from "@/components/modules/GmModules";

export default function HeadlinesPage() {
  return (
    <>
      <PageHeader title="Direct Response Headlines" subtitle="High-converting headlines for ads, opt-ins, and landing pages." />
      <div className="px-8 py-7 max-w-6xl">
        <HeadlineModule />
      </div>
    </>
  );
}
