import { PageHeader } from "@/components/ui";
import HistoryList from "@/components/meta-ads/HistoryList";
import Link from "next/link";

export default function MetaAdsHistoryPage() {
  return (
    <>
      <PageHeader
        title="Upload History"
        subtitle="All your Meta Ads upload batches"
        actions={
          <Link href="/dashboard/meta-ads/upload" className="btn-brand text-sm px-4 py-2">
            + New Batch
          </Link>
        }
      />
      <div className="px-8 py-7 max-w-4xl">
        <HistoryList />
      </div>
    </>
  );
}
