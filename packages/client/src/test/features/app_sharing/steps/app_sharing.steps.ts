// implements FR4, FR5, FR6 of share-with-friend
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { RenderHookResult } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
import type { UseShareReturn } from "@/hooks/useShare";
import { useShare } from "@/hooks/useShare";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const TEST_ORIGIN = "https://clear-progress.app";

const feature = await loadFeature("../app_sharing.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let hookRender: RenderHookResult<UseShareReturn, unknown>;
    let mockWriteText: ReturnType<typeof vi.fn>;

    f.BeforeEachScenario(() => {
      vi.clearAllMocks();
      mockWriteText = vi.fn();
      vi.stubGlobal("location", { origin: TEST_ORIGIN });
    });

    f.AfterEachScenario(() => {
      vi.unstubAllGlobals();
    });

    const stubNavigator = () => {
      vi.stubGlobal("navigator", {
        clipboard: { writeText: mockWriteText },
      });
    };

    const whenUserCopiesLink = async () => {
      hookRender = renderHook(() => useShare());
      await act(() => hookRender.result.current.copyLink());
    };

    // @share-with-friend @FR4
    f.Scenario(
      "Copy invite message with link to clipboard",
      ({ Given, When, Then }) => {
        Given("clipboard write will succeed", (_ctx: TestContext) => {
          mockWriteText.mockResolvedValue(undefined);
          stubNavigator();
        });

        When("user copies the app link", async (_ctx: TestContext) => {
          await whenUserCopiesLink();
        });

        Then(
          "clipboard contains invite message with app URL",
          (_ctx: TestContext) => {
            expect(mockWriteText).toHaveBeenCalledWith(
              `share.inviteMessage\n${TEST_ORIGIN}`,
            );
          },
        );
      },
    );

    // @share-with-friend @FR5
    f.Scenario("Confirmation after clipboard copy", ({ Given, When, Then }) => {
      Given("clipboard write will succeed", (_ctx: TestContext) => {
        mockWriteText.mockResolvedValue(undefined);
        stubNavigator();
      });

      When("user copies the app link", async (_ctx: TestContext) => {
        await whenUserCopiesLink();
      });

      Then('copy result is "copied"', (_ctx: TestContext) => {
        expect(hookRender.result.current.copyResult).toBe("copied");
      });
    });

    // @share-with-friend @FR4
    f.Scenario("Clipboard copy failure", ({ Given, When, Then }) => {
      Given("clipboard write will fail", (_ctx: TestContext) => {
        mockWriteText.mockRejectedValue(new Error("Permission denied"));
        stubNavigator();
      });

      When("user copies the app link", async (_ctx: TestContext) => {
        await whenUserCopiesLink();
      });

      Then('copy result is "error"', (_ctx: TestContext) => {
        expect(hookRender.result.current.copyResult).toBe("error");
      });
    });

    // @share-with-friend @FR5 @FR6
    f.Scenario("Reset copy result", ({ Given, When, Then }) => {
      Given("clipboard write will succeed", (_ctx: TestContext) => {
        mockWriteText.mockResolvedValue(undefined);
        stubNavigator();
      });

      When(
        "user copies the app link and then resets copy result",
        async (_ctx: TestContext) => {
          await whenUserCopiesLink();
          act(() => hookRender.result.current.resetCopyResult());
        },
      );

      Then('copy result is "idle"', (_ctx: TestContext) => {
        expect(hookRender.result.current.copyResult).toBe("idle");
      });
    });
  },
);
