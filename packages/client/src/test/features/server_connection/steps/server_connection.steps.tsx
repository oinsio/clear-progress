// implements FR3, FR5 of simplify-backend-connection
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
    });
  });
});
