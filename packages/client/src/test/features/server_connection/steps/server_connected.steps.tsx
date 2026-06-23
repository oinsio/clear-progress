// implements FR1, FR3, FR10, FR14 of simplify-backend-connection
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, screen, waitFor } from "@testing-library/react/pure";
import { expect, vi } from "vitest";
import {
  mockDisconnect,
  mockTriggerFullSync,
  mockUseAuth,
  mockUseConnectionConfig,
  mockUseConnectionStatus,
  mockUseSync,
  renderServerSection,
  resetMocks,
} from "./serverSectionTestHelpers";

const feature = await loadFeature("../server_connected.feature");

function setupConnectedSupabase(url: string): void {
  mockUseConnectionConfig.mockReturnValue({
    type: "supabase",
    url,
    anonKey: "test-anon-key",
  });
  mockUseConnectionStatus.mockReturnValue("synced");
  mockUseAuth.mockReturnValue({
    accessToken: "test-token",
    userEmail: "test@example.com",
    userPicture: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
  });
  mockUseSync.mockReturnValue({
    syncStatus: "idle",
    triggerFullSync: mockTriggerFullSync,
  });
}

describeFeature(feature, (f) => {
  f.BeforeEachScenario(() => {
    resetMocks();
  });

  // @simplify-backend-connection @FR1 @UX2
  f.Scenario(
    "Connected Supabase shows type and URL",
    ({ Given, When, Then, And }) => {
      Given(
        'user is connected to Supabase at "https://myproject.supabase.co"',
        () => {
          setupConnectedSupabase("https://myproject.supabase.co");
        },
      );

      When("Server section is rendered", () => {
        renderServerSection();
      });

      Then('"Supabase" label is displayed', () => {
        const typeElement = screen.getByTestId("server-connected-type");
        expect(typeElement).toHaveTextContent("settings.server.typeSupabase");
      });

      And('URL "https://myproject.supabase.co" is displayed', () => {
        const urlElement = screen.getByTestId("server-connected-url");
        expect(urlElement).toHaveTextContent("https://myproject.supabase.co");
      });

      And("Anon Key is not shown", () => {
        expect(screen.queryByText("test-anon-key")).not.toBeInTheDocument();
      });
    },
  );

  // @simplify-backend-connection @FR10 @UX6
  f.Scenario("Full sync triggers synchronization", ({ Given, When, Then }) => {
    Given(
      'user is connected to Supabase at "https://myproject.supabase.co"',
      () => {
        setupConnectedSupabase("https://myproject.supabase.co");
      },
    );

    When("user requests full sync and confirms", async () => {
      renderServerSection();
      fireEvent.click(screen.getByTestId("server-full-sync"));
      await waitFor(() => {
        expect(screen.getByTestId("full-sync-dialog")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("full-sync-start-btn"));
    });

    Then("full synchronization is triggered", async () => {
      await waitFor(() => {
        expect(mockTriggerFullSync).toHaveBeenCalled();
      });
    });
  });

  // @simplify-backend-connection @FR3
  f.Scenario(
    "Expired Supabase session shows sign-in prompt",
    ({ Given, And, When, Then }) => {
      Given(
        'user is connected to Supabase at "https://myproject.supabase.co"',
        () => {
          setupConnectedSupabase("https://myproject.supabase.co");
          mockUseConnectionStatus.mockReturnValue("no_auth");
          mockUseAuth.mockReturnValue({
            accessToken: null,
            userEmail: null,
            userPicture: null,
            signIn: vi.fn(),
            signOut: vi.fn(),
            silentRefresh: vi.fn(),
          });
        },
      );

      And("Supabase session is expired", () => {
        // Already configured in Given
      });

      When("Server section is rendered", () => {
        renderServerSection();
      });

      Then("sign-in required message is displayed", () => {
        expect(
          screen.getByTestId("server-signin-required"),
        ).toBeInTheDocument();
      });

      And("Disconnect button is available", () => {
        expect(screen.getByTestId("server-disconnect")).toBeInTheDocument();
      });
    },
  );

  // @simplify-backend-connection @FR14
  f.Scenario(
    "OAuth callback with error shows message",
    ({ Given, And, When, Then }) => {
      Given(
        'user is connected to Supabase at "https://myproject.supabase.co"',
        () => {
          setupConnectedSupabase("https://myproject.supabase.co");
          mockUseConnectionStatus.mockReturnValue("no_auth");
          mockUseAuth.mockReturnValue({
            accessToken: null,
            userEmail: null,
            userPicture: null,
            signIn: vi.fn(),
            signOut: vi.fn(),
            silentRefresh: vi.fn(),
          });
        },
      );

      And("Supabase session is expired", () => {
        // Already configured in Given
      });

      When(
        'Server section is rendered with OAuth error "User cancelled"',
        () => {
          renderServerSection({ oauthError: "User cancelled" });
        },
      );

      Then('OAuth error "User cancelled" is displayed', async () => {
        await waitFor(() => {
          expect(screen.getByText("User cancelled")).toBeInTheDocument();
        });
      });

      And("sign-in required message is displayed", () => {
        expect(
          screen.getByTestId("server-signin-required"),
        ).toBeInTheDocument();
      });
    },
  );

  // @simplify-backend-connection @FR10 @UX5
  f.Scenario("Disconnect clears connection", ({ Given, When, Then, And }) => {
    Given(
      'user is connected to Supabase at "https://myproject.supabase.co"',
      () => {
        setupConnectedSupabase("https://myproject.supabase.co");
      },
    );

    When("user disconnects and confirms", async () => {
      renderServerSection();
      fireEvent.click(screen.getByTestId("server-disconnect"));
      await waitFor(() => {
        expect(screen.getByTestId("disconnect-dialog")).toBeInTheDocument();
      });
      mockUseConnectionConfig.mockReturnValue(null);
      fireEvent.click(screen.getByTestId("disconnect-confirm-btn"));
    });

    Then("connection is cleared", () => {
      expect(mockDisconnect).toHaveBeenCalled();
    });

    And("backend selection is displayed", () => {
      expect(screen.getByTestId("server-connect-supabase")).toBeInTheDocument();
    });
  });
});
