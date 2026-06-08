import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import type { OnboardingService } from "@/services/OnboardingService";
import { useOnboarding } from "./useOnboarding";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

function createMockOnboardingService(
  overrides: Partial<OnboardingService> = {},
): OnboardingService {
  return {
    shouldShowOnboarding: vi.fn().mockResolvedValue(true),
    createOnboardingEntities: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as OnboardingService;
}

async function renderOnboardingWithShowing() {
  const mockService = createMockOnboardingService({
    shouldShowOnboarding: vi.fn().mockResolvedValue(true),
  });
  const { result } = renderHook(() => useOnboarding(mockService));
  await waitFor(() => expect(result.current.state).toBe("showing"));
  return { result, mockService };
}

async function renderOnboardingWithDismissed() {
  const mockService = createMockOnboardingService({
    shouldShowOnboarding: vi.fn().mockResolvedValue(false),
  });
  const { result } = renderHook(() => useOnboarding(mockService));
  await waitFor(() => expect(result.current.state).toBe("dismissed"));
  return { result, mockService };
}

async function renderAndAcceptOnboarding() {
  const mockCreateEntities = vi.fn().mockResolvedValue(undefined);
  const mockService = createMockOnboardingService({
    createOnboardingEntities: mockCreateEntities,
  });
  const { result } = renderHook(() => useOnboarding(mockService));
  await waitFor(() => expect(result.current.state).toBe("showing"));

  await act(async () => {
    await result.current.accept();
  });

  return { result, mockCreateEntities };
}

describe("useOnboarding", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_SHOWN);
  });

  it("should start in checking state", () => {
    const mockService = createMockOnboardingService();
    const { result } = renderHook(() => useOnboarding(mockService));
    expect(result.current.state).toBe("checking");
    expect(result.current.isChecking).toBe(true);
  });

  it("should transition to showing when onboarding is needed", async () => {
    const { result } = await renderOnboardingWithShowing();
    expect(result.current.isShowing).toBe(true);
  });

  it("should transition to dismissed when onboarding not needed", async () => {
    const { result } = await renderOnboardingWithDismissed();
    expect(result.current.isShowing).toBe(false);
  });

  it("should create entities and dismiss on accept", async () => {
    const { result, mockCreateEntities } = await renderAndAcceptOnboarding();

    expect(mockCreateEntities).toHaveBeenCalledOnce();
    expect(result.current.state).toBe("dismissed");
  });

  it("should set flag and dismiss on decline", async () => {
    const mockService = createMockOnboardingService();
    const { result } = renderHook(() => useOnboarding(mockService));
    await waitFor(() => expect(result.current.state).toBe("showing"));

    act(() => {
      result.current.decline();
    });

    expect(result.current.state).toBe("dismissed");
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBe("true");
  });

  it("should cancel previous check when service changes before resolution", async () => {
    let resolveFirst: (value: boolean) => void;
    const firstPromise = new Promise<boolean>((resolve) => {
      resolveFirst = resolve;
    });
    const firstService = createMockOnboardingService({
      shouldShowOnboarding: vi.fn().mockReturnValue(firstPromise),
    });
    const secondService = createMockOnboardingService({
      shouldShowOnboarding: vi.fn().mockResolvedValue(false),
    });

    const { result, rerender } = renderHook(
      ({ service }) => useOnboarding(service),
      { initialProps: { service: firstService } },
    );

    expect(result.current.state).toBe("checking");

    rerender({ service: secondService });

    await waitFor(() => expect(result.current.state).toBe("dismissed"));

    await act(async () => {
      resolveFirst!(true);
    });

    expect(result.current.state).toBe("dismissed");
    expect(result.current.isShowing).toBe(false);
  });

  it("should re-check when onboardingService changes", async () => {
    const firstService = createMockOnboardingService({
      shouldShowOnboarding: vi.fn().mockResolvedValue(true),
    });
    const secondService = createMockOnboardingService({
      shouldShowOnboarding: vi.fn().mockResolvedValue(false),
    });

    const { result, rerender } = renderHook(
      ({ service }) => useOnboarding(service),
      { initialProps: { service: firstService } },
    );

    await waitFor(() => expect(result.current.state).toBe("showing"));

    rerender({ service: secondService });

    await waitFor(() => expect(result.current.state).toBe("dismissed"));
    expect(secondService.shouldShowOnboarding).toHaveBeenCalledOnce();
  });

  it("should have isChecking false after transition to showing", async () => {
    const { result } = await renderOnboardingWithShowing();
    expect(result.current.isChecking).toBe(false);
  });

  it("should have isChecking false after transition to dismissed", async () => {
    const { result } = await renderOnboardingWithDismissed();
    expect(result.current.isChecking).toBe(false);
  });

  it("should pass t function to createOnboardingEntities on accept", async () => {
    const { mockCreateEntities } = await renderAndAcceptOnboarding();

    expect(mockCreateEntities).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should use updated service reference when accept is called after rerender", async () => {
    const firstCreateEntities = vi.fn().mockResolvedValue(undefined);
    const secondCreateEntities = vi.fn().mockResolvedValue(undefined);
    const firstService = createMockOnboardingService({
      shouldShowOnboarding: vi.fn().mockResolvedValue(true),
      createOnboardingEntities: firstCreateEntities,
    });
    const secondService = createMockOnboardingService({
      shouldShowOnboarding: vi.fn().mockResolvedValue(true),
      createOnboardingEntities: secondCreateEntities,
    });

    const { result, rerender } = renderHook(
      ({ service }) => useOnboarding(service),
      { initialProps: { service: firstService } },
    );

    await waitFor(() => expect(result.current.state).toBe("showing"));

    rerender({ service: secondService });
    await waitFor(() => expect(result.current.state).toBe("showing"));

    await act(async () => {
      await result.current.accept();
    });

    expect(firstCreateEntities).not.toHaveBeenCalled();
    expect(secondCreateEntities).toHaveBeenCalledOnce();
  });
});
