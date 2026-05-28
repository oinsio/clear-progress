// implements FR2, FR3, FR4, FR5 of simplify-backend-connection
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, screen } from "@testing-library/react/pure";
import { expect } from "vitest";
import {
  mockUseConnectionConfig,
  renderServerSection,
  resetMocks,
  selectSupabase,
} from "./serverSectionTestHelpers";

const feature = await loadFeature("../server_connection.feature");

describeFeature(feature, (f) => {
  f.BeforeEachScenario(() => {
    resetMocks();
    mockUseConnectionConfig.mockReturnValue(null);
  });

  f.Background(({ Given }) => {
    Given("no backend is connected", () => {
      // Configured in BeforeEachScenario
    });
  });

  // @simplify-backend-connection @FR2 @UX1
  f.Scenario("Backend selection shows Supabase first", ({ When, Then }) => {
    When("Server section is rendered", () => {
      renderServerSection();
    });

    Then(
      '"Connect Supabase" button is displayed before "Connect Google Apps Script" button',
      () => {
        const supabaseButton = screen.getByTestId("server-connect-supabase");
        const gasButton = screen.getByTestId("server-connect-gas");
        expect(supabaseButton).toBeInTheDocument();
        expect(gasButton).toBeInTheDocument();

        const allButtons = screen.getAllByRole("button");
        const supabaseIndex = allButtons.indexOf(supabaseButton);
        const gasIndex = allButtons.indexOf(gasButton);
        expect(supabaseIndex).toBeLessThan(gasIndex);
      },
    );
  });

  // @simplify-backend-connection @FR3
  f.Scenario(
    "Selecting Supabase shows connection form",
    ({ When, Then, And }) => {
      When('user selects "Connect Supabase"', () => {
        renderServerSection();
        fireEvent.click(screen.getByTestId("server-connect-supabase"));
      });

      Then("Supabase connection form is displayed", () => {
        expect(screen.getByTestId("server-supabase-url")).toBeInTheDocument();
        expect(
          screen.getByTestId("server-supabase-anon-key"),
        ).toBeInTheDocument();
      });

      And('"Connect" and "Cancel" buttons are shown', () => {
        expect(
          screen.getByTestId("server-supabase-connect"),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("server-supabase-cancel"),
        ).toBeInTheDocument();
      });
    },
  );

  // @simplify-backend-connection @FR4
  f.Scenario("Selecting GAS shows connection form", ({ When, Then, And }) => {
    When('user selects "Connect Google Apps Script"', () => {
      renderServerSection();
      fireEvent.click(screen.getByTestId("server-connect-gas"));
    });

    Then("GAS connection form is displayed", () => {
      expect(screen.getByTestId("server-gas-url")).toBeInTheDocument();
      expect(screen.getByTestId("server-gas-client-id")).toBeInTheDocument();
    });

    And('"Connect" and "Cancel" buttons are shown', () => {
      expect(screen.getByTestId("server-gas-connect")).toBeInTheDocument();
      expect(screen.getByTestId("server-gas-cancel")).toBeInTheDocument();
    });
  });

  // @simplify-backend-connection @FR5
  f.Scenario("Cancel returns to backend selection", ({ Given, When, Then }) => {
    Given('user has selected "Connect Supabase"', () => {
      selectSupabase();
    });

    When("user cancels the form", () => {
      fireEvent.click(screen.getByTestId("server-supabase-cancel"));
    });

    Then("backend selection buttons are displayed", () => {
      expect(screen.getByTestId("server-connect-supabase")).toBeInTheDocument();
      expect(screen.getByTestId("server-connect-gas")).toBeInTheDocument();
    });
  });
});
