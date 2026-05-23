// implements FR1, FR2, FR4, FR5, FR6, FR7, FR13, FR14 of add-supabase-ui
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react/pure";
import { MemoryRouter } from "react-router-dom";
import { expect, vi } from "vitest";
import { ROUTES } from "@/constants";
import SetupPage from "@/pages/SetupPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const {
  mockFetchSupabaseProviders,
  mockConnect,
  mockDisconnect,
  mockGetConnectionConfig,
  mockGetSavedConnectionConfig,
  mockSignInWithOAuth,
  mockUseAuth,
} = vi.hoisted(() => ({
  mockFetchSupabaseProviders: vi.fn(),
  mockConnect: vi.fn(),
  mockDisconnect: vi.fn(),
  mockGetConnectionConfig: vi.fn(),
  mockGetSavedConnectionConfig: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock("@clear-progress/adapter-gas", () => ({
  createGasAdapter: vi.fn(() => ({ ping: vi.fn(), init: vi.fn() })),
}));

vi.mock("@/services/connectionService", () => ({
  connect: mockConnect,
  disconnect: mockDisconnect,
  getConnectionConfig: mockGetConnectionConfig,
  getSavedConnectionConfig: mockGetSavedConnectionConfig,
}));

vi.mock("@/services/supabaseConnection", () => ({
  fetchSupabaseProviders: mockFetchSupabaseProviders,
}));

vi.mock("@/services/supabaseClientManager", () => ({
  createSupabaseClient: vi.fn(() => ({
    auth: { signInWithOAuth: mockSignInWithOAuth, onAuthStateChange: vi.fn() },
    functions: { invoke: vi.fn() },
  })),
  getSupabaseClient: vi.fn(() => ({
    auth: { signInWithOAuth: mockSignInWithOAuth, onAuthStateChange: vi.fn() },
    functions: { invoke: vi.fn() },
  })),
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
    t: (key: string) => {
      const translations: Record<string, string> = {
        "setup.supabase.signInWith": "Sign in with",
      };
      return translations[key] ?? key;
    },
  }),
}));

const feature = await loadFeature("../supabase_setup_connection.feature");

type FeatureContext = {
  providers: string[];
};

function renderSetupPage() {
  return render(
    <MemoryRouter>
      <SetupPage />
    </MemoryRouter>,
  );
}

function expandSupabaseAndFillInputs(url: string, anonKey: string) {
  renderSetupPage();
  fireEvent.click(screen.getByTestId("setup-supabase-section-toggle"));
  fireEvent.change(screen.getByTestId("setup-supabase-url-input"), {
    target: { value: url },
  });
  fireEvent.change(screen.getByTestId("setup-supabase-anon-key-input"), {
    target: { value: anonKey },
  });
}

async function connectAndWaitForProviders(providers: string[]) {
  mockFetchSupabaseProviders.mockResolvedValue(providers);
  expandSupabaseAndFillInputs("myproject", "test-anon-key");
  fireEvent.click(screen.getByTestId("setup-supabase-connect-button"));
  await waitFor(() => {
    expect(mockFetchSupabaseProviders).toHaveBeenCalled();
  });
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
      mockGetConnectionConfig.mockReturnValue(null);
      mockGetSavedConnectionConfig.mockReturnValue(null);
      mockUseAuth.mockReturnValue({
        accessToken: null,
        userEmail: null,
        signIn: vi.fn(),
        signOut: vi.fn(),
        silentRefresh: vi.fn(),
        userPicture: null,
      });
    });

    f.Background(({ Given }) => {
      Given("no active connection is configured", () => {
        mockGetConnectionConfig.mockReturnValue(null);
      });
    });

    // @add-supabase-ui @FR1
    f.Scenario(
      "Both backend sections visible on SetupPage",
      ({ When, Then, And }) => {
        When("user opens SetupPage", () => {
          renderSetupPage();
        });

        Then(
          'both "Google Apps Script" and "Supabase" sections are displayed',
          () => {
            expect(
              screen.getByTestId("setup-gas-section-toggle"),
            ).toBeInTheDocument();
            expect(
              screen.getByTestId("setup-supabase-section-toggle"),
            ).toBeInTheDocument();
          },
        );

        And("each section can be expanded and collapsed independently", () => {
          fireEvent.click(screen.getByTestId("setup-supabase-section-toggle"));
          expect(
            screen.getByTestId("setup-supabase-url-input"),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId("setup-gas-section-toggle"),
          ).toBeInTheDocument();
        });
      },
    );

    // @add-supabase-ui @FR2
    f.Scenario(
      "Connect button disabled when inputs are empty",
      ({ Given, When, Then }) => {
        Given("user expands the Supabase section", () => {
          renderSetupPage();
          fireEvent.click(screen.getByTestId("setup-supabase-section-toggle"));
        });

        When("URL field is empty", () => {
          // Field is empty by default
        });

        Then("Connect button is disabled", () => {
          expect(
            screen.getByTestId("setup-supabase-connect-button"),
          ).toBeDisabled();
        });
      },
    );

    // @add-supabase-ui @FR2
    f.Scenario(
      "Connect button enabled when both fields are filled",
      ({ Given, When, Then }) => {
        Given("user expands the Supabase section", () => {
          renderSetupPage();
          fireEvent.click(screen.getByTestId("setup-supabase-section-toggle"));
        });

        When(
          "user enters URL {string} and Anon Key {string}",
          (_ctx, url: string, anonKey: string) => {
            fireEvent.change(screen.getByTestId("setup-supabase-url-input"), {
              target: { value: url },
            });
            fireEvent.change(
              screen.getByTestId("setup-supabase-anon-key-input"),
              { target: { value: anonKey } },
            );
          },
        );

        Then("Connect button is enabled", () => {
          expect(
            screen.getByTestId("setup-supabase-connect-button"),
          ).not.toBeDisabled();
        });
      },
    );

    // @add-supabase-ui @FR4
    f.Scenario(
      "Successful connection check saves config",
      ({ Given, When, Then, And }) => {
        Given(
          "user enters URL {string} and Anon Key {string}",
          (_ctx, url: string, anonKey: string) => {
            mockFetchSupabaseProviders.mockResolvedValue(["google", "github"]);
            expandSupabaseAndFillInputs(url, anonKey);
          },
        );

        When("user clicks Connect", () => {
          fireEvent.click(screen.getByTestId("setup-supabase-connect-button"));
        });

        And("settings endpoint responds with providers {string}", async () => {
          await waitFor(() => {
            expect(mockFetchSupabaseProviders).toHaveBeenCalled();
          });
        });

        Then("connection config is saved with isActive true", async () => {
          await waitFor(() => {
            expect(mockConnect).toHaveBeenCalledWith(
              expect.objectContaining({
                type: "supabase",
                isActive: true,
              }),
            );
          });
        });

        And("OAuth provider buttons are displayed", async () => {
          await waitFor(() => {
            expect(
              screen.getByTestId("setup-supabase-oauth-buttons"),
            ).toBeInTheDocument();
          });
        });
      },
    );

    // @add-supabase-ui @FR4 @NFR-P1
    f.Scenario("Connection check timeout", ({ Given, When, Then, And }) => {
      Given(
        "user enters URL {string} and Anon Key {string}",
        (_ctx, url: string, anonKey: string) => {
          expandSupabaseAndFillInputs(url, anonKey);
        },
      );

      When("user clicks Connect", () => {
        mockFetchSupabaseProviders.mockRejectedValue(
          new Error("Supabase settings request timed out"),
        );
        fireEvent.click(screen.getByTestId("setup-supabase-connect-button"));
      });

      And("settings endpoint does not respond within timeout", () => {
        // Already set up rejection in When step
      });

      Then("timeout error is displayed", async () => {
        await waitFor(() => {
          expect(
            screen.getByTestId("setup-supabase-error"),
          ).toBeInTheDocument();
        });
      });

      And("user can retry", () => {
        expect(
          screen.getByTestId("setup-supabase-connect-button"),
        ).toBeInTheDocument();
      });
    });

    // @add-supabase-ui @FR4
    f.Scenario(
      "Connection check network error",
      ({ Given, When, Then, And }) => {
        Given(
          "user enters URL {string} and Anon Key {string}",
          (_ctx, url: string, anonKey: string) => {
            expandSupabaseAndFillInputs(url, anonKey);
          },
        );

        When("user clicks Connect", () => {
          mockFetchSupabaseProviders.mockRejectedValue(
            new Error("Network error"),
          );
          fireEvent.click(screen.getByTestId("setup-supabase-connect-button"));
        });

        And("settings endpoint returns a network error", () => {
          // Already set up in When step
        });

        Then("connection error is displayed", async () => {
          await waitFor(() => {
            expect(
              screen.getByTestId("setup-supabase-error"),
            ).toBeInTheDocument();
          });
        });

        And("user can retry", () => {
          expect(
            screen.getByTestId("setup-supabase-connect-button"),
          ).toBeInTheDocument();
        });
      },
    );

    // @add-supabase-ui @FR5
    f.Scenario("Multiple OAuth providers displayed", ({ Given, Then, And }) => {
      Given(
        "connection check succeeds with providers {string}",
        async (_ctx, providersStr: string) => {
          await connectAndWaitForProviders(providersStr.split(","));
        },
      );

      Then(
        "OAuth button {string} is displayed",
        async (_ctx, buttonLabel: string) => {
          await waitFor(() => {
            expect(screen.getByText(buttonLabel)).toBeInTheDocument();
          });
        },
      );

      And("OAuth button {string} is displayed", (_ctx, buttonLabel: string) => {
        expect(screen.getByText(buttonLabel)).toBeInTheDocument();
      });
    });

    // @add-supabase-ui @FR13
    f.Scenario("No OAuth providers configured", ({ Given, Then, And }) => {
      Given("connection check succeeds with no providers", async () => {
        await connectAndWaitForProviders([]);
      });

      Then(
        "informational message about configuring providers is displayed",
        async () => {
          await waitFor(() => {
            expect(
              screen.getByTestId("setup-supabase-no-providers"),
            ).toBeInTheDocument();
          });
        },
      );

      And("no OAuth buttons are shown", () => {
        expect(
          screen.queryByTestId("setup-supabase-oauth-buttons"),
        ).not.toBeInTheDocument();
      });
    });

    // @add-supabase-ui @FR6
    f.Scenario(
      "OAuth sign-in initiated on button click",
      ({ Given, When, Then }) => {
        Given(
          "OAuth providers are loaded with {string}",
          async (_ctx, provider: string) => {
            await connectAndWaitForProviders([provider]);
            await waitFor(() => {
              expect(
                screen.getByTestId("setup-supabase-oauth-buttons"),
              ).toBeInTheDocument();
            });
          },
        );

        When("user clicks {string} button", (_ctx, buttonLabel: string) => {
          fireEvent.click(screen.getByText(buttonLabel));
        });

        Then(
          "signInWithOAuth is called with provider {string} and redirectTo containing {string}",
          (_ctx, provider: string, redirectToSubstring: string) => {
            expect(mockSignInWithOAuth).toHaveBeenCalledWith({
              provider,
              options: expect.objectContaining({
                redirectTo: expect.stringContaining(redirectToSubstring),
              }),
            });
          },
        );
      },
    );

    // @add-supabase-ui @FR7
    f.Scenario(
      "Successful OAuth callback navigates to inbox",
      ({ Given, When, Then }) => {
        Given(
          "user returns from OAuth redirect with authorization code",
          () => {
            mockGetConnectionConfig.mockReturnValue({
              type: "supabase",
              url: "https://myproject.supabase.co",
              anonKey: "test-anon-key",
              isActive: true,
            });
            // Simulate SDK having already exchanged code for session
            mockUseAuth.mockReturnValue({
              accessToken: "supabase-access-token",
              userEmail: null,
              signIn: vi.fn(),
              signOut: vi.fn(),
              silentRefresh: vi.fn(),
              userPicture: null,
            });
            render(
              <MemoryRouter initialEntries={["/setup?code=test-auth-code"]}>
                <SetupPage />
              </MemoryRouter>,
            );
          },
        );

        When("SDK exchanges code for session successfully", () => {
          // Token already available via mock — SDK exchange simulated
        });

        Then("app navigates to inbox", async () => {
          await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX);
          });
        });
      },
    );

    // @add-supabase-ui @FR7
    f.Scenario(
      "OAuth callback with error shows message",
      ({ Given, Then, And }) => {
        Given("user returns from OAuth redirect with an error", async () => {
          mockGetConnectionConfig.mockReturnValue({
            type: "supabase",
            url: "https://myproject.supabase.co",
            anonKey: "test-anon-key",
            isActive: true,
          });
          mockFetchSupabaseProviders.mockResolvedValue(["google"]);
          render(
            <MemoryRouter
              initialEntries={[
                "/setup?error=access_denied&error_description=User+cancelled",
              ]}
            >
              <SetupPage />
            </MemoryRouter>,
          );
          await waitFor(() => {
            expect(mockFetchSupabaseProviders).toHaveBeenCalled();
          });
        });

        Then("error message is displayed on SetupPage", async () => {
          await waitFor(() => {
            expect(
              screen.getByTestId("setup-supabase-error"),
            ).toBeInTheDocument();
          });
        });

        And("OAuth provider buttons remain available for retry", async () => {
          await waitFor(() => {
            expect(
              screen.getByTestId("setup-supabase-oauth-buttons"),
            ).toBeInTheDocument();
          });
        });
      },
    );

    // @add-supabase-ui @FR14
    f.Scenario(
      "Connected state shows project URL",
      ({ Given, When, Then, And }) => {
        Given(
          "user is connected to Supabase at {string}",
          (_ctx, url: string) => {
            mockGetConnectionConfig.mockReturnValue({
              type: "supabase",
              url,
              anonKey: "test-anon-key",
              isActive: true,
            });
          },
        );

        When("user opens SetupPage", () => {
          renderSetupPage();
        });

        Then("project URL {string} is displayed", (_ctx, url: string) => {
          expect(screen.getByText(url)).toBeInTheDocument();
        });

        And("Anon Key is not shown", () => {
          expect(screen.queryByText("test-anon-key")).not.toBeInTheDocument();
        });
      },
    );

    // @add-supabase-ui @FR14
    f.Scenario(
      "Connected state with expired session shows OAuth buttons",
      ({ Given, When, Then, And }) => {
        Given(
          "user is connected to Supabase at {string}",
          (_ctx, url: string) => {
            mockGetConnectionConfig.mockReturnValue({
              type: "supabase",
              url,
              anonKey: "test-anon-key",
              isActive: true,
            });
          },
        );

        And("Supabase session is expired", () => {
          // No active session — useAuth returns null accessToken (default mock)
        });

        When("user opens SetupPage", () => {
          renderSetupPage();
        });

        Then(
          "OAuth provider buttons are displayed for re-authentication",
          () => {
            expect(
              screen.getByTestId("setup-supabase-oauth-buttons"),
            ).toBeInTheDocument();
          },
        );

        And("Disconnect button is available", () => {
          expect(
            screen.getByTestId("setup-disconnect-button"),
          ).toBeInTheDocument();
        });
      },
    );
  },
);
