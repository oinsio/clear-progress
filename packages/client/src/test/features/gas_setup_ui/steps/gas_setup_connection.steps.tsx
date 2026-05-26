// implements FR1, FR3, FR4, FR5 of gas-setup-ui-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, screen, waitFor } from "@testing-library/react/pure";
import { expect, vi } from "vitest";
import { ROUTES } from "@/constants";
import {
  createSupabaseClientMock,
  expandGasAndFillUrl,
  expandGasSection,
  renderSetupPage,
  resetSetupMocks,
} from "./setupPageTestHelpers";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const {
  mockPing,
  mockInit,
  mockConnect,
  mockGetConnectionConfig,
  mockGetSavedConnectionConfig,
  mockUseAuth,
} = vi.hoisted(() => ({
  mockPing: vi.fn(),
  mockInit: vi.fn(),
  mockConnect: vi.fn(),
  mockGetConnectionConfig: vi.fn(),
  mockGetSavedConnectionConfig: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock("@clear-progress/adapter-gas", () => ({
  createGasAdapter: vi.fn(() => ({ ping: mockPing, init: mockInit })),
}));

vi.mock("@/services/connectionService", () => ({
  connect: mockConnect,
  disconnect: vi.fn(),
  getConnectionConfig: mockGetConnectionConfig,
  getSavedConnectionConfig: mockGetSavedConnectionConfig,
}));

vi.mock("@/services/supabaseConnection", () => ({
  fetchSupabaseProviders: vi.fn(),
}));

vi.mock("@/services/supabaseClientManager", () => ({
  createSupabaseClient: vi.fn(() => createSupabaseClientMock()),
  getSupabaseClient: vi.fn(() => createSupabaseClientMock()),
  destroySupabaseClient: vi.fn(),
}));

vi.mock("@/services/defaultServices", () => ({
  getDefaultSyncAdapter: vi.fn(() => ({ ping: vi.fn(), init: mockInit })),
}));

vi.mock("@/services/tokenManager", () => ({
  getAccessToken: vi.fn(() => null),
}));

vi.mock("@/hooks/usePanelSide", () => ({
  usePanelSide: () => ({ panelSide: "right", setPanelSide: vi.fn() }),
}));
vi.mock("@/hooks/usePanelOpen", () => ({
  usePanelOpen: () => ({ isPanelOpen: false, togglePanelOpen: vi.fn() }),
}));
vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock("@/i18n", () => ({ default: {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const feature = await loadFeature("../gas_setup_connection.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      resetSetupMocks({
        mockGetConnectionConfig,
        mockGetSavedConnectionConfig,
        mockUseAuth,
      });
    });

    f.Background(({ Given }) => {
      Given("no active connection is configured", () => {
        mockGetConnectionConfig.mockReturnValue(null);
      });
    });

    // @gas-setup-ui-spec @FR1
    f.Scenario("GAS section toggle visible on SetupPage", ({ When, Then }) => {
      When("user opens SetupPage", () => {
        renderSetupPage();
      });

      Then("GAS section toggle is displayed", () => {
        expect(
          screen.getByTestId("setup-gas-section-toggle"),
        ).toBeInTheDocument();
      });
    });

    // @gas-setup-ui-spec @FR1
    f.Scenario("GAS section expands to show inputs", ({ When, Then, And }) => {
      When("user expands the GAS section", () => {
        expandGasSection();
      });

      Then("URL input is displayed", () => {
        expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
      });

      And("Client ID input is displayed", () => {
        expect(screen.getByTestId("setup-client-id-input")).toBeInTheDocument();
      });

      And("Connect button is displayed", () => {
        expect(screen.getByTestId("setup-connect-button")).toBeInTheDocument();
      });
    });

    // @gas-setup-ui-spec @FR1
    f.Scenario(
      "Connect button disabled when URL is empty",
      ({ Given, When, Then }) => {
        Given("user expands the GAS section", () => {
          expandGasSection();
        });

        When("URL field is empty", () => {
          // Field is empty by default
        });

        Then("Connect button is disabled", () => {
          expect(screen.getByTestId("setup-connect-button")).toBeDisabled();
        });
      },
    );

    // @gas-setup-ui-spec @FR1
    f.Scenario(
      "Connect button enabled when URL is filled",
      ({ Given, When, Then }) => {
        Given("user expands the GAS section", () => {
          expandGasSection();
        });

        When("user enters URL {string}", (_ctx, url: string) => {
          fireEvent.change(screen.getByTestId("setup-url-input"), {
            target: { value: url },
          });
        });

        Then("Connect button is enabled", () => {
          expect(screen.getByTestId("setup-connect-button")).not.toBeDisabled();
        });
      },
    );

    // @gas-setup-ui-spec @FR3
    f.Scenario(
      "Successful connection to initialized backend without Client ID",
      ({ Given, And, When, Then }) => {
        Given("user expands the GAS section", () => {
          expandGasSection();
        });

        And("user enters URL {string}", (_ctx, url: string) => {
          fireEvent.change(screen.getByTestId("setup-url-input"), {
            target: { value: url },
          });
        });

        When("user clicks Connect", () => {
          mockPing.mockResolvedValue({ ok: true, initialized: true });
          fireEvent.click(screen.getByTestId("setup-connect-button"));
        });

        And("ping responds with ok and initialized", () => {
          // Already set up in When step
        });

        Then(
          "connection config is saved with type {string}",
          async (_ctx, expectedType: string) => {
            await waitFor(() => {
              expect(mockConnect).toHaveBeenCalledWith(
                expect.objectContaining({
                  type: expectedType,
                  isActive: true,
                }),
              );
            });
          },
        );

        And("app navigates to inbox", async () => {
          await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX);
          });
        });
      },
    );

    // @gas-setup-ui-spec @FR5
    f.Scenario(
      "Connection to uninitialized backend without Client ID shows warning",
      ({ Given, And, When, Then }) => {
        Given("user expands the GAS section", () => {
          expandGasSection();
        });

        And("user enters URL {string}", (_ctx, url: string) => {
          fireEvent.change(screen.getByTestId("setup-url-input"), {
            target: { value: url },
          });
        });

        When("user clicks Connect", () => {
          mockPing.mockResolvedValue({ ok: true, initialized: false });
          fireEvent.click(screen.getByTestId("setup-connect-button"));
        });

        And("ping responds with ok but not initialized", () => {
          // Already set up in When step
        });

        Then("not-initialized warning is displayed", async () => {
          await waitFor(() => {
            expect(
              screen.getByText("setup.notInitializedNeedClientId"),
            ).toBeInTheDocument();
          });
        });

        And("back-to-input button is available", () => {
          expect(screen.getByTestId("setup-back-button")).toBeInTheDocument();
        });
      },
    );

    // @gas-setup-ui-spec @FR3 @FR5
    f.Scenario(
      "Connection with Client ID to initialized backend shows sign-in",
      ({ Given, And, When, Then }) => {
        Given("user expands the GAS section", () => {
          expandGasSection();
        });

        And("user enters URL {string}", (_ctx, url: string) => {
          fireEvent.change(screen.getByTestId("setup-url-input"), {
            target: { value: url },
          });
        });

        And("user enters Client ID {string}", (_ctx, clientId: string) => {
          fireEvent.change(screen.getByTestId("setup-client-id-input"), {
            target: { value: clientId },
          });
        });

        When("user clicks Connect", () => {
          mockPing.mockResolvedValue({ ok: true, initialized: true });
          fireEvent.click(screen.getByTestId("setup-connect-button"));
        });

        And("ping responds with ok and initialized", () => {
          // Already set up in When step
        });

        Then("awaiting sign-in state is displayed", async () => {
          await waitFor(() => {
            expect(
              screen.getByTestId("setup-awaiting-signin"),
            ).toBeInTheDocument();
          });
        });
      },
    );

    // @gas-setup-ui-spec @FR4
    f.Scenario(
      "Ping failure shows connection error",
      ({ Given, And, When, Then }) => {
        Given("user expands the GAS section", () => {
          expandGasSection();
        });

        And("user enters URL {string}", (_ctx, url: string) => {
          fireEvent.change(screen.getByTestId("setup-url-input"), {
            target: { value: url },
          });
        });

        When("user clicks Connect", () => {
          mockPing.mockResolvedValue({ ok: false });
          fireEvent.click(screen.getByTestId("setup-connect-button"));
        });

        And("ping responds with not ok", () => {
          // Already set up in When step
        });

        Then("connection error is displayed", async () => {
          await waitFor(() => {
            expect(screen.getByTestId("setup-error")).toBeInTheDocument();
          });
        });

        And("Connect button is displayed", () => {
          expect(
            screen.getByTestId("setup-connect-button"),
          ).toBeInTheDocument();
        });
      },
    );

    // @gas-setup-ui-spec @FR4
    f.Scenario(
      "Network error shows connection error",
      ({ Given, And, When, Then }) => {
        Given("user expands the GAS section", () => {
          expandGasSection();
        });

        And("user enters URL {string}", (_ctx, url: string) => {
          fireEvent.change(screen.getByTestId("setup-url-input"), {
            target: { value: url },
          });
        });

        When("user clicks Connect", () => {
          mockPing.mockRejectedValue(new Error("Network error"));
          fireEvent.click(screen.getByTestId("setup-connect-button"));
        });

        And("ping throws a network error", () => {
          // Already set up in When step
        });

        Then("connection error is displayed", async () => {
          await waitFor(() => {
            expect(screen.getByTestId("setup-error")).toBeInTheDocument();
          });
        });

        And("Connect button is displayed", () => {
          expect(
            screen.getByTestId("setup-connect-button"),
          ).toBeInTheDocument();
        });
      },
    );

    // @gas-setup-ui-spec @FR5
    f.Scenario(
      "Back to input returns to input phase",
      ({ Given, When, Then, And }) => {
        Given("not-initialized warning is shown", async () => {
          expandGasAndFillUrl("https://script.google.com/macros/s/ABC/exec");
          mockPing.mockResolvedValue({ ok: true, initialized: false });
          fireEvent.click(screen.getByTestId("setup-connect-button"));
          await waitFor(() => {
            expect(screen.getByTestId("setup-back-button")).toBeInTheDocument();
          });
        });

        When("user clicks back-to-input button", () => {
          fireEvent.click(screen.getByTestId("setup-back-button"));
        });

        Then("URL input is displayed", () => {
          expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
        });

        And("Connect button is displayed", () => {
          expect(
            screen.getByTestId("setup-connect-button"),
          ).toBeInTheDocument();
        });
      },
    );
  },
);
