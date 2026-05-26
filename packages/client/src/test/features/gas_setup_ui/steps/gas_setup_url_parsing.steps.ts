// implements FR2, FR7 of gas-setup-ui-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { parseClientId } from "@/utils/clientId";
import { parseGasInput } from "@/utils/gasUrl";

const feature = await loadFeature("../gas_setup_url_parsing.feature");

type FeatureContext = {
  parseResult: string;
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    // @gas-setup-ui-spec @FR2
    f.Scenario(
      "Plain Deployment ID resolved to full GAS URL",
      ({ When, Then }) => {
        let parseResult = "";

        When("parseGasInput receives {string}", (_ctx, input: string) => {
          parseResult = parseGasInput(input);
        });

        Then("result is {string}", (_ctx, expected: string) => {
          expect(parseResult).toBe(expected);
        });
      },
    );

    // @gas-setup-ui-spec @FR2
    f.Scenario("Full URL passed through unchanged", ({ When, Then }) => {
      let parseResult = "";

      When("parseGasInput receives {string}", (_ctx, input: string) => {
        parseResult = parseGasInput(input);
      });

      Then("result is {string}", (_ctx, expected: string) => {
        expect(parseResult).toBe(expected);
      });
    });

    // @gas-setup-ui-spec @FR2
    f.Scenario("Whitespace trimmed before resolving", ({ When, Then }) => {
      let parseResult = "";

      When("parseGasInput receives {string}", (_ctx, input: string) => {
        parseResult = parseGasInput(input);
      });

      Then("result is {string}", (_ctx, expected: string) => {
        expect(parseResult).toBe(expected);
      });
    });

    // @gas-setup-ui-spec @FR7
    f.Scenario(
      "Plain Client ID gets Google suffix appended",
      ({ When, Then }) => {
        let parseResult = "";

        When("parseClientId receives {string}", (_ctx, input: string) => {
          parseResult = parseClientId(input);
        });

        Then("result is {string}", (_ctx, expected: string) => {
          expect(parseResult).toBe(expected);
        });
      },
    );

    // @gas-setup-ui-spec @FR7
    f.Scenario("Full Client ID passed through unchanged", ({ When, Then }) => {
      let parseResult = "";

      When("parseClientId receives {string}", (_ctx, input: string) => {
        parseResult = parseClientId(input);
      });

      Then("result is {string}", (_ctx, expected: string) => {
        expect(parseResult).toBe(expected);
      });
    });
  },
);
