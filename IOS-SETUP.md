# Orlando WaitWatch iOS preparation

This branch contains the initial Capacitor setup for preparing an iPhone app.

## Current setup

- App display name: Orlando WaitWatch
- Bundle identifier: com.orlandowaitwatch.app
- The initial shell opens the existing live website at https://orlando-waitwatch-k5hf.onrender.com so its existing API and live wait-time behavior continue to work.
- The `www/index.html` file is a local fallback page.

## Important before App Store submission

This is a development scaffold, not a finished App Store submission. Apple may reject apps that primarily wrap a website without enough app-specific functionality. Before submission, improve the native experience, test on real iPhones, check accessibility and privacy disclosures, and review Apple's current App Review Guidelines.

Capacitor's iOS platform must be generated and built on macOS with Xcode, or through a compatible cloud macOS build workflow. Publishing also requires an eligible Apple Developer account.
