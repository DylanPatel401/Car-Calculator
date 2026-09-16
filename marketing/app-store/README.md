# Car Calculator — App Store artwork

Nine finished compositions with actual app UI and fictional financial inputs.

## Files

- `iphone/`: six RGB PNGs, **1320 × 2868**. Use numerical order.
- `ipad/`: three RGB PNGs, **2064 × 2752**, covering overview, comparison, and timing.
- `preview.png`: contact sheet of the six phone compositions.
- Matching `.svg` files: editable artwork with embedded assets and live text.
- `source/render.cjs`: reproducible renderer and headline/caption copy.
- `captures/`: source browser captures. The browser returned JPEG bytes despite the `.png` filenames; the renderer detects the actual format.
- `source/background.png`: generated emerald/ivory background plate. App UI and all financial figures come from the real app.

## Capture provenance and release status

**These are web-preview compositions, not native iOS simulator screenshots.**
The responsive app was captured at 440 × 956 and 1032 × 1376 logical layout sizes, in light mode. Only browser scrollbars were hidden in the disposable exported web bundle. No app results, text, controls, or financial values were fabricated or painted over. Framing and headlines are marketing artwork.

The native iOS preview build completed successfully:
https://expo.dev/accounts/dylanpatel401/projects/car-calculator/builds/06237052-7536-4c2a-92c8-b0220aa127d2

Native capture was attempted with Expo's remote simulator and Maestro workflow runner. Remote simulator access is not enabled for this account; the Maestro runner requires a paid Expo plan. No plan or subscription was purchased. The reusable but **unexecuted** workflow is `.eas/workflows/app-store-captures.yml`, with flow `.maestro/app-store.yml`.

Before App Store submission, replace source captures with native iOS captures and rerender, verifying native typography, safe areas, tabs, and scroll positions. The artwork is ready for design review; native capture verification remains outstanding. No store upload or deployment was performed.

Dimensions follow [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications). All final PNGs use RGB without an alpha channel.

## Sample plan

Fictional take-home income: $5,000/month. Emergency savings: $10,000; car savings: $5,000; reserve target: $10,000. Required spending: $2,500/month; discretionary: $400/month; planned car savings: $500/month. Vehicle: 2024 Toyota Camry, $30,000; down payment: $3,000; APR: 6.5%; term: 60 months; tax: 7%. Ownership costs use the app's labeled starting estimates.

The lower-price experiment uses $26,000 and retains the original. It produces $926 monthly ownership cost versus $1,010, $84 more monthly surplus, and $745 less total interest. Timing uses three months of saving with $0 waiting costs. These illustrative outcomes are not promises or financial recommendations.

This plan was entered through onboarding on a dedicated localhost origin, separate from prior app storage. The screenshots contain no personal financial data.

## Rebuild artwork

From the repository root:

```powershell
npm install --prefix marketing/app-store/tools --no-save --package-lock=false @resvg/resvg-js pngjs
node marketing/app-store/source/render.cjs
```

The renderer uses Segoe UI on Windows. Embedded capture images retain their original content. Replacing source captures with matching aspect ratios updates every composition without changing the typography or layout. The background original remains in the Codex generated-images directory.
