# EcoMentor AI

An interactive, client-side, production-ready web application designed to help individuals calculate, track, and systematically reduce their carbon footprint. Powered by a session-secure, context-aware AI Sustainability Coach via the Google Gemini API.

---

## 🌟 Challenge Alignment

EcoMentor AI aligns directly with the **PromptWars Challenge 3** problem statement:
> *"Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights."*

The application fulfills all three core pillars of this challenge:
1. **Understand**: By breaking down emissions into specific categories (Transit, Diet, Electricity, Water) and providing the exact mathematical formulas ("Explain My Score" feature), users learn *how* their lifestyle choices translate into metric tonnes of CO₂ equivalent.
2. **Track**: Through the **Assessment History Log**, users save their past calculations locally, visualize historical trends side-by-side, inspect percentage deltas (+/-) between evaluations, and export metrics as portable JSON data.
3. **Reduce**: Users receive a personalized **7-Day Sustainability Plan** targeting their highest emission source first. They can check off completed tasks and track their progress in real-time.

---

## 🚀 Key Features

* **Detailed Sustainability Profile**: Interactive, validated form inputs collecting name, diet type, average daily commute distance, travel mode, monthly electricity usage, and water utility intensity.
* **Carbon Footprint Engine**: Real-world emission coefficients yielding calculations in annual Metric Tonnes of $CO_2e$.
* **Interactive SVG Breakdown Chart**: A fully responsive, pure SVG donut chart showing segment percentages with hover tooltips and synchronized keyboard focus states.
* **"Explain My Score" Detailer**: Collapsible section that prints the raw equations behind the user's specific result, enhancing scientific transparency.
* **Context-Aware AI Sustainability Coach**: Active chatbot powered by Gemini 1.5 Flash. The prompt automatically feeds the coach the user's name, category breakdown, highest emitter, and sustainability rating, enabling highly personalized conversations.
* **In-Memory Security API Handling**: Complies with modern security audits by keeping the Gemini API Key solely as a session variable. The key is never cached in `localStorage` or `sessionStorage`.
* **Robust Offline Fallback**: If no API key is supplied, a local rule-based algorithm generates custom 7-day action plans targeting the user's primary emission driver, keeping the app 100% functional.
* **Interactive Progress Tracker**: A dynamic progress bar that updates as the user checks off daily action tasks.
* **Assessment Portability**: Single-click downloads to export tracking history as a structured JSON file.
* **Premium Obsidian Theme**: Built using a modern, dark-slate theme featuring glassmorphic components, fluid transitions, and responsive grid layouts.

---

## 🛠️ Technology Stack

* **Structure**: Semantic HTML5 (with strict ARIA mappings).
* **Styling**: Vanilla CSS3 (utilizing flexible HSL variables, transitions, and media query breakpoints).
* **Logic**: Vanilla ES6+ JavaScript (compiled in a clean, modular structure with strict XSS sanitization).
* **API Integration**: Direct client-side REST connection to the Google Gemini API (`v1` stable models).
* **Assets**: Raw inline SVGs (no external icon dependencies, ensuring instant page-load speeds).

---

## ⚙️ Setup & Deployment Instructions

EcoMentor AI is a zero-dependency static application. It runs entirely client-side and requires no local database, server configurations, or installation.

### Local Execution
1. Download the workspace files: `index.html`, `style.css`, and `script.js`.
2. Save them together in a single folder.
3. Double-click `index.html` to open the application instantly in any web browser (`file:///` protocol).
4. *(Optional)* Run a local static server inside the directory:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

### GitHub Pages Deployment
Since there is no backend, you can deploy the app to GitHub Pages in seconds:
1. Push `index.html`, `style.css`, and `script.js` to a public GitHub repository.
2. Navigate to repository **Settings** -> **Pages**.
3. Under *Build and deployment*, set the source to **Deploy from a branch** and select your target branch (e.g., `main` / root).
4. Save, and your app will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## 🧬 Gemini API Integration Details

### In-Memory Security
When a user clicks "Connect Coach" and inputs their API key:
1. The key is saved to a script-level closure variable (`let geminiApiKey`).
2. The input field is immediately wiped clean.
3. The key is never written to `localStorage` or cookies. Refreshing or closing the tab wipes the key instantly, preventing key theft in shared environments.

### Context-Aware Prompt Construction
The initial prompt submitted to Gemini provides the model with complete context. Below is the prompt format:

```text
You are the user's AI Sustainability Coach.
Profile details:
Name: [User Name]
Diet Type: [Diet Option]
Daily travel: [Distance] km via [Travel Mode]
Monthly utility power: [kWh] kWh
Water tier: [Water Option]

Calculations:
Transit footprint: [Calculated Transport] tonnes CO2e/year
Diet footprint: [Calculated Diet] tonnes CO2e/year
Electricity footprint: [Calculated Electricity] tonnes CO2e/year
Water footprint: [Calculated Water] tonnes CO2e/year
Total footprint: [Calculated Total] tonnes CO2e/year
Sustainability Rating: [Rating Tier]
Highest Driver: [Highest Category]

Tasks:
1. Write a direct, encouraging analysis greeting addressing the user by name. Detail which category is their primary emissions source, why it is high, and how their footprint ranks against the Paris Agreement target of staying under 2.0 tonnes per capita.
2. Construct a tailored 7-day action reduction plan. Each day must feature a specific target category, a short task (max 15 words), and a calculated impact (in kg CO2 saved).

Return ONLY a JSON response matching the following schema:
{
  "analysis": "Hello...",
  "weekly_plan": [
    { "day": 1, "task": "...", "impact": "...", "category": "..." },
    ... up to day 7
  ]
}
```

By requesting `responseMimeType: "application/json"`, the API returns a structured JSON payload that is parsed locally to render the weekly action cards.

---

## 📊 Scientific Assumptions & Emission Factors

Calculations are modeled on standard annual coefficients from the **Intergovernmental Panel on Climate Change (IPCC)** and the **United States Environmental Protection Agency (EPA)**:

### 1. Transportation
* Formula: $\text{Daily commute (km)} \times 365 \text{ days} \times \text{Mode Coefficient} / 1000$ (tonnes $CO_2e/\text{year}$)
* **Walking / Bicycle**: $0.0\text{ kg }CO_2e/\text{km}$
* **Public Train**: $0.04\text{ kg }CO_2e/\text{km}$
* **Public Bus**: $0.08\text{ kg }CO_2e/\text{km}$
* **Motorcycle**: $0.10\text{ kg }CO_2e/\text{km}$
* **Personal Car**: $0.18\text{ kg }CO_2e/\text{km}$

### 2. Dietary Choices
* Formula: $\text{Diet Coefficient} \times 365 \text{ days} / 1000$ (tonnes $CO_2e/\text{year}$)
* **Vegan**: $1.5\text{ kg }CO_2e/\text{day}$
* **Vegetarian**: $2.5\text{ kg }CO_2e/\text{day}$
* **Mixed (Meat & Dairy)**: $4.5\text{ kg }CO_2e/\text{day}$

### 3. Electricity Usage
* Formula: $\text{Monthly electricity (kWh)} \times 12 \text{ months} \times \text{Grid Factor } (0.5\text{ kg }CO_2e/\text{kWh}) / 1000$ (tonnes $CO_2e/\text{year}$)
* *Note: $0.5\text{ kg/kWh}$ is the standard international baseline factor for grid mixtures.*

### 4. Water Usage
* Formula: $\text{Water Level Factor} \times 12 \text{ months} / 1000$ (tonnes $CO_2e/\text{year}$)
* **Low**: $10\text{ kg }CO_2e/\text{month}$ (direct distribution/purification footprint)
* **Medium**: $30\text{ kg }CO_2e/\text{month}$
* **High**: $60\text{ kg }CO_2e/\text{month}$

---

---

## 🧪 Comprehensive Verification & Testing Matrix

EcoMentor AI incorporates a **built-in, self-executing unit testing suite** located at the bottom of [script.js](file:///C:/Users/HIMANSHU%20MISHRA/Desktop/Projects/EcoMentor%20AI/script.js).

### 1. How the Automated Tests Work
* **Automatic Execution**: The test runner executes automatically in the background every time the page loads. It runs silently inside the browser console without polluting the user interface.
* **Console-Based Test Runner**: Open your browser developer tools (`F12` or `Ctrl+Shift+I`) and look at the **Console** tab. You will see a green, styled console group `🍀 EcoMentor AI - Automated Test Suite` displaying test passes and failures.
* **Manual Execution**: Evaluators or developers can manually re-trigger the tests at any time in the console by running:
  ```javascript
  window.runEcoMentorTests();
  ```
* **Strict Assertions**: The testing module features custom validation logic and assertion handlers that verify expected output matches calculations, ratings, and focus drivers.

### 2. Automated Test Case Definitions

The runner executes the following unit tests:

1. **Carbon Calculation Accuracy Test (Average Citizen / Jordan)**:
   * **Purpose**: Verifies that standard average profiles yield mathematically correct scores.
   * **Inputs**: Name = `'Jordan'`, Diet = `'vegetarian'`, Distance = `30 km/day`, Mode = `'train'`, Electricity = `225 kWh/month`, Water = `'medium'`.
   * **Assertions**: 
     * Transit: $0.44\text{ tonnes}$
     * Diet: $0.91\text{ tonnes}$
     * Electricity: $1.35\text{ tonnes}$
     * Water: $0.36\text{ tonnes}$
     * Total: $3.06\text{ tonnes}$
     * Rating: `'Good'`
     * Highest category: `'Electricity'`

2. **Normal Input Test (Anya - Eco Conscious)**:
   * **Purpose**: Tests a low-emitter profile near global Paris Agreement targets.
   * **Inputs**: Name = `'Anya'`, Diet = `'vegan'`, Distance = `0 km/day` (Walking), Electricity = `120 kWh/month`, Water = `'low'`.
   * **Assertions**:
     * Transit: $0.00\text{ tonnes}$
     * Diet: $0.55\text{ tonnes}$
     * Electricity: $0.72\text{ tonnes}$
     * Water: $0.12\text{ tonnes}$
     * Total: $1.39\text{ tonnes}$
     * Rating: `'Excellent'`
     * Highest category: `'Electricity'`

3. **Zero / Minimum Values Calculation Test**:
   * **Purpose**: Verifies calculations and safety boundaries at absolute minima.
   * **Inputs**: Name = `'Zero Test'`, Diet = `'vegan'`, Distance = `0 km/day`, Electricity = `0 kWh/month`, Water = `'low'`.
   * **Assertions**:
     * Transit: $0.00\text{ tonnes}$
     * Diet: $0.55\text{ tonnes}$
     * Electricity: $0.00\text{ tonnes}$
     * Water: $0.12\text{ tonnes}$
     * Total: $0.67\text{ tonnes}$
     * Rating: `'Excellent'`
     * Highest category: `'Diet'`

4. **Maximum Boundary Values Calculation Test**:
   * **Purpose**: Verifies calculation safety and rating thresholds at maximum input limits.
   * **Inputs**: Name = `'Max Test'`, Diet = `'mixed'`, Distance = `250 km/day`, Mode = `'car'`, Electricity = `9999 kWh/month`, Water = `'high'`.
   * **Assertions**:
     * Transit: $16.43\text{ tonnes}$
     * Diet: $1.64\text{ tonnes}$
     * Electricity: $59.99\text{ tonnes}$
     * Water: $0.72\text{ tonnes}$
     * Total: $78.78\text{ tonnes}$
     * Rating: `'Needs Improvement'`
     * Highest category: `'Electricity'`

5. **Input Validation Edge Cases & Boundaries Tests**:
   * **Purpose**: Tests validator reactions to illegal, negative, empty, or out-of-bounds user entries.
   * **Test Assertions**:
     * Empty Name -> flag as invalid (`error: 'Please enter your name.'`)
     * Name exceeds 50 chars -> flag as invalid (`error: 'Name cannot exceed 50 characters.'`)
     * Negative electricity -> flag as invalid
     * Electricity > 9999 -> flag as invalid
     * Negative travel distance -> flag as invalid
     * Travel distance > 250 -> flag as invalid

### 3. Manual UI & Accessibility Verification
* **Special Characters in Name**: Submitting names like `<script>alert('xss')</script>` renders safely as raw text in the chat bubble and history table, successfully bypassing XSS vector tests.
* **Keyboard-Only Traversal**: Standard `Tab` key cycling flows chronologically: logo -> AI Setup -> form fields -> Calculate button -> Explain Score details -> Action cards -> Chat input. Focus indicators are set to a bright outline (`outline: 3px solid var(--border-focus)`) with a `3px` offset to guarantee clear WCAG-compliant contrast.
* **ARIA Mappings**: Key interactive panels map back to parent triggers: `aria-expanded` and `aria-controls` bindings are active on the AI Setup panel. Dynamic result widgets feature `aria-live="polite"` tags to ensure screen readers announce score modifications without needing a full-page reload.

---

## 🔮 Future Improvements

1. **Local Grid Calibration**: Allow users to customize their electricity emission factor based on their specific city or country's regional power grid mix.
2. **Additional Emission Categories**: Integrate flight miles tracking, parcel deliveries, and household gas heating inputs for an even more thorough evaluation.
3. **Database Cloud Sync**: Offer optional encrypted cloud storage syncing so users can access their assessment logs across multiple devices.
