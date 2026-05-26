// implements FR1, FR2, FR3 of drag-and-drop-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import { PointerSensor, TouchSensor } from "@dnd-kit/core";
import { renderHook } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import { useDndSensors } from "@/hooks/useDndSensors";

const EXPECTED_POINTER_DISTANCE_PX = 8;
const EXPECTED_TOUCH_DELAY_MS = 250;
const EXPECTED_TOUCH_TOLERANCE_PX = 5;
const EXPECTED_SENSOR_COUNT = 2;

const feature = await loadFeature("../drag_and_drop_sensors.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let sensors: SensorDescriptor<SensorOptions>[];

    function callUseDndSensors(): void {
      const { result } = renderHook(() => useDndSensors());
      sensors = result.current;
    }

    function findSensorByType(
      sensorClass: new (...args: never[]) => unknown,
    ): SensorDescriptor<SensorOptions> | undefined {
      return sensors.find((descriptor) => descriptor.sensor === sensorClass);
    }

    // @drag-and-drop-spec @FR1
    f.Scenario("Pointer sensor uses distance constraint", ({ When, Then }) => {
      When("useDndSensors is called", (_ctx: TestContext) => {
        callUseDndSensors();
      });

      Then(
        "the pointer sensor has a distance constraint of 8 pixels",
        (_ctx: TestContext) => {
          const pointerDescriptor = findSensorByType(PointerSensor);
          expect(pointerDescriptor).toBeDefined();
          const options = pointerDescriptor?.options as {
            activationConstraint?: { distance?: number };
          };
          expect(options.activationConstraint?.distance).toBe(
            EXPECTED_POINTER_DISTANCE_PX,
          );
        },
      );
    });

    // @drag-and-drop-spec @FR2
    f.Scenario(
      "Touch sensor uses delay and tolerance constraints",
      ({ When, Then, And }) => {
        When("useDndSensors is called", (_ctx: TestContext) => {
          callUseDndSensors();
        });

        Then(
          "the touch sensor has a delay of 250 milliseconds",
          (_ctx: TestContext) => {
            const touchDescriptor = findSensorByType(TouchSensor);
            expect(touchDescriptor).toBeDefined();
            const options = touchDescriptor?.options as {
              activationConstraint?: { delay?: number };
            };
            expect(options.activationConstraint?.delay).toBe(
              EXPECTED_TOUCH_DELAY_MS,
            );
          },
        );

        And(
          "the touch sensor has a tolerance of 5 pixels",
          (_ctx: TestContext) => {
            const touchDescriptor = findSensorByType(TouchSensor);
            expect(touchDescriptor).toBeDefined();
            const options = touchDescriptor?.options as {
              activationConstraint?: { tolerance?: number };
            };
            expect(options.activationConstraint?.tolerance).toBe(
              EXPECTED_TOUCH_TOLERANCE_PX,
            );
          },
        );
      },
    );

    // @drag-and-drop-spec @FR3
    f.Scenario("Hook returns two sensors", ({ When, Then }) => {
      When("useDndSensors is called", (_ctx: TestContext) => {
        callUseDndSensors();
      });

      Then(
        "the result contains exactly 2 sensor entries",
        (_ctx: TestContext) => {
          expect(sensors).toHaveLength(EXPECTED_SENSOR_COUNT);
        },
      );
    });
  },
);
