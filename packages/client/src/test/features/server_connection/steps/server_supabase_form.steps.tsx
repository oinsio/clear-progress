// implements FR3, FR6, FR8 of simplify-backend-connection
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, screen, waitFor } from "@testing-library/react/pure";
import { expect } from "vitest";
import {
  fillSupabaseForm,
  mockConnect,
  mockDisconnect,
  mockFetchSupabaseProviders,
  mockSignInWithOAuth,
  mockUseConnectionConfig,
  resetMocks,
  selectSupabase,
} from "./serverSectionTestHelpers";

const feature = await loadFeature("../server_supabase_form.feature");

describeFeature(feature, (f) => {
  f.BeforeEachScenario(() => {
    resetMocks();
    mockUseConnectionConfig.mockReturnValue(null);
    selectSupabase();
  });

  f.Background(({ Given, And }) => {
    Given("no backend is connected", () => {
      // Configured in BeforeEachScenario
    });

    And('user has selected "Connect Supabase"', () => {
      // Rendered in BeforeEachScenario
    });
  });

  // @simplify-backend-connection @FR6
  f.Scenario("Connect disabled when fields are empty", ({ When, Then }) => {
    When("both URL and Anon Key fields are empty", () => {
      // Fields are empty by default after render
    });

    Then("Connect button is disabled", () => {
      expect(screen.getByTestId("server-supabase-connect")).toBeDisabled();
    });
  });

  // @simplify-backend-connection @FR6
  f.Scenario(
    "Connect enabled when both fields are filled",
    ({ When, Then }) => {
      When("user enters Project URL and Anon Key", () => {
        fillSupabaseForm("https://myproject.supabase.co", "test-anon-key");
      });

      Then("Connect button is enabled", () => {
        expect(
          screen.getByTestId("server-supabase-connect"),
        ).not.toBeDisabled();
      });
    },
  );

  // @simplify-backend-connection @FR3
  f.Scenario("Anon Key input is plain text", ({ Then }) => {
    Then('Anon Key input has type "text"', () => {
      const anonKeyInput = screen.getByTestId("server-supabase-anon-key");
      expect(anonKeyInput).toHaveAttribute("type", "text");
    });
  });

  // @simplify-backend-connection @FR3 @UX4
  f.Scenario(
    "Successful connection shows OAuth providers",
    ({ Given, When, And, Then }) => {
      Given('user enters URL "myproject" and Anon Key "test-key"', () => {
        fillSupabaseForm("myproject", "test-key");
      });

      When("user connects", () => {
        mockFetchSupabaseProviders.mockResolvedValue(["google", "github"]);
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
      });

      And(
        'settings endpoint responds with providers "google,github"',
        async () => {
          await waitFor(() => {
            expect(mockFetchSupabaseProviders).toHaveBeenCalled();
          });
        },
      );

      Then("connection config is saved", async () => {
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
            screen.getByTestId("server-oauth-buttons"),
          ).toBeInTheDocument();
        });
      });
    },
  );

  // @simplify-backend-connection @FR3 @UX3
  f.Scenario(
    "Connection failure shows inline error",
    ({ Given, When, And, Then }) => {
      Given('user enters URL "badproject" and Anon Key "test-key"', () => {
        fillSupabaseForm("badproject", "test-key");
      });

      When("user connects", () => {
        mockFetchSupabaseProviders.mockRejectedValue(
          new Error("Connection failed"),
        );
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
      });

      And("settings endpoint returns an error", () => {
        // Already set up in When step
      });

      Then("connection error is displayed inline", async () => {
        await waitFor(() => {
          expect(
            screen.getByTestId("server-supabase-error"),
          ).toBeInTheDocument();
        });
      });

      And("user can retry", () => {
        expect(
          screen.getByTestId("server-supabase-connect"),
        ).toBeInTheDocument();
      });
    },
  );

  // @simplify-backend-connection @FR3 @UX3
  f.Scenario("Connection timeout shows error", ({ Given, When, And, Then }) => {
    Given('user enters URL "slowproject" and Anon Key "test-key"', () => {
      fillSupabaseForm("slowproject", "test-key");
    });

    When("user connects", () => {
      mockFetchSupabaseProviders.mockRejectedValue(
        new Error("Request timed out"),
      );
      fireEvent.click(screen.getByTestId("server-supabase-connect"));
    });

    And("settings endpoint does not respond within timeout", () => {
      // Already set up in When step
    });

    Then("timeout error is displayed inline", async () => {
      await waitFor(() => {
        expect(screen.getByTestId("server-supabase-error")).toBeInTheDocument();
      });
    });
  });

  // @simplify-backend-connection @FR8
  f.Scenario("Multiple OAuth providers displayed", ({ Given, Then, And }) => {
    Given(
      'connection check succeeds with providers "google,github"',
      async () => {
        mockFetchSupabaseProviders.mockResolvedValue(["google", "github"]);
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
        await waitFor(() => {
          expect(mockFetchSupabaseProviders).toHaveBeenCalled();
        });
      },
    );

    Then('OAuth button for "google" is displayed', async () => {
      await waitFor(() => {
        expect(screen.getByTestId("server-oauth-google")).toBeInTheDocument();
      });
    });

    And('OAuth button for "github" is displayed', () => {
      expect(screen.getByTestId("server-oauth-github")).toBeInTheDocument();
    });
  });

  // @simplify-backend-connection @FR8
  f.Scenario(
    "OAuth sign-in initiated on button click",
    ({ Given, When, Then }) => {
      Given('OAuth providers are loaded with "google"', async () => {
        mockFetchSupabaseProviders.mockResolvedValue(["google"]);
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
        await waitFor(() => {
          expect(
            screen.getByTestId("server-oauth-buttons"),
          ).toBeInTheDocument();
        });
      });

      When('user clicks the OAuth "google" button', () => {
        fireEvent.click(screen.getByTestId("server-oauth-google"));
      });

      Then('signInWithOAuth is called with provider "google"', () => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider: "google",
          options: expect.objectContaining({
            redirectTo: expect.stringContaining("/settings"),
          }),
        });
      });
    },
  );

  // @simplify-backend-connection @FR8
  f.Scenario(
    "No providers shows informational message",
    ({ Given, Then, And }) => {
      Given("connection check succeeds with no providers", async () => {
        mockFetchSupabaseProviders.mockResolvedValue([]);
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
        await waitFor(() => {
          expect(mockFetchSupabaseProviders).toHaveBeenCalled();
        });
      });

      Then("no-providers informational message is displayed", async () => {
        await waitFor(() => {
          expect(screen.getByTestId("server-no-providers")).toBeInTheDocument();
        });
      });

      And("no OAuth buttons are shown", () => {
        expect(
          screen.queryByTestId("server-oauth-buttons"),
        ).not.toBeInTheDocument();
      });
    },
  );

  // @simplify-backend-connection @FR16
  f.Scenario(
    "Cancel from OAuth providers disconnects and returns to form",
    ({ Given, When, Then, And }) => {
      Given('connection check succeeds with providers "google"', async () => {
        mockFetchSupabaseProviders.mockResolvedValue(["google"]);
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
        await waitFor(() => {
          expect(
            screen.getByTestId("server-oauth-buttons"),
          ).toBeInTheDocument();
        });
      });

      When("user clicks Cancel on OAuth providers", () => {
        fireEvent.click(screen.getByTestId("server-oauth-cancel"));
      });

      Then("connection is disconnected", () => {
        expect(mockDisconnect).toHaveBeenCalled();
      });

      And("Supabase connection form is displayed", () => {
        expect(screen.getByTestId("server-supabase-url")).toBeInTheDocument();
      });
    },
  );

  // @simplify-backend-connection @FR16
  f.Scenario(
    "Cancel from no-providers message returns to form",
    ({ Given, When, Then, And }) => {
      Given("connection check succeeds with no providers", async () => {
        mockFetchSupabaseProviders.mockResolvedValue([]);
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
        await waitFor(() => {
          expect(screen.getByTestId("server-no-providers")).toBeInTheDocument();
        });
      });

      When("user clicks Cancel on OAuth providers", () => {
        fireEvent.click(screen.getByTestId("server-oauth-cancel"));
      });

      Then("connection is disconnected", () => {
        expect(mockDisconnect).toHaveBeenCalled();
      });

      And("Supabase connection form is displayed", () => {
        expect(screen.getByTestId("server-supabase-url")).toBeInTheDocument();
      });
    },
  );
});
