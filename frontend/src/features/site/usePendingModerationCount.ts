import { useCertificateQueue } from "../user/CertificateQueue";
import { useSiteQueue } from "./ModerationPage";

/**
 * Pending sites plus pending certificates, from the moderation page's own queue queries, so an
 * approval there updates the count too (design D5). `undefined` while either query loads.
 */
export function usePendingModerationCount(enabled: boolean): number | undefined {
  const sites = useSiteQueue({ enabled }).data?.page.totalElements;
  const certificates = useCertificateQueue({ enabled }).data?.page.totalElements;
  if (sites === undefined || certificates === undefined) return undefined;
  return sites + certificates;
}
