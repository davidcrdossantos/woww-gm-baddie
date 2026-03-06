import { PageHeader } from "@/components/ui";
import UploadWizard from "@/components/meta-ads/UploadWizard";

export default function MetaAdsUploadPage() {
  return (
    <>
      <PageHeader
        title="Meta Ads Bulk Uploader"
        subtitle="Upload creatives, write copy, and launch ads in bulk — powered by the Meta Marketing API v22.0"
      />
      <div className="px-8 py-7">
        <UploadWizard />
      </div>
    </>
  );
}
