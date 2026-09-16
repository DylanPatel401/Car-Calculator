# Car Calculator PRD

## Phase 2: Saved Options and Comparison

Phase 2 extends the Phase 1 requirements below with a locally saved shortlist. One shared financial profile, debt list, annual driving distance, and fuel price apply to every option. Vehicle costs, financing, and timing settings belong to individual named options.

- Calculator and Timing share an active-option selector.
- Compare supports creating, duplicating, renaming, and confirmed deletion of options.
- Users can save any number of options and select two or three for comparison.
- The comparison shows monthly affordability, reserve, interest, and debt impact, with monetary differences from a selected baseline. It does not rank an overall winner.
- Phone tables keep labels fixed during horizontal scrolling; wider layouts show the selected columns together.
- Version-1 data migrates into the first option in a version-2 workspace. Selection IDs are repaired on restore; malformed storage and read errors must not block launch.
- Deleting the last option creates a new vehicle draft and retains the shared financial profile. Global reset separately confirms removal of all options and financial data.
- Missing required inputs produce incomplete comparison values and suppress associated differences.
- Exports, accounts, leases, resale modeling, and vehicle APIs remain outside this phase.

The sections below describe the original Phase 1 baseline; the Phase 2 requirements above supersede its single-scenario limit.

## Product Promise

Car Calculator helps a buyer understand how one vehicle purchase would affect their monthly cash flow, emergency savings, and debt payoff before they commit.

The product answers:

> Given my current finances and this vehicle, can I buy it without undermining the financial priorities I set for myself, and would waiting materially improve the outcome?

## Product Summary

Car Calculator is an iOS-first financial planning app for US vehicle buyers. It combines take-home income, savings, expenses, debts, financing, and ownership costs in one transparent scenario. It is a planning tool, not a lender quote, financial recommendation, or generic budget tracker.

Phase 1 supports one continuously saved local scenario. Users complete a guided setup, then edit assumptions from three areas:

- **Calculator:** the live affordability result and vehicle, financing, and ownership assumptions.
- **Timing:** buy now, wait three months, wait six months, and custom-date outcomes.
- **Profile:** income, savings, expenses, debts, modeling assumptions, disclosures, and reset.

## Target User

The primary user is a first or second serious car buyer who wants to evaluate a specific new or used vehicle against real take-home pay and existing commitments. They may have limited financial-planning experience and need the math explained in plain language.

## Problem

Most vehicle calculators optimize for a monthly payment. That number can hide depleted savings, negative monthly cash flow, ownership costs, and slower debt payoff. Car Calculator treats the purchase as a change to the user's full financial picture.

## Phase 1 Goals

- Complete a first scenario in under five minutes.
- Make true monthly vehicle cost and monthly surplus immediately visible.
- Show how the purchase affects cash remaining and the user's own emergency-reserve target.
- Compare buying now with waiting without requiring data re-entry.
- Keep every material assumption visible, editable, deterministic, and explainable.
- Save valid edits locally and restore the scenario reliably.
- Work well on iPhone and in adaptive two-column iPad layouts.

## Non-Goals

Phase 1 does not include:

- Accounts, cloud sync, or server storage
- Multiple vehicles or multiple saved scenarios
- Leases, lender applications, or personalized financial advice
- Bank connections, credit monitoring, or transaction imports
- Vehicle search, listings, VIN decoding, or external vehicle APIs
- Exports or shared links
- Future income beyond manually entered current side income
- Generic income-percentage affordability rules
- AI-generated calculations or recommendations

## Product Principles

### User-Defined Safety

Affordability signals use data completeness, positive monthly cash flow, and the emergency-reserve target chosen by the user. The app does not invent a universal acceptable payment or income ratio.

### Transparent Math

All financial results come from pure deterministic functions. Important outputs include expandable **Show math** explanations. Estimates are labeled as estimates.

### Immediate Feedback

Valid edits update results without a separate calculate action. The monthly cost and monthly surplus remain easy to revisit while editing.

### Honest Incompleteness

Missing required data produces an incomplete state and a useful prompt, never a plausible-looking zero or fabricated result.

### Private by Default

Financial data remains on the device. No account is required.

## Core User Journey

### First Run

1. Enter take-home income and optional side income.
2. Enter savings buckets and a desired emergency-reserve target.
3. Choose quick or detailed monthly expenses.
4. Add debts, if any.
5. Enter a vehicle and financing assumptions.
6. Review the first live affordability result.

### Returning Use

1. Restore the most recent valid scenario from local storage.
2. Land on Calculator.
3. Edit assumptions and see immediate result changes.
4. Review timing alternatives or update the financial profile.

## Information Architecture

### Calculator

- Vehicle identity and price
- Financing assumptions
- Estimated ownership costs
- True monthly vehicle cost
- Monthly surplus
- Amount financed, cash remaining, emergency runway, and debt impact
- Warnings and incomplete-state guidance
- Expandable math details

### Timing

- Buy now
- Wait three months
- Wait six months
- Custom purchase date
- Explicit monthly car-savings contribution
- Current transportation and other waiting costs
- Side-income inclusion toggle
- Difference in down payment, payment, interest, cash remaining, runway, debt, and net cost

### Profile

- Income and side income
- Savings and reserve target
- Quick or detailed expenses
- Debt management
- Debt-avalanche assumption toggle
- Estimate disclosures
- Confirmed reset action

## Inputs

### Financial Profile

- Paycheck amount
- Frequency: weekly, biweekly, twice monthly, or monthly
- Optional current side income
- Emergency savings
- Car savings
- Other savings
- Emergency-reserve target
- Quick total or detailed required monthly expenses
- Discretionary monthly spending

Income is normalized to a monthly amount using annual equivalents divided by 12.

### Debt

- Name
- Type: credit card, student loan, personal loan, auto loan, or other
- Balance
- APR
- Minimum monthly payment

### Vehicle

- Make, model, year, and optional trim
- New or used condition
- Purchase price and mileage
- MPG
- Insurance
- Optional user-entered maintenance reserve
- Registration monthly equivalent
- Parking, tolls, and other recurring costs

### Loan Terms

- Sales-tax rate
- Fees
- Trade-in credit
- Negative equity
- Down payment
- APR
- Term in months

Defaults are editable estimates, not recommendations:

- 60-month term
- 10% down payment
- 12,000 annual miles
- 25 MPG
- User-entered APR and tax rate

### Timing Scenario

- Purchase date
- Monthly contribution to car savings
- Monthly cost of waiting
- Whether current side income is included

Waiting-period savings use the explicit contribution above, not assumed monthly surplus.

## Calculation Requirements

All engines are pure and independent of UI state. Internal calculations retain cent precision; dashboard currency is rounded to whole dollars.

### Amount Financed

```text
taxes = vehiclePrice * taxRate

amountFinanced = max(
  0,
  vehiclePrice + taxes + fees + negativeEquity
  - downPayment - tradeInCredit
)
```

### Loan Payment

For a positive APR:

```text
monthlyRate = apr / 100 / 12
monthlyPayment = principal * monthlyRate
  / (1 - (1 + monthlyRate) ^ -termMonths)
```

For a zero-percent loan:

```text
monthlyPayment = principal / termMonths
```

Return an incomplete or invalid result for non-positive terms, negative APR, or invalid numeric inputs. Principal cannot be negative.

### Fuel

```text
annualGallons = annualMiles / mpg
monthlyFuelCost = annualGallons * fuelPrice / 12
```

MPG must be greater than zero. Missing or impossible MPG makes the applicable result incomplete.

### Maintenance

Use the user's monthly maintenance reserve when supplied. Otherwise calculate a clearly labeled estimate based on vehicle age, new or used condition, and mileage. The estimate remains editable.

### True Monthly Vehicle Cost

```text
trueMonthlyCost =
  monthlyLoanPayment
  + insurance
  + fuel
  + maintenanceReserve
  + registrationMonthlyEquivalent
  + parking
  + tolls
  + otherRecurringVehicleCosts
```

### Monthly Surplus

```text
monthlySurplus =
  includedMonthlyTakeHomeIncome
  - requiredMonthlyExpenses
  - minimumDebtPayments
  - discretionarySpending
  - trueMonthlyCost
```

### Cash Remaining and Emergency Runway

Emergency savings are unavailable for the down payment unless the user explicitly reallocates them.

```text
cashRemaining = availableCarAndOtherSavings - downPayment

emergencyRunwayMonths =
  emergencyCashRemaining / essentialMonthlyExpenses
```

If essential monthly expenses are absent or zero, emergency runway is incomplete.

### Debt Projection

By default, project debts using minimum payments plus positive available surplus, with extra funds applied to the highest APR first. Label this as an editable debt-avalanche modeling assumption and allow it to be disabled.

The engine must handle:

- Minimum payments that do not cover monthly interest
- Equal APRs deterministically
- Debts that pay off during the modeled period
- A disabled-extra-payment case

### Timing

For each purchase date:

```text
monthsWaiting = whole month boundaries from today to purchase date
additionalCarSavings = monthlyCarSavingsContribution * monthsWaiting
totalWaitingCost = monthlyWaitingCost * monthsWaiting
```

Recalculate the complete purchase scenario using accumulated savings. Show whether waiting helps, hurts, or creates no material difference after waiting costs.

## Result Contract

`ScenarioResult` includes:

- Completeness and missing-input reasons
- Amount financed, payment, total interest, and financed cost
- Fuel, maintenance, and total ownership costs
- Monthly surplus
- Cash remaining and emergency runway
- Debt payoff impact
- Warnings and estimate disclosures

Required domain types are UI-independent:

- `FinancialProfile`
- `Debt`
- `Vehicle`
- `LoanTerms`
- `TimingScenario`
- `ScenarioResult`

## Validation and Error Handling

- Validate typed input with Zod and React Hook Form.
- Reject negative money values where they are not meaningful.
- Reject negative APR, non-positive loan terms, and non-positive MPG.
- Prevent divide-by-zero and non-finite results.
- Preserve the last valid scenario while an edit is invalid.
- Explain errors near the relevant input in plain language.
- Recover from corrupted local storage by loading a safe default scenario.

## Persistence

- Store one versioned scenario with Zustand and AsyncStorage.
- Autosave valid edits.
- Restore persisted data before routing the user.
- Migrate older supported schema versions.
- Recover safely from malformed or unsupported data.
- Require confirmation before resetting all local data.

## Design and Accessibility

- Use compact, work-focused cards with no nested cards.
- Use semantic status colors that remain distinguishable in light and dark themes.
- Use tabular numerals for financial values.
- Use SF Symbols or the established icon library for controls.
- Maintain at least 44-point touch targets.
- Support system light and dark appearance.
- Support Dynamic Type without clipping or overlapping controls.
- Give every interactive control a useful VoiceOver label, role, and state where applicable.
- Never use color as the only status indicator.
- Adapt to a two-column layout on iPad in portrait and landscape.

## Technical Requirements

- Latest stable Expo SDK
- React Native and strict TypeScript
- Expo Router
- React Hook Form and Zod
- Zustand and AsyncStorage
- npm and EAS configuration
- iPhone and iPad support
- Production bundle metadata, icon, splash screen, privacy manifest, and build profiles
- No remote runtime dependency for calculations

## Verification

### Automated

- Unit-test financing, cash flow, fuel, maintenance, debt, timing, persistence migration, and aggregate scenarios.
- Include known amortization values, zero APR, fees, negative equity, missing MPG, insufficient minimum payments, debt-avalanche ordering, and month-boundary timing.
- Include timing cases where waiting helps, hurts, or has no material effect.
- Test validation, onboarding completion, autosave restoration, reset confirmation, and corrupted-storage recovery.
- Test editing, live updates, incomplete states, theme behavior, and accessibility labels with React Native Testing Library.
- Pass strict TypeScript, ESLint, Jest, Expo diagnostics, and an EAS iOS preview build.

### Manual

- Verify representative small and large iPhones.
- Verify portrait and landscape iPad layouts.
- Verify light and dark themes.
- Verify large Dynamic Type sizes and VoiceOver navigation.
- Confirm no blocked, clipped, or overlapping controls.

## Acceptance Criteria

- A first-time user can finish one scenario in under five minutes.
- Required formulas match known test cases to cent precision.
- Editing a valid assumption immediately updates dependent results.
- True monthly cost and monthly surplus are prominent and understandable.
- Emergency savings are not silently consumed by the down payment.
- Buy-now and wait outcomes use explicit savings and waiting-cost inputs.
- Missing required data produces an incomplete state rather than a misleading result.
- Valid data survives relaunch, older data migrates, and corrupted storage recovers.
- Reset requires confirmation and removes the saved scenario.
- The supported iPhone and iPad layouts remain usable in both system themes.
- The native iOS preview build completes successfully.

## Phase 2 Candidates

- Multiple saved scenarios and side-by-side vehicle comparison
- Lease calculations
- Debt-versus-down-payment simulator
- Future confirmed income
- Export and sharing
- Vehicle data and listing integrations
- Account-based sync

These items require separate validation and are not implied by the Phase 1 architecture.

## Product Boundary

Car Calculator exists to make one vehicle decision legible in the context of the user's real financial life. Features that do not materially improve that decision should remain outside the product until the core workflow is validated.
