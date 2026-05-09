# Changelog

All notable changes to the Healthcare Ops Advisor prototype are tracked here.
This file is mirrored to the connected GitHub repository through Lovable's
two-way sync — every commit made in Lovable updates this file on GitHub
automatically.

Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `CHANGELOG.md` to track build changes alongside `README.md`, kept in sync
  with the GitHub repo via Lovable's GitHub integration.

## 2026-05-09

### Removed
- "All metrics" section at the bottom of the dashboard (table, filter
  controls, "Full operational data for power users" label, and the
  "View all metrics" scroll button on the AI panel). Layout otherwise
  unchanged.

### Added
- `README.md` summarising hypothesis, scenario, key screens, user flow,
  and main build decisions.

### Changed
- "Where to focus today" panel: removed error/loading state and replaced
  the subheader with `Updated May 2, 2026 at 8:04 AM`. Now renders three
  static, prioritized signal cards (Discharge Before Noon, Cost per Case,
  OR Throughput) with Signal / Impact / Next Action lines and filled
  circle priority badges (red P1 / orange P2 / yellow P3), 12px spacing.
- Center panel: replaced the "Awaiting AI signal" placeholder with a
  static AI-flagged context line for the demo.
- Restored the dark background on the right-hand AI panel as the visual
  anchor of the three-column layout.
- Left KPI column: enlarged KPI values for sub-5-second scannability.

### Project framing
- Internal healthcare operations analytics prototype for VPs of
  Operations, CFOs, and department directors at acute care health
  systems. Goal: cut 60% first-visit bounce by surfacing one prioritized
  AI signal next to a scannable KPI stack so a new user can act in
  under 30 seconds with no onboarding.
