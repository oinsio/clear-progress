// implements FR1, FR2, FR3, FR4, FR8, FR9, FR11 of supabase-email-auth
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { fireEvent, screen, waitFor } from "@testing-library/react/pure";
import { expect } from "vitest";
import {
  fillSupabaseForm,
  mockDisconnect,
  mockFetchSupabaseProviders,
  mockSignInWithOtp,
  navigateToOtpScreen,
  resetMocks,
  selectSupabase,
} from "../../server_connection/steps/serverSectionTestHelpers";

const feature = await loadFeature("../email_otp_auth.feature");

describeFeature(feature, (f) => {
  f.BeforeEachScenario(() => {
    resetMocks();
  });

  // @supabase-email-auth @FR1
  f.Scenario(
    "Email input visible when email auth enabled",
    ({ Given, When, Then }) => {
      Given("Supabase project has email and OAuth enabled", () => {
        mockFetchSupabaseProviders.mockResolvedValue({
          oauthProviders: ["google"],
          isEmailEnabled: true,
        });
      });

      When("providers screen is displayed", () => {
        selectSupabase();
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
      });

      Then("email input and divider are shown", async () => {
        await waitFor(() => {
          expect(screen.getByTestId("server-email-input")).toBeInTheDocument();
        });
        expect(screen.getByTestId("server-email-divider")).toBeInTheDocument();
      });
    },
  );

  // @supabase-email-auth @FR1
  f.Scenario(
    "Email input hidden when email auth disabled",
    ({ Given, When, Then }) => {
      Given("Supabase project has only OAuth enabled", () => {
        mockFetchSupabaseProviders.mockResolvedValue({
          oauthProviders: ["google"],
          isEmailEnabled: false,
        });
      });

      When("providers screen is displayed", () => {
        selectSupabase();
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
      });

      Then("no email input is shown", async () => {
        await waitFor(() => {
          expect(
            screen.getByTestId("server-oauth-buttons"),
          ).toBeInTheDocument();
        });
        expect(
          screen.queryByTestId("server-email-input"),
        ).not.toBeInTheDocument();
      });
    },
  );

  // @supabase-email-auth @FR11
  f.Scenario(
    "Send button disabled when email empty",
    ({ Given, When, Then }) => {
      Given("email input is visible", async () => {
        mockFetchSupabaseProviders.mockResolvedValue({
          oauthProviders: ["google"],
          isEmailEnabled: true,
        });
        selectSupabase();
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
        await waitFor(() => {
          expect(screen.getByTestId("server-email-input")).toBeInTheDocument();
        });
      });

      When("email field is empty", () => {
        // Email is empty by default after render
      });

      Then("Send code button is disabled", () => {
        expect(screen.getByTestId("server-email-send")).toBeDisabled();
      });
    },
  );

  // @supabase-email-auth @FR2
  f.Scenario(
    "OTP sent successfully transitions to verification",
    ({ Given, When, Then }) => {
      Given("user enters email and requests code", async () => {
        mockFetchSupabaseProviders.mockResolvedValue({
          oauthProviders: ["google"],
          isEmailEnabled: true,
        });
        selectSupabase();
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
        await waitFor(() => {
          expect(screen.getByTestId("server-email-input")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByTestId("server-email-input"), {
          target: { value: "user@example.com" },
        });
      });

      When("OTP is sent successfully", () => {
        mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
        fireEvent.click(screen.getByTestId("server-email-send"));
      });

      Then(
        "OTP verification screen is shown with email displayed",
        async () => {
          await waitFor(() => {
            expect(screen.getByTestId("server-otp-input")).toBeInTheDocument();
          });
          expect(screen.getByTestId("server-otp-email")).toBeInTheDocument();
        },
      );
    },
  );

  // @supabase-email-auth @FR3
  f.Scenario(
    "OTP verification screen shows required elements",
    ({ Given, Then }) => {
      Given("user is on OTP verification screen", async () => {
        selectSupabase();
        await navigateToOtpScreen();
      });

      Then(
        "OTP input, verify button, magic link hint, and back button are visible",
        () => {
          expect(screen.getByTestId("server-otp-input")).toBeInTheDocument();
          expect(screen.getByTestId("server-otp-verify")).toBeInTheDocument();
          expect(screen.getByTestId("server-otp-hint")).toBeInTheDocument();
          expect(screen.getByTestId("server-otp-back")).toBeInTheDocument();
        },
      );
    },
  );

  // @supabase-email-auth @FR4
  f.Scenario(
    "Verify button disabled when code is empty",
    ({ Given, When, Then }) => {
      Given("user is on OTP verification screen", async () => {
        selectSupabase();
        await navigateToOtpScreen();
      });

      When("code input is empty", () => {
        // OTP input is empty by default after navigating to OTP screen
      });

      Then("verify button is disabled", () => {
        expect(screen.getByTestId("server-otp-verify")).toBeDisabled();
      });
    },
  );

  // @supabase-email-auth @FR9
  f.Scenario(
    "Back button returns to providers without disconnecting",
    ({ Given, When, Then, And }) => {
      Given("user is on OTP verification screen", async () => {
        selectSupabase();
        await navigateToOtpScreen();
      });

      When("user navigates back from OTP screen", () => {
        fireEvent.click(screen.getByTestId("server-otp-back"));
      });

      Then("providers screen is shown", async () => {
        await waitFor(() => {
          expect(screen.getByTestId("server-email-input")).toBeInTheDocument();
        });
      });

      And("connection is not disconnected", () => {
        expect(mockDisconnect).not.toHaveBeenCalled();
      });
    },
  );

  // @supabase-email-auth @FR1 @FR8
  f.Scenario(
    "Email form shown when only email enabled",
    ({ Given, When, Then, And }) => {
      Given("only email auth is enabled without OAuth", () => {
        mockFetchSupabaseProviders.mockResolvedValue({
          oauthProviders: [],
          isEmailEnabled: true,
        });
      });

      When("providers screen is displayed", () => {
        selectSupabase();
        fillSupabaseForm("myproject", "test-key");
        fireEvent.click(screen.getByTestId("server-supabase-connect"));
      });

      Then("email input is shown without divider", async () => {
        await waitFor(() => {
          expect(screen.getByTestId("server-email-input")).toBeInTheDocument();
        });
        expect(
          screen.queryByTestId("server-email-divider"),
        ).not.toBeInTheDocument();
      });

      And("no-providers warning is not shown", () => {
        expect(
          screen.queryByTestId("server-no-providers"),
        ).not.toBeInTheDocument();
      });
    },
  );
});
