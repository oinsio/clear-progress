Feature: Google Sheets data coercion
  Implements FR9 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Boolean true from native boolean
    When coercing native boolean true
    Then boolean result is true

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Boolean true from sheet string TRUE
    When coercing sheet string "TRUE"
    Then boolean result is true

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Boolean false from native boolean false
    When coercing native boolean false
    Then boolean result is false

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Boolean false from empty value
    When coercing empty string
    Then boolean result is false

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Boolean false from null
    When coercing null value
    Then boolean result is false

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Timestamp from Date object
    When converting Date object to ISO string
    Then ISO string has milliseconds suffix

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Timestamp normalizes missing fractional seconds
    When converting timestamp without fractional seconds
    Then fractional seconds are padded to three digits

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Timestamp preserves already normalized value
    When converting already normalized timestamp
    Then timestamp is returned unchanged

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Timestamp from empty value returns empty
    When converting empty value to ISO string
    Then ISO string result is empty

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Date-only from Date object
    When converting Date object to ISO date
    Then ISO date contains only date part

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Date-only strips apostrophe prefix
    When converting apostrophe-prefixed date string
    Then apostrophe is removed from date

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Date-only from ISO timestamp extracts date
    When converting ISO timestamp to date-only
    Then only date portion is returned

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Date-only from empty returns empty
    When converting empty value to ISO date
    Then ISO date result is empty

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Normalize date adds apostrophe for sheet storage
    When normalizing ISO date for sheet storage
    Then result has leading apostrophe

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Normalize date preserves existing apostrophe
    When normalizing already apostrophe-prefixed date
    Then apostrophe-prefixed date is unchanged

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Normalize date from empty returns empty
    When normalizing empty value for sheet date
    Then normalized date result is empty

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Normalize date from null returns empty
    When normalizing null for sheet date
    Then normalized date result is empty

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Box coercion with valid value
    When coercing valid box value "today"
    Then box result is "today"

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Box coercion with invalid value falls back to default
    When coercing invalid box value "nonexistent"
    Then box result is "inbox"

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Box coercion with missing value falls back to default
    When coercing missing box value
    Then box result is "inbox"

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Goal status coercion with valid value
    When coercing valid goal status "in_progress"
    Then goal status result is "in_progress"

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Goal status coercion with invalid value falls back to default
    When coercing invalid goal status "unknown"
    Then goal status result is "planning"

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Date-only column detection for Tasks sheet
    When checking if "next_date" is date-only in "Tasks"
    Then column is date-only

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Non-date column detection for Tasks sheet
    When checking if "name" is date-only in "Tasks"
    Then column is not date-only

  @gas-adapter-specs-and-bdd @FR9
  Scenario: Date-only column detection for sheet without date columns
    When checking if "name" is date-only in "Goals"
    Then column is not date-only
