import { PageHeader } from "@/components/ui";
import { AvatarModule } from "@/components/modules/GmModules";

export default function AvatarsPage() {
  return (
    <>
      <PageHeader title="Dream Buyer Avatars" subtitle="Deep psychographic research — real language, real fears, real motivations." />
      <div className="px-8 py-7 max-w-6xl">
        <AvatarModule />
      </div>
    </>
  );
}
