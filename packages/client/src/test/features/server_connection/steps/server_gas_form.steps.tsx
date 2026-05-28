// implements FR4, FR7, FR9, FR15 of simplify-backend-connection
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, screen, waitFor } from "@testing-library/react/pure";
import { expect } from "vitest";
import {
  fillGasForm,
  mockConnect,
  mockPing,
  mockUseConnectionConfig,
  resetMocks,
  selectGas,
} from "./serverSectionTestHelpers";

const feature = await loadFeature("../server_gas_form.feature");

describeFeature(feature, (f) => {
  f.BeforeEachScenario(() => {
    resetMocks();
    mockUseConnectionConfig.mockReturnValue(null);
    selectGas();
  });

  f.Background(({ Given, And }) => {
    Given("no backend is connected", () => {
      // Configured in BeforeEachScenario
    });

    And('user has selected "Connect Google Apps Script"', () => {
      // Rendered in BeforeEachScenario
    });
  });

  // @simplify-backend-connection @FR7
  f.Scenario("Connect disabled when URL is empty", ({ When, Then }) => {
    When("URL field is empty", () => {
      // Field is empty by default after render
    });

    Then("Connect button is disabled", () => {
      expect(screen.getByTestId("server-gas-connect")).toBeDisabled();
    });
  });

  // @simplify-backend-connection @FR7 @FR15
  f.Scenario("Connect disabled when Client ID is empty", ({ When, Then }) => {
    When("user enters URL but Client ID is empty", () => {
      fireEvent.change(screen.getByTestId("server-gas-url"), {
        target: { value: "https://script.google.com/macros/s/ABC/exec" },
      });
    });

    Then("Connect button is disabled", () => {
      expect(screen.getByTestId("server-gas-connect")).toBeDisabled();
    });
  });

  // @simplify-backend-connection @FR7 @FR15
  f.Scenario("Connect enabled when both fields filled", ({ When, Then }) => {
    When("user enters URL and Client ID", () => {
      fillGasForm("https://script.google.com/macros/s/ABC/exec", "123456789");
    });

    Then("Connect button is enabled", () => {
      expect(screen.getByTestId("server-gas-connect")).not.toBeDisabled();
    });
  });

  // @simplify-backend-connection @FR4 @FR9 @FR15
  f.Scenario(
    "Successful connection to initialized backend shows sign-in",
    ({ Given, When, And, Then }) => {
      Given(
        'user enters URL "https://script.google.com/macros/s/ABC/exec" and Client ID "123456789"',
        () => {
          fillGasForm(
            "https://script.google.com/macros/s/ABC/exec",
            "123456789",
          );
        },
      );

      When("user connects", () => {
        mockPing.mockResolvedValue({ ok: true, initialized: true });
        fireEvent.click(screen.getByTestId("server-gas-connect"));
      });

      And("ping responds with ok and initialized", () => {
        // Already set up in When step
      });

      Then("connection config is saved", async () => {
        await waitFor(() => {
          expect(mockConnect).toHaveBeenCalledWith(
            expect.objectContaining({
              type: "gas",
              isActive: true,
            }),
          );
        });
      });

      And('"Sign in with Google" button is displayed', async () => {
        await waitFor(() => {
          expect(
            screen.getByTestId("server-gas-signin-button"),
          ).toBeInTheDocument();
        });
      });
    },
  );

  // @simplify-backend-connection @FR4 @FR9 @FR15
  f.Scenario(
    "Successful connection to uninitialized backend shows sign-in",
    ({ Given, When, And, Then }) => {
      Given(
        'user enters URL "https://script.google.com/macros/s/ABC/exec" and Client ID "123456789"',
        () => {
          fillGasForm(
            "https://script.google.com/macros/s/ABC/exec",
            "123456789",
          );
        },
      );

      When("user connects", () => {
        mockPing.mockResolvedValue({ ok: true, initialized: false });
        fireEvent.click(screen.getByTestId("server-gas-connect"));
      });

      And("ping responds with ok but not initialized", () => {
        // Already set up in When step
      });

      Then('"Sign in with Google" button is displayed', async () => {
        await waitFor(() => {
          expect(
            screen.getByTestId("server-gas-signin-button"),
          ).toBeInTheDocument();
        });
      });
    },
  );

  // @simplify-backend-connection @FR4 @UX3
  f.Scenario(
    "Ping failure shows connection error",
    ({ Given, When, And, Then }) => {
      Given(
        'user enters URL "https://bad-url.com" and Client ID "123456789"',
        () => {
          fillGasForm("https://bad-url.com", "123456789");
        },
      );

      When("user connects", () => {
        mockPing.mockResolvedValue({ ok: false });
        fireEvent.click(screen.getByTestId("server-gas-connect"));
      });

      And("ping responds with not ok", () => {
        // Already set up in When step
      });

      Then("connection error is displayed inline", async () => {
        await waitFor(() => {
          expect(screen.getByTestId("server-gas-error")).toBeInTheDocument();
        });
      });

      And("user can retry", () => {
        expect(screen.getByTestId("server-gas-connect")).toBeInTheDocument();
      });
    },
  );

  // @simplify-backend-connection @FR4 @UX3
  f.Scenario(
    "Network error shows connection error",
    ({ Given, When, And, Then }) => {
      Given(
        'user enters URL "https://unreachable.com" and Client ID "123456789"',
        () => {
          fillGasForm("https://unreachable.com", "123456789");
        },
      );

      When("user connects", () => {
        mockPing.mockRejectedValue(new Error("Network error"));
        fireEvent.click(screen.getByTestId("server-gas-connect"));
      });

      And("ping throws a network error", () => {
        // Already set up in When step
      });

      Then("connection error is displayed inline", async () => {
        await waitFor(() => {
          expect(screen.getByTestId("server-gas-error")).toBeInTheDocument();
        });
      });

      And("user can retry", () => {
        expect(screen.getByTestId("server-gas-connect")).toBeInTheDocument();
      });
    },
  );

  // @simplify-backend-connection @FR9 @FR15 @UX4
  f.Scenario("Connecting state disables form", ({ Given, When, Then, And }) => {
    Given(
      'user enters URL "https://script.google.com/macros/s/ABC/exec" and Client ID "123456789"',
      () => {
        fillGasForm("https://script.google.com/macros/s/ABC/exec", "123456789");
      },
    );

    When("user connects", () => {
      // Never-resolving promise to keep the loading state
      mockPing.mockReturnValue(new Promise(() => {}));
      fireEvent.click(screen.getByTestId("server-gas-connect"));
    });

    Then("loading indicator is displayed", async () => {
      await waitFor(() => {
        expect(
          screen.getByTestId("server-supabase-loading"),
        ).toBeInTheDocument();
      });
    });

    And("Connect button is disabled", () => {
      expect(screen.getByTestId("server-supabase-connect")).toBeDisabled();
    });
  });
});
