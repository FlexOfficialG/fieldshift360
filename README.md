# Field Forecast

Build a professional, fully functional NASA Space Apps Challenge 2026 project called:

FIELD SHIFT
Adapting Farms with NASA Data

Team: Orbix
Members: Farhan Khan and Jannatun Nahar

CORE IDEA

Field Shift is a real-data agricultural climate adaptation platform.

A user selects a farm location and crop. The application retrieves real NASA environmental data, analyzes the conditions, and lets the user test hypothetical climate changes through an interactive scenario simulator.

The complete experience must be:

FARM → NASA DATA → ANALYSIS → WHAT-IF → ADAPTATION INSIGHT

CRITICAL REQUIREMENT — REAL DATA

This must be a real working application.

Use the official NASA POWER API for actual environmental data.

Use real API responses for:

Temperature
Precipitation
Solar radiation

The application must request data based on the user's:

Latitude
Longitude
Date range

NEVER use fake NASA data.

NEVER hardcode environmental measurements.

NEVER generate random values and present them as NASA observations.

If the API fails, show:

NASA DATA UNAVAILABLE

Do not replace missing data with fake values.

Show the source clearly:

NASA POWER — REAL OBSERVED/REANALYZED DATA

Use the exact dataset and variable information returned by the API.

MAIN DASHBOARD

Create a clean scientific dashboard.

Show:

Selected farm
Latitude
Longitude
Crop
Analysis period
NASA data status

Display real NASA data through professional charts.

Include:

Temperature trend
Precipitation trend
Solar radiation trend

Every chart must show its unit and data source.

FIELD ANALYSIS

Create three transparent prototype indicators:

HEAT STRESS

Based on temperature conditions.

WATER STRESS

Based on precipitation conditions.

ENVIRONMENTAL STRESS

A clearly explained combination of the available indicators.

Do not claim these are scientifically validated crop-yield predictions.

Show the methodology behind every indicator.

For example:

Input → Calculation → Result

Use clear scientific language.

SIGNATURE FEATURE — SCENARIO LAB

Make this the most impressive interactive feature.

Title:

SCENARIO LAB

Start with the real NASA baseline.

Allow the user to change:

Temperature: −5°C to +5°C

Rainfall: −50% to +50%

Then immediately calculate the experimental scenario.

Show a professional comparison:

NASA BASELINE | SCENARIO | CHANGE

Example:

Temperature
Baseline: actual NASA value
Scenario: baseline + selected change
Change: difference

Rainfall
Baseline: actual NASA value
Scenario: baseline + selected change
Change: difference

Heat Stress
Baseline → Scenario

Water Stress
Baseline → Scenario

Environmental Stress
Baseline → Scenario

Clearly label scenario results:

EXPERIMENTAL SCENARIO

NOT AN ACTUAL NASA OBSERVATION

Use interactive charts.

ADAPTATION INSIGHTS

Based on the calculated indicators, show monitoring priorities such as:

Water monitoring
Heat monitoring
Vegetation monitoring
Weather monitoring

Explain why each priority appears.

Do not make guaranteed agricultural claims.

Use language such as:

“Consider monitoring…”

“May indicate…”

“Further local assessment is recommended.”

AI INSIGHTS

Create an AI interpretation feature.

Do NOT make a generic chatbot.

The AI receives structured results from the actual application.

It can analyze:

NASA observations
Environmental trends
Prototype indicators
Scenario results
Data quality

Return four short sections:

CURRENT SITUATION

MAIN DRIVER

SCENARIO IMPACT

MONITORING PRIORITY

Clearly label the output:

AI-GENERATED INTERPRETATION

The AI must never invent:

NASA measurements
Datasets
Locations
Scientific findings

If AI is not configured, show a clear unavailable state rather than fake AI output.

Keep API keys secure on the server side.

MAP

Use OpenStreetMap for the farm location.

Show:

Selected coordinates
Map marker
Basic map controls

Do not fabricate farm boundaries.

DATA PROVENANCE

Make transparency a major feature.

For every NASA dataset display:

Source
Dataset
Variable
Unit
Location
Date range
Data status

Add a simple View Data Source or Provenance section.

METHODOLOGY

Create a concise methodology page explaining:

NASA data collection
Data processing
Stress indicators
Scenario calculations
AI interpretation
Limitations

Include a simple visual workflow:

NASA DATA → PROCESSING → INDICATORS → SCENARIO → INSIGHT

IMPORTANT SCIENTIFIC RULE

Clearly separate:

NASA OBSERVATION

Actual data retrieved from NASA.

CALCULATED INDICATOR

A value calculated by Field Shift.

SCENARIO

A hypothetical user-created change.

AI INTERPRETATION

AI-generated explanation of the results.

Never mix these categories.

DATA STATES

Implement:

Loading
Available
Partial
Unavailable
Error

If required NASA data is missing, show:

INSUFFICIENT DATA

and explain what is missing.

DESIGN

Make it look like a professional Earth observation and agricultural intelligence platform.

Use:

Clean typography
Professional charts
Scientific dashboard layout
Clear navigation
Responsive design
Subtle animations
Strong visual hierarchy
Earth/agriculture-inspired design

Avoid:

Emojis
Neon effects
Excessive gradients
Excessive glassmorphism
Huge decorative cards
Fake statistics
Fake NASA branding
Unnecessary animations
Long marketing paragraphs

NAVIGATION

Use only these main sections:

Dashboard

Field Analysis

Scenario Lab

AI Insights

Data Sources

Methodology

DEMO FLOW

The entire project must be easy to demonstrate:

Enter a farm location.

Select a crop.

Load real NASA POWER data.

Show temperature, precipitation, and solar radiation.

Analyze environmental stress.

Open Scenario Lab.

Increase temperature or decrease rainfall.

Compare NASA baseline with the experimental scenario.

Show adaptation monitoring priorities.

Generate AI interpretation.

Open Data Provenance.

FINAL REQUIREMENT

Prioritize REAL FUNCTIONALITY over visual decoration.

Do not create fake functionality.

Do not create fake NASA data.

Do not present placeholder values as real.

Do not claim NASA endorsement.

Do not claim validated crop prediction.

Make the smallest number of components necessary.

Keep the architecture simple enough for a beginner to maintain.

The final product should demonstrate one powerful idea:

NASA Earth data can be transformed into an interactive agricultural climate-adaptation decision-support experience.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fieldshift360.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d067c242-7f35-4618-8e67-b97a6ff367de).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
