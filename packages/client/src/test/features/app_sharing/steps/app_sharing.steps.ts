// implements FR3, FR4, FR5, FR6 of share-with-friend
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
    let mockShare: ReturnType<typeof vi.fn>;
    let mockWriteText: ReturnType<typeof vi.fn>;
    let capturedShareData: ShareData | undefined;

    f.BeforeEachScenario(() => {
      vi.clearAllMocks();
      capturedShareData = undefined;
      mockShare = vi.fn();
      mockWriteText = vi.fn();
      vi.stubGlobal("location", { origin: TEST_ORIGIN });
    });

    f.AfterEachScenario(() => {
      vi.unstubAllGlobals();
    });

    const stubNavigatorWithShare = () => {
      vi.stubGlobal("navigator", {
        share: mockShare,
        clipboard: { writeText: mockWriteText },
      });
    };

    const stubNavigatorWithoutShare = () => {
      vi.stubGlobal("navigator", {
        share: undefined,
        clipboard: { writeText: mockWriteText },
      });
    };

    const givenWebShareAvailable = () => {
      mockShare.mockResolvedValue(undefined);
      stubNavigatorWithShare();
    };

    const givenWebShareNotAvailable = () => {
      stubNavigatorWithoutShare();
    };

    const givenClipboardWillSucceed = () => {
      mockWriteText.mockResolvedValue(undefined);
    };

    const whenUserTriggersShare = async () => {
      hookRender = renderHook(() => useShare());
      await act(() => hookRender.result.current.shareApp());
    };

    // @share-with-friend @FR3
    f.Scenario("Share via Web Share API on mobile", ({ Given, When, Then }) => {
      Given("Web Share API is available", (_ctx: TestContext) => {
        givenWebShareAvailable();
      });

      When("user triggers share action", async (_ctx: TestContext) => {
        await whenUserTriggersShare();
      });

      Then(
        "native share sheet is invoked with app title, invite message, and origin URL",
        (_ctx: TestContext) => {
          expect(mockShare).toHaveBeenCalledWith({
            title: "Clear Progress",
            text: "share.inviteMessage",
            url: TEST_ORIGIN,
          });
        },
      );
    });

    // @share-with-friend @FR3
    f.Scenario(
      "Share data contains correct information",
      ({ Given, When, Then, And }) => {
        Given("Web Share API is available", (_ctx: TestContext) => {
          mockShare.mockImplementation((shareData: ShareData) => {
            capturedShareData = shareData;
            return Promise.resolve();
          });
          stubNavigatorWithShare();
        });

        When("user triggers share action", async (_ctx: TestContext) => {
          await whenUserTriggersShare();
        });

        Then(
          'share data includes title "Clear Progress"',
          (_ctx: TestContext) => {
            expect(capturedShareData?.title).toBe("Clear Progress");
          },
        );

        And(
          'share data includes text from i18n key "share.inviteMessage"',
          (_ctx: TestContext) => {
            expect(capturedShareData?.text).toBe("share.inviteMessage");
          },
        );

        And(
          "share data includes url from window origin",
          (_ctx: TestContext) => {
            expect(capturedShareData?.url).toBe(TEST_ORIGIN);
          },
        );
      },
    );

    // @share-with-friend @FR3
    f.Scenario(
      "User cancels native share sheet",
      ({ Given, When, Then, And }) => {
        Given("Web Share API is available", (_ctx: TestContext) => {
          stubNavigatorWithShare();
        });

        And("Web Share API will throw AbortError", (_ctx: TestContext) => {
          const abortError = new DOMException("Share canceled", "AbortError");
          mockShare.mockRejectedValue(abortError);
        });

        When("user triggers share action", async (_ctx: TestContext) => {
          await whenUserTriggersShare();
        });

        Then("share result remains idle", (_ctx: TestContext) => {
          expect(hookRender.result.current.shareResult).toBe("idle");
        });
      },
    );

    // @share-with-friend @FR4
    f.Scenario(
      "Web Share API fails with non-AbortError",
      ({ Given, When, Then, And }) => {
        Given("Web Share API is available", (_ctx: TestContext) => {
          stubNavigatorWithShare();
        });

        And(
          "Web Share API will throw a non-AbortError",
          (_ctx: TestContext) => {
            mockShare.mockRejectedValue(new Error("NotAllowedError"));
          },
        );

        And("clipboard write will succeed", (_ctx: TestContext) => {
          givenClipboardWillSucceed();
        });

        When("user triggers share action", async (_ctx: TestContext) => {
          await whenUserTriggersShare();
        });

        Then("URL is copied to clipboard", (_ctx: TestContext) => {
          expect(mockWriteText).toHaveBeenCalledWith(TEST_ORIGIN);
        });
      },
    );

    // @share-with-friend @FR4
    f.Scenario(
      "Fallback on desktop without Web Share API",
      ({ Given, When, Then, And }) => {
        Given("Web Share API is not available", (_ctx: TestContext) => {
          givenWebShareNotAvailable();
        });

        And("clipboard write will succeed", (_ctx: TestContext) => {
          givenClipboardWillSucceed();
        });

        When("user triggers share action", async (_ctx: TestContext) => {
          await whenUserTriggersShare();
        });

        Then("URL is copied to clipboard", (_ctx: TestContext) => {
          expect(mockWriteText).toHaveBeenCalledWith(TEST_ORIGIN);
        });
      },
    );

    // @share-with-friend @FR5
    f.Scenario(
      "Confirmation after clipboard copy",
      ({ Given, When, Then, And }) => {
        Given("Web Share API is not available", (_ctx: TestContext) => {
          givenWebShareNotAvailable();
        });

        And("clipboard write will succeed", (_ctx: TestContext) => {
          givenClipboardWillSucceed();
        });

        When("user triggers share action", async (_ctx: TestContext) => {
          await whenUserTriggersShare();
        });

        Then('share result is "copied"', (_ctx: TestContext) => {
          expect(hookRender.result.current.shareResult).toBe("copied");
        });
      },
    );

    // @share-with-friend @FR4
    f.Scenario("Clipboard copy failure", ({ Given, When, Then, And }) => {
      Given("Web Share API is not available", (_ctx: TestContext) => {
        givenWebShareNotAvailable();
      });

      And("clipboard write will fail", (_ctx: TestContext) => {
        mockWriteText.mockRejectedValue(new Error("Permission denied"));
      });

      When("user triggers share action", async (_ctx: TestContext) => {
        await whenUserTriggersShare();
      });

      Then('share result is "error"', (_ctx: TestContext) => {
        expect(hookRender.result.current.shareResult).toBe("error");
      });
    });

    // @share-with-friend @FR5 @FR6
    f.Scenario("Reset share result", ({ Given, When, Then, And }) => {
      Given("Web Share API is not available", (_ctx: TestContext) => {
        givenWebShareNotAvailable();
      });

      And("clipboard write will succeed", (_ctx: TestContext) => {
        givenClipboardWillSucceed();
      });

      When(
        "user triggers share action and then resets share result",
        async (_ctx: TestContext) => {
          await whenUserTriggersShare();
          act(() => hookRender.result.current.resetShareResult());
        },
      );

      Then('share result is "idle"', (_ctx: TestContext) => {
        expect(hookRender.result.current.shareResult).toBe("idle");
      });
    });
  },
);
