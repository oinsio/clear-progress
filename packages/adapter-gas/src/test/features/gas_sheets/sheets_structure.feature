Feature: Google Sheets structure and schema
  Implements FR8 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Eight sheet names are defined
    Then SHEET_NAMES contains exactly 8 entries

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Tasks sheet name matches constant
    Then SHEET_NAMES.TASKS equals "Tasks"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Goals sheet name matches constant
    Then SHEET_NAMES.GOALS equals "Goals"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Contexts sheet name matches constant
    Then SHEET_NAMES.CONTEXTS equals "Contexts"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Categories sheet name matches constant
    Then SHEET_NAMES.CATEGORIES equals "Categories"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Checklist Items sheet name matches constant
    Then SHEET_NAMES.CHECKLIST_ITEMS equals "Checklist_Items"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Ideas sheet name matches constant
    Then SHEET_NAMES.IDEAS equals "Ideas"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Settings sheet name matches constant
    Then SHEET_NAMES.SETTINGS equals "Settings"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Meta sheet name matches constant
    Then SHEET_NAMES.META equals "Meta"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Tasks sheet has 19 columns
    Then "Tasks" sheet has 19 headers

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Tasks sheet starts with id column
    Then "Tasks" sheet first header is "id"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Tasks sheet ends with revision column
    Then "Tasks" sheet last header is "revision"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Goals sheet has 10 columns
    Then "Goals" sheet has 10 headers

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Contexts sheet has 7 columns
    Then "Contexts" sheet has 7 headers

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Categories sheet has 7 columns
    Then "Categories" sheet has 7 headers

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Checklist Items sheet has 9 columns
    Then "Checklist_Items" sheet has 9 headers

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Ideas sheet has 8 columns
    Then "Ideas" sheet has 8 headers

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Settings sheet has 3 columns
    Then "Settings" sheet has 3 headers

  @gas-adapter-specs-and-bdd @FR8
  Scenario: colMap returns correct index for Tasks id
    Then colMap for "Tasks" maps "id" to index 0

  @gas-adapter-specs-and-bdd @FR8
  Scenario: colMap returns correct index for Tasks box
    Then colMap for "Tasks" maps "box" to index 3

  @gas-adapter-specs-and-bdd @FR8
  Scenario: colMap returns correct index for Tasks revision
    Then colMap for "Tasks" maps "revision" to index 18

  @gas-adapter-specs-and-bdd @FR8
  Scenario: Date-only columns configured for Tasks
    Then DATE_ONLY_COLUMNS for "Tasks" contains "next_date" and "appear_date"

  @gas-adapter-specs-and-bdd @FR8
  Scenario: No date-only columns for Goals
    Then DATE_ONLY_COLUMNS has no entry for "Goals"
