import { PageHeader } from "@/components/ui";
import SettingsForm from "@/components/meta-ads/SettingsForm";

export default function MetaAdsSettingsPage() {
  return (
    <>
      <PageHeader
        title="Meta Ads Settings"
        subtitle="Configure your Meta access token, ad account, and page"
      />
      <div className="px-8 py-7">
        <SettingsForm />
      </div>
    </>
  );
}
