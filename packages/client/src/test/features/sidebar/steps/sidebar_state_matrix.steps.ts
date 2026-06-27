// implements FR8 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { resolveSidebarState } from "@/hooks/resolveSidebarState";
import type { SidebarEffectiveState, SidebarMode } from "@/types/common";

const feature = await loadFeature("../sidebar_state_matrix.feature");

type FeatureContext = {
  isNarrow: boolean;
  hasHover: boolean;
  sidebarMode: SidebarMode;
  effectiveState: SidebarEffectiveState;
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      f.context.isNarrow = false;
      f.context.hasHover = true;
      f.context.sidebarMode = "expanded";
      f.context.effectiveState = "expanded";
    });

    const givenScreenIsWide = (_ctx: TestContext) => {
      f.context.isNarrow = false;
    };

    const givenScreenIsNarrow = (_ctx: TestContext) => {
      f.context.isNarrow = true;
    };

    const givenDeviceSupportsHover = (_ctx: TestContext) => {
      f.context.hasHover = true;
    };

    const givenDeviceDoesNotSupportHover = (_ctx: TestContext) => {
      f.context.hasHover = false;
    };

    const givenSidebarMode = (_ctx: TestContext, mode: string) => {
      f.context.sidebarMode = mode as SidebarMode;
    };

    const whenStateIsResolved = (_ctx: TestContext) => {
      f.context.effectiveState = resolveSidebarState(
        f.context.isNarrow,
        f.context.hasHover,
        f.context.sidebarMode,
      );
    };

    const thenEffectiveStateIs = (_ctx: TestContext, expectedState: string) => {
      expect(f.context.effectiveState).toBe(expectedState);
    };

    // --- All 12 scenarios ---

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Wide screen with hover and expanded mode",
      ({ Given, And, When, Then }) => {
        Given("the screen is wide", givenScreenIsWide);
        And("the device supports hover", givenDeviceSupportsHover);
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Wide screen with hover and collapsed mode",
      ({ Given, And, When, Then }) => {
        Given("the screen is wide", givenScreenIsWide);
        And("the device supports hover", givenDeviceSupportsHover);
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Wide screen with hover and expand-on-hover mode",
      ({ Given, And, When, Then }) => {
        Given("the screen is wide", givenScreenIsWide);
        And("the device supports hover", givenDeviceSupportsHover);
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Wide screen without hover and expanded mode",
      ({ Given, And, When, Then }) => {
        Given("the screen is wide", givenScreenIsWide);
        And(
          "the device does not support hover",
          givenDeviceDoesNotSupportHover,
        );
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Wide screen without hover and collapsed mode",
      ({ Given, And, When, Then }) => {
        Given("the screen is wide", givenScreenIsWide);
        And(
          "the device does not support hover",
          givenDeviceDoesNotSupportHover,
        );
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Wide screen without hover and expand-on-hover falls back to collapsed",
      ({ Given, And, When, Then }) => {
        Given("the screen is wide", givenScreenIsWide);
        And(
          "the device does not support hover",
          givenDeviceDoesNotSupportHover,
        );
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Narrow screen with hover and expanded mode compromises to hover-ready",
      ({ Given, And, When, Then }) => {
        Given("the screen is narrow", givenScreenIsNarrow);
        And("the device supports hover", givenDeviceSupportsHover);
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Narrow screen with hover and collapsed mode",
      ({ Given, And, When, Then }) => {
        Given("the screen is narrow", givenScreenIsNarrow);
        And("the device supports hover", givenDeviceSupportsHover);
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Narrow screen with hover and expand-on-hover mode",
      ({ Given, And, When, Then }) => {
        Given("the screen is narrow", givenScreenIsNarrow);
        And("the device supports hover", givenDeviceSupportsHover);
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Narrow screen without hover and expanded mode falls back to collapsed",
      ({ Given, And, When, Then }) => {
        Given("the screen is narrow", givenScreenIsNarrow);
        And(
          "the device does not support hover",
          givenDeviceDoesNotSupportHover,
        );
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Narrow screen without hover and collapsed mode",
      ({ Given, And, When, Then }) => {
        Given("the screen is narrow", givenScreenIsNarrow);
        And(
          "the device does not support hover",
          givenDeviceDoesNotSupportHover,
        );
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );

    // @improve-sidebar-ux @FR8
    f.Scenario(
      "Narrow screen without hover and expand-on-hover falls back to collapsed",
      ({ Given, And, When, Then }) => {
        Given("the screen is narrow", givenScreenIsNarrow);
        And(
          "the device does not support hover",
          givenDeviceDoesNotSupportHover,
        );
        And("the sidebar mode is {string}", givenSidebarMode);
        When("the sidebar state is resolved", whenStateIsResolved);
        Then("the effective state is {string}", thenEffectiveStateIs);
      },
    );
  },
);
