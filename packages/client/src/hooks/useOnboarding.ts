import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEYS } from "@/constants";
import { setPreference } from "@/services/localPreferencesService";
import type { OnboardingService } from "@/services/OnboardingService";

/** Implements FR1, FR3, FR7 of onboarding-goal */

type OnboardingState = "checking" | "showing" | "dismissed";

export function useOnboarding(onboardingService: OnboardingService) {
  const { t } = useTranslation();
  const [state, setState] = useState<OnboardingState>("checking");

  useEffect(() => {
    let isCancelled = false;

    const checkOnboarding = async () => {
      const shouldShow = await onboardingService.shouldShowOnboarding();
      if (!isCancelled) {
        setState(shouldShow ? "showing" : "dismissed");
      }
    };

    checkOnboarding().catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [onboardingService]);

  const accept = useCallback(async () => {
    await onboardingService.createOnboardingEntities(t);
    setState("dismissed");
  }, [onboardingService, t]);

  const decline = useCallback(() => {
    setPreference(STORAGE_KEYS.ONBOARDING_SHOWN, true);
    setState("dismissed");
  }, []);

  return {
    state,
    isShowing: state === "showing",
    isChecking: state === "checking",
    accept,
    decline,
  };
}
