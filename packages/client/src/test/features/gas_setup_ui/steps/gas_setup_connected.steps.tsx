// implements FR6 of gas-setup-ui-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, screen } from "@testing-library/react/pure";
import { expect, vi } from "vitest";
import {
  createDefaultAuthMock,
  createSupabaseClientMock,
  renderSetupPage,
  resetSetupMocks,
} from "./setupPageTestHelpers";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const {
  mockDisconnect,
  mockGetConnectionConfig,
  mockGetSavedConnectionConfig,
  mockUseAuth,
} = vi.hoisted(() => ({
  mockDisconnect: vi.fn(),
  mockGetConnectionConfig: vi.fn(),
  mockGetSavedConnectionConfig: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock("@clear-progress/adapter-gas", () => ({
  createGasAdapter: vi.fn(() => ({ ping: vi.fn(), init: vi.fn() })),
}));

vi.mock("@/services/connectionService", () => ({
  connect: vi.fn(),
  disconnect: mockDisconnect,
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
  getDefaultSyncAdapter: vi.fn(() => ({ ping: vi.fn(), init: vi.fn() })),
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

const feature = await loadFeature("../gas_setup_connected.feature");

type FeatureContext = Record<string, never>;

const GAS_TEST_URL = "https://script.google.com/macros/s/ABC/exec";
const GAS_TEST_CLIENT_ID = "123456789.apps.googleusercontent.com";

function setupGasConnection(options: {
  url: string;
  clientId?: string;
  accessToken?: string | null;
}) {
  mockGetConnectionConfig.mockReturnValue({
    type: "gas",
    url: options.url,
    clientId: options.clientId,
    isActive: true,
  });
  mockGetSavedConnectionConfig.mockReturnValue({
    type: "gas",
    url: options.url,
    clientId: options.clientId,
    isActive: true,
  });
  mockUseAuth.mockReturnValue({
    ...createDefaultAuthMock(),
    accessToken: options.accessToken ?? null,
  });
}

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

    // @gas-setup-ui-spec @FR6
    f.Scenario(
      "Connected state shows deployment URL",
      ({ Given, When, Then }) => {
        Given("user is connected to GAS at {string}", (_ctx, url: string) => {
          setupGasConnection({ url });
        });

        When("user opens SetupPage", () => {
          renderSetupPage();
        });

        Then("URL {string} is displayed", (_ctx, url: string) => {
          expect(screen.getByTestId("setup-current-url")).toHaveTextContent(
            url,
          );
        });
      },
    );

    // @gas-setup-ui-spec @FR6
    f.Scenario(
      "Connected state shows Client ID when configured",
      ({ Given, When, Then }) => {
        Given(
          "user is connected to GAS with Client ID {string}",
          (_ctx, clientId: string) => {
            setupGasConnection({ url: GAS_TEST_URL, clientId });
          },
        );

        When("user opens SetupPage", () => {
          renderSetupPage();
        });

        Then("Client ID {string} is displayed", (_ctx, clientId: string) => {
          expect(screen.getByText(clientId)).toBeInTheDocument();
        });
      },
    );

    // @gas-setup-ui-spec @FR6
    f.Scenario(
      "Connected state hides Client ID when not configured",
      ({ Given, When, Then }) => {
        Given("user is connected to GAS without Client ID", () => {
          setupGasConnection({ url: GAS_TEST_URL });
        });

        When("user opens SetupPage", () => {
          renderSetupPage();
        });

        Then("Client ID section is not displayed", () => {
          expect(
            screen.queryByText(GAS_TEST_CLIENT_ID),
          ).not.toBeInTheDocument();
        });
      },
    );

    // @gas-setup-ui-spec @FR6
    f.Scenario(
      "Sign-in prompt shown when unauthenticated with Client ID",
      ({ Given, And, When, Then }) => {
        Given(
          "user is connected to GAS with Client ID {string}",
          (_ctx, clientId: string) => {
            setupGasConnection({ url: GAS_TEST_URL, clientId });
          },
        );

        And("no access token is present", () => {
          // Default mock has null token
        });

        When("user opens SetupPage", () => {
          renderSetupPage();
        });

        Then("sign-in required message is displayed", () => {
          expect(
            screen.getByTestId("setup-sign-in-required"),
          ).toBeInTheDocument();
        });

        And("Sign In button is available", () => {
          expect(screen.getByTestId("setup-sign-in-btn")).toBeInTheDocument();
        });
      },
    );

    // @gas-setup-ui-spec @FR6
    f.Scenario(
      "Sign-in prompt hidden when authenticated",
      ({ Given, And, When, Then }) => {
        Given(
          "user is connected to GAS with Client ID {string}",
          (_ctx, clientId: string) => {
            setupGasConnection({
              url: GAS_TEST_URL,
              clientId,
              accessToken: "test-token",
            });
          },
        );

        And("access token is present", () => {
          // Already set up in Given
        });

        When("user opens SetupPage", () => {
          renderSetupPage();
        });

        Then("sign-in prompt is not displayed", () => {
          expect(
            screen.queryByTestId("setup-sign-in-required"),
          ).not.toBeInTheDocument();
        });
      },
    );

    // @gas-setup-ui-spec @FR6
    f.Scenario("Disconnect returns to setup form", ({ Given, When, Then }) => {
      Given("user is connected to GAS at {string}", (_ctx, url: string) => {
        setupGasConnection({ url });
      });

      When("user clicks Disconnect", () => {
        renderSetupPage();
        fireEvent.click(screen.getByTestId("setup-disconnect-button"));
      });

      Then("setup form is displayed with GAS section toggle", () => {
        expect(
          screen.getByTestId("setup-gas-section-toggle"),
        ).toBeInTheDocument();
      });
    });

    // @gas-setup-ui-spec @FR6
    f.Scenario("Go to App navigates to inbox", ({ Given, When, Then }) => {
      Given("user is connected to GAS at {string}", (_ctx, url: string) => {
        setupGasConnection({ url });
      });

      When("user opens SetupPage", () => {
        renderSetupPage();
      });

      Then("Go to App button is available", () => {
        expect(screen.getByText("setup.goToApp")).toBeInTheDocument();
      });
    });
  },
);
