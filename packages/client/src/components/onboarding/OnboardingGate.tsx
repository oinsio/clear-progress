import { useOnboarding } from "@/hooks/useOnboarding";
import { defaultOnboardingService } from "@/services/defaultServices";
import { OnboardingDialog } from "./OnboardingDialog";

/** Implements FR1, FR3, FR7 of onboarding-goal */
export function OnboardingGate() {
  const { isShowing, accept, decline } = useOnboarding(
    defaultOnboardingService,
  );

  if (!isShowing) {
    return null;
  }

  return <OnboardingDialog onAccept={accept} onDecline={decline} />;
}
