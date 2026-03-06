import { PageHeader } from "@/components/ui";
import { GoogleAdsModule } from "@/components/modules/GmModules";

export default function GoogleAdsPage() {
  return (
    <>
      <PageHeader title="Google Ads Generator" subtitle="Headlines, descriptions, sitelinks, and keyword research." />
      <div className="px-8 py-7 max-w-6xl">
        <GoogleAdsModule />
      </div>
    </>
  );
}
