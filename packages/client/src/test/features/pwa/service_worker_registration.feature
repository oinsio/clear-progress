Feature: Service worker registration
  Implements FR2, FR8 of pwa-specs-and-tests.
  The app registers a service worker on load via useRegisterSW with prompt strategy
  and sets up periodic update checks after successful registration.

  @pwa-specs-and-tests @FR2
  Scenario: Service worker is registered on app load
    Given the app uses useRegisterSW with prompt registration strategy
    When the app loads
    Then a service worker is registered via useRegisterSW

  @pwa-specs-and-tests @FR8
  Scenario: Periodic update check is set when registration succeeds
    Given a service worker registration completed successfully
    When the onRegisteredSW callback is invoked with a valid registration
    Then a periodic update check is scheduled at the configured interval
    And each interval tick calls registration update

  @pwa-specs-and-tests @FR8
  Scenario: No periodic update check when registration is undefined
    Given a service worker registration did not produce a registration object
    When the onRegisteredSW callback is invoked without a registration
    Then no periodic update check is scheduled
