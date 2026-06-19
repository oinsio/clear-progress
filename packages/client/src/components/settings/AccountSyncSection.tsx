import { ServerSection } from "@/components/settings/ServerSection";

interface AccountSyncSectionProps {
  oauthError: string;
}

/** Implements FR5 of settings-page-reordering */
export function AccountSyncSection({ oauthError }: AccountSyncSectionProps) {
  return <ServerSection oauthError={oauthError} />;
}
