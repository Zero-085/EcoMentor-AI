/**
 * EcoMentor AI - Main Script File
 * Core Carbon Footprint Engine, Responsive Charting, Local History tracking,
 * and Session-Secure Gemini API Integration.
 */

// Global state in-memory only (security guideline compliance)
let geminiApiKey = ''; 

// Emission Coefficients constants (Source: IPCC & EPA guidelines)
const EMISSION_FACTORS = {
  // kg CO2e per km
  transport: {
    walking: 0.0,
    bicycle: 0.0,
    bus: 0.08,
    train: 0.04,
    car: 0.18,
    motorcycle: 0.10
  },
  // kg CO2e per day
  diet: {
    vegan: 1.5,
    vegetarian: 2.5,
    mixed: 4.5
  },
  // kg CO2e per kWh
  electricity: 0.5,
  // kg CO2e per month
  water: {
    low: 10,
    medium: 30,
    high: 60
  }
};

const RATING_THRESHOLDS = {
  EXCELLENT: 2.0, // Paris target (tonnes CO2e/year)
  GOOD: 4.5,
  AVERAGE: 8.0
};

// UI DOM Cache
const dom = {
  footprintForm: document.getElementById('footprint-form'),
  userName: document.getElementById('user-name'),
  dietType: document.getElementById('diet-type'),
  travelDistance: document.getElementById('travel-distance'),
  travelDistanceVal: document.getElementById('travel-distance-val'),
  travelMode: document.getElementById('travel-mode'),
  electricityUsage: document.getElementById('electricity-usage'),
  waterUsage: document.getElementById('water-usage'),
  formErrorMsg: document.getElementById('form-error-msg'),
  
  resultsSection: document.getElementById('results-section'),
  totalScoreDisplay: document.getElementById('total-score-display'),
  ratingBadgeDisplay: document.getElementById('rating-badge-display'),
  highestCategoryDisplay: document.getElementById('highest-category-display'),
  highestContribAlert: document.getElementById('highest-contrib-alert-box'),
  
  // Chart indicators
  chartPercent: document.getElementById('chart-percent'),
  chartCategory: document.getElementById('chart-category'),
  sliceTransport: document.getElementById('slice-transport'),
  sliceDiet: document.getElementById('slice-diet'),
  sliceElectricity: document.getElementById('slice-electricity'),
  sliceWater: document.getElementById('slice-water'),
  valTransport: document.getElementById('val-transport'),
  valDiet: document.getElementById('val-diet'),
  valElectricity: document.getElementById('val-electricity'),
  valWater: document.getElementById('val-water'),
  
  // Math explanation
  explainTransportMath: document.getElementById('explain-transport-math'),
  explainDietMath: document.getElementById('explain-diet-math'),
  explainElectricityMath: document.getElementById('explain-electricity-math'),
  explainWaterMath: document.getElementById('explain-water-math'),
  
  // Action Plan
  actionPlanSection: document.getElementById('action-plan-section'),
  planGridContainer: document.getElementById('plan-grid-container'),
  planCompletionPercent: document.getElementById('plan-completion-percent'),
  planProgressIndicator: document.getElementById('plan-progress-indicator'),
  
  // API settings
  toggleApiPanelBtn: document.getElementById('toggle-api-panel-btn'),
  apiSettingsContainer: document.getElementById('api-settings-container'),
  geminiApiKeyInput: document.getElementById('gemini-api-key'),
  saveApiKeyBtn: document.getElementById('save-api-key-btn'),
  clearApiKeyBtn: document.getElementById('clear-api-key-btn'),
  apiStatusMsg: document.getElementById('api-status-msg'),
  
  // AI Coach Chat
  aiCoachSection: document.getElementById('ai-coach-section'),
  chatMessagesContainer: document.getElementById('chat-messages-container'),
  chatInputForm: document.getElementById('chat-input-form'),
  chatInputMsg: document.getElementById('chat-input-msg'),
  chatSendBtn: document.getElementById('chat-send-btn'),
  chatTypingStatus: document.getElementById('chat-typing-status'),
  
  // History Elements
  historyTableBody: document.getElementById('history-table-body'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
  exportHistoryBtn: document.getElementById('export-history-btn'),
  
  // Dominant recommendation card elements
  driverRecommendationCard: document.getElementById('driver-recommendation-card'),
  driverExplanationText: document.getElementById('driver-explanation-text'),
  driverTipText: document.getElementById('driver-tip-text')
};

// Application State
let state = {
  userName: '',
  emissions: {
    transport: 0,
    diet: 0,
    electricity: 0,
    water: 0,
    total: 0
  },
  rating: '',
  highestCategory: '',
  weeklyPlan: [],
  history: []
};

// --- SECURITY UTILITIES ---
/**
 * Sanitizes input string to prevent XSS (Cross Site Scripting)
 * @param {string} str - Raw string
 * @returns {string} - Escaped HTML-safe string
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates input values
 * @returns {boolean} - true if form inputs are completely safe
 */
function validateInputs() {
  dom.formErrorMsg.classList.add('hidden');
  dom.formErrorMsg.textContent = '';
  
  const nameVal = dom.userName.value.trim();
  if (nameVal.length === 0) {
    showFormError('Please enter your name.');
    return false;
  }
  if (nameVal.length > 50) {
    showFormError('Name cannot exceed 50 characters.');
    return false;
  }

  const electricityVal = parseFloat(dom.electricityUsage.value);
  if (isNaN(electricityVal) || electricityVal < 0 || electricityVal > 9999) {
    showFormError('Please enter a valid monthly electricity usage between 0 and 9999 kWh.');
    return false;
  }

  const travelDistanceVal = parseFloat(dom.travelDistance.value);
  if (isNaN(travelDistanceVal) || travelDistanceVal < 0 || travelDistanceVal > 250) {
    showFormError('Please enter a valid daily travel distance between 0 and 250 km.');
    return false;
  }

  return true;
}

function showFormError(msg) {
  dom.formErrorMsg.textContent = msg;
  dom.formErrorMsg.classList.remove('hidden');
  dom.formErrorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- CORE EMISSIONS CALCULATOR ---
/**
 * Calculates emission values in tonnes CO2e / year
 */
function calculateCarbonFootprint() {
  const distance = parseFloat(dom.travelDistance.value);
  const mode = dom.travelMode.value;
  const diet = dom.dietType.value;
  const electricity = parseFloat(dom.electricityUsage.value);
  const water = dom.waterUsage.value;

  // 1. Transportation
  const transportFactor = EMISSION_FACTORS.transport[mode] || 0;
  const transportEmissions = (distance * 365 * transportFactor) / 1000;

  // 2. Diet
  const dietFactor = EMISSION_FACTORS.diet[diet] || 0;
  const dietEmissions = (dietFactor * 365) / 1000;

  // 3. Electricity
  const elecFactor = EMISSION_FACTORS.electricity;
  const electricityEmissions = (electricity * 12 * elecFactor) / 1000;

  // 4. Water
  const waterFactor = EMISSION_FACTORS.water[water] || 0;
  const waterEmissions = (waterFactor * 12) / 1000;

  const total = transportEmissions + dietEmissions + electricityEmissions + waterEmissions;

  // Determine Rating
  let rating = 'Needs Improvement';
  if (total < RATING_THRESHOLDS.EXCELLENT) {
    rating = 'Excellent';
  } else if (total < RATING_THRESHOLDS.GOOD) {
    rating = 'Good';
  } else if (total < RATING_THRESHOLDS.AVERAGE) {
    rating = 'Average';
  }

  // Determine highest driver
  const breakdown = [
    { name: 'Transportation', value: transportEmissions },
    { name: 'Diet', value: dietEmissions },
    { name: 'Electricity', value: electricityEmissions },
    { name: 'Water', value: waterEmissions }
  ];
  breakdown.sort((a, b) => b.value - a.value);
  const highest = breakdown[0].name;

  state.userName = escapeHTML(dom.userName.value.trim());
  state.emissions = {
    transport: parseFloat(transportEmissions.toFixed(2)),
    diet: parseFloat(dietEmissions.toFixed(2)),
    electricity: parseFloat(electricityEmissions.toFixed(2)),
    water: parseFloat(waterEmissions.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
  state.rating = rating;
  state.highestCategory = highest;
}

// --- HISTORICAL ASSESSMENT LOGGER ---
const HistoryManager = {
  loadHistory() {
    try {
      const stored = localStorage.getItem('ecomentor_history');
      state.history = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse carbon history', e);
      state.history = [];
    }
  },

  saveAssessment() {
    const record = {
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: Date.now(),
      name: state.userName,
      transport: state.emissions.transport,
      diet: state.emissions.diet,
      electricity: state.emissions.electricity,
      water: state.emissions.water,
      total: state.emissions.total,
      rating: state.rating,
      highest: state.highestCategory
    };

    // Prepend to history, keeping max of 5
    state.history.unshift(record);
    if (state.history.length > 5) {
      state.history.pop();
    }

    localStorage.setItem('ecomentor_history', JSON.stringify(state.history));
    this.renderHistoryTable();
  },

  renderHistoryTable() {
    dom.historyTableBody.innerHTML = '';
    
    if (state.history.length === 0) {
      dom.clearHistoryBtn.classList.add('hidden');
      dom.exportHistoryBtn.classList.add('hidden');
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 2rem;">
          No calculation history recorded yet. Enter profile values above to log trends.
        </td>
      `;
      dom.historyTableBody.appendChild(tr);
      return;
    }

    dom.clearHistoryBtn.classList.remove('hidden');
    dom.exportHistoryBtn.classList.remove('hidden');

    state.history.forEach((record, index) => {
      let trendHTML = '<span class="trend-badge trend-neutral">— Baseline</span>';
      
      // Compare with previous assessment chronological in list (next array element represents older evaluation)
      const nextOlder = state.history[index + 1];
      if (nextOlder) {
        const delta = record.total - nextOlder.total;
        const percent = ((delta / nextOlder.total) * 100).toFixed(1);
        if (delta > 0) {
          trendHTML = `<span class="trend-badge trend-up">▲ +${percent}%</span>`;
        } else if (delta < 0) {
          trendHTML = `<span class="trend-badge trend-down">▼ ${percent}%</span>`;
        } else {
          trendHTML = '<span class="trend-badge trend-neutral">■ 0.0%</span>';
        }
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHTML(record.date)}</td>
        <td style="font-weight: 700;">${record.total} t</td>
        <td>
          <span class="rating-badge rating-${record.rating.toLowerCase().replace(/ /g, '-')}" style="font-size: 0.75rem; padding: 0.15rem 0.5rem; margin-top: 0;">
            ${escapeHTML(record.rating)}
          </span>
        </td>
        <td>${escapeHTML(record.highest)}</td>
        <td>${trendHTML}</td>
      `;
      dom.historyTableBody.appendChild(tr);
    });
  },

  clearHistory() {
    if (confirm('Are you sure you want to delete all saved assessment history? This action cannot be undone.')) {
      state.history = [];
      localStorage.removeItem('ecomentor_history');
      this.renderHistoryTable();
    }
  },

  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ecomentor_carbon_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};

// --- DATA VISUALIZATION (SVG CHART) ---
const ChartDrawer = {
  renderSVGChart() {
    const emissions = state.emissions;
    const total = emissions.total || 0.01; // Avoid division by zero
    
    // Percentages
    const transportPct = (emissions.transport / total) * 100;
    const dietPct = (emissions.diet / total) * 100;
    const electricityPct = (emissions.electricity / total) * 100;
    const waterPct = (emissions.water / total) * 100;

    // SVG parameters
    // Circumference = 2 * pi * r = 2 * 3.14159 * 35 = 219.91
    const radius = 35;
    const circumference = 2 * Math.PI * radius;

    // Update Segments
    this.updateSegment(dom.sliceTransport, transportPct, circumference, 0);
    
    const transportOffset = (transportPct / 100) * circumference;
    this.updateSegment(dom.sliceDiet, dietPct, circumference, transportOffset);
    
    const dietOffset = transportOffset + ((dietPct / 100) * circumference);
    this.updateSegment(dom.sliceElectricity, electricityPct, circumference, dietOffset);
    
    const elecOffset = dietOffset + ((electricityPct / 100) * circumference);
    this.updateSegment(dom.sliceWater, waterPct, circumference, elecOffset);

    // Set default chart center values
    this.resetChartCenter();

    // Setup interactive hovers
    this.setupHoverEvent('transport', transportPct, emissions.transport);
    this.setupHoverEvent('diet', dietPct, emissions.diet);
    this.setupHoverEvent('electricity', electricityPct, emissions.electricity);
    this.setupHoverEvent('water', waterPct, emissions.water);
  },

  updateSegment(element, pct, circumference, offset) {
    if (!element) return;
    const strokeDash = (pct / 100) * circumference;
    element.style.strokeDasharray = `${strokeDash} ${circumference}`;
    element.style.strokeDashoffset = -offset;
  },

  resetChartCenter() {
    dom.chartPercent.textContent = `${state.emissions.total.toFixed(2)} t`;
    dom.chartCategory.textContent = 'Total Emissions';
  },

  setupHoverEvent(category, percent, value) {
    const selector = `.legend-item[data-category="${category}"]`;
    const legendItem = document.querySelector(selector);
    const sliceElement = document.getElementById(`slice-${category}`);
    
    const categoryLabels = {
      transport: 'Transportation',
      diet: 'Dietary Choice',
      electricity: 'Utility Power',
      water: 'Water Treatment'
    };

    const handleHover = () => {
      dom.chartPercent.textContent = `${percent.toFixed(1)}%`;
      dom.chartCategory.textContent = categoryLabels[category];
      
      // Highlight segment visually
      if (sliceElement) {
        sliceElement.style.strokeWidth = '28';
        sliceElement.style.filter = 'drop-shadow(0px 0px 4px rgba(255,255,255,0.2))';
      }
    };

    const handleLeave = () => {
      ChartDrawer.resetChartCenter();
      if (sliceElement) {
        sliceElement.style.strokeWidth = '24';
        sliceElement.style.filter = 'none';
      }
    };

    if (legendItem) {
      legendItem.addEventListener('mouseenter', handleHover);
      legendItem.addEventListener('mouseleave', handleLeave);
      // Accessible focus events
      legendItem.setAttribute('tabindex', '0');
      legendItem.addEventListener('focus', handleHover);
      legendItem.addEventListener('blur', handleLeave);
    }
  }
};

// --- OFFLINE/FALLBACK PLAN GENERATOR ---
const PlanGenerator = {
  // Pre-designed plans targeting specific profiles
  fallbackLibraries: {
    Transportation: [
      { day: 1, task: "Replace a short vehicle commute (<3km) with walking or cycling.", impact: "-2.2 kg CO₂", category: "Transit" },
      { day: 2, task: "Consolidate errands into a single drive to prevent redundant engine warmups.", impact: "-1.5 kg CO₂", category: "Transit" },
      { day: 3, task: "Set up a shared carpool arrangement for school or office commutes.", impact: "-3.1 kg CO₂", category: "Transit" },
      { day: 4, task: "Calibrate tire pressure; under-inflated tires increase fuel consumption by 3%.", impact: "-0.8 kg CO₂", category: "Transit" },
      { day: 5, task: "Minimize vehicle cabin weight by removing heavy cargo stored in the trunk.", impact: "-0.6 kg CO₂", category: "Transit" },
      { day: 6, task: "Avoid excessive engine idling; turn off the motor if parked over 60 seconds.", impact: "-1.2 kg CO₂", category: "Transit" },
      { day: 7, task: "Adopt public transit options (metro/metro-bus) for weekend activities.", impact: "-4.5 kg CO₂", category: "Transit" }
    ],
    Diet: [
      { day: 1, task: "Incorporate 'Meatless Monday' by going fully plant-based for 24 hours.", impact: "-4.1 kg CO₂", category: "Diet" },
      { day: 2, task: "Swap dairy milk with oat or almond milk alternatives.", impact: "-1.8 kg CO₂", category: "Diet" },
      { day: 3, task: "Audit pantry items; map a plan to eliminate household food waste.", impact: "-2.3 kg CO₂", category: "Diet" },
      { day: 4, task: "Choose locally grown, seasonal ingredients to minimize transit food miles.", impact: "-1.2 kg CO₂", category: "Diet" },
      { day: 5, task: "Prepare a meal consisting exclusively of organic, zero-packaging ingredients.", impact: "-1.5 kg CO₂", category: "Diet" },
      { day: 6, task: "Swap red meat (beef/lamb) for lower-impact plant proteins like beans or lentils.", impact: "-4.8 kg CO₂", category: "Diet" },
      { day: 7, task: "Compost kitchen scraps to limit methane release in garbage landfills.", impact: "-2.0 kg CO₂", category: "Diet" }
    ],
    Electricity: [
      { day: 1, task: "Unplug idle appliance chargers (vampire draw runs continuously).", impact: "-1.1 kg CO₂", category: "Electricity" },
      { day: 2, task: "Lower your water heater temperature baseline setting to 49°C (120°F).", impact: "-1.9 kg CO₂", category: "Electricity" },
      { day: 3, task: "Wash laundry loads utilizing cold water settings exclusively.", impact: "-1.5 kg CO₂", category: "Electricity" },
      { day: 4, task: "Adjust air conditioning settings 2°C warmer (or heating 2°C cooler).", impact: "-2.4 kg CO₂", category: "Electricity" },
      { day: 5, task: "Switch two highly-active incandescent lightbulbs to high-efficiency LEDs.", impact: "-0.8 kg CO₂", category: "Electricity" },
      { day: 6, task: "Air-dry a laundry load on a rack instead of utilizing an electric dryer.", impact: "-2.0 kg CO₂", category: "Electricity" },
      { day: 7, task: "Activate power-management eco-modes on laptop, TV, and gaming consoles.", impact: "-1.0 kg CO₂", category: "Electricity" }
    ],
    Water: [
      { day: 1, task: "Shorten your daily shower duration to a strict 5-minute limit.", impact: "-1.8 kg CO₂", category: "Water" },
      { day: 2, task: "Turn off running faucets while brushing teeth or soaping hands.", impact: "-0.9 kg CO₂", category: "Water" },
      { day: 3, task: "Only run the dishwasher when loaded to full capacity.", impact: "-1.1 kg CO₂", category: "Water" },
      { day: 4, task: "Inspect toilets and pipe faucets for hidden slow water leaks.", impact: "-0.5 kg CO₂", category: "Water" },
      { day: 5, task: "Equip kitchen sink faucets with high-efficiency low-flow aerators.", impact: "-1.4 kg CO₂", category: "Water" },
      { day: 6, task: "Utilize captured greywater (vegetable rinse wash) to water household plants.", impact: "-0.7 kg CO₂", category: "Water" },
      { day: 7, task: "Run washing machines only with full loads to reduce water-heating cycles.", impact: "-2.2 kg CO₂", category: "Water" }
    ]
  },

  generateLocalPlan() {
    const driver = state.highestCategory || 'Transportation';
    const primaryLibrary = this.fallbackLibraries[driver] || this.fallbackLibraries.Transportation;
    
    // To ensure full coverage, mix in a few general tips if needed, but prioritize the main driver
    const plan = JSON.parse(JSON.stringify(primaryLibrary));
    state.weeklyPlan = plan.map(item => ({
      ...item,
      completed: false
    }));

    // Cache state to local storage
    this.saveProgressState();
    this.renderPlanUI();
  },

  saveProgressState() {
    localStorage.setItem('ecomentor_weekly_plan', JSON.stringify(state.weeklyPlan));
  },

  loadProgressState() {
    try {
      const stored = localStorage.getItem('ecomentor_weekly_plan');
      if (stored) {
        state.weeklyPlan = JSON.parse(stored);
        this.renderPlanUI();
      }
    } catch (e) {
      console.error('Failed to load plan progress', e);
    }
  },

  renderPlanUI() {
    dom.planGridContainer.innerHTML = '';
    
    if (!state.weeklyPlan || state.weeklyPlan.length === 0) {
      dom.actionPlanSection.classList.add('hidden');
      return;
    }

    dom.actionPlanSection.classList.remove('hidden');
    let completedCount = 0;

    state.weeklyPlan.forEach((day, index) => {
      if (day.completed) completedCount++;

      const div = document.createElement('div');
      div.className = `day-card ${day.completed ? 'completed' : ''}`;
      div.setAttribute('role', 'listitem');

      div.innerHTML = `
        <div class="day-header">
          <span class="day-label">Day ${day.day} • ${escapeHTML(day.category)}</span>
          <span class="day-impact">${escapeHTML(day.impact)}</span>
        </div>
        <label class="day-task-label" for="task-chk-${index}">
          <input type="checkbox" id="task-chk-${index}" class="day-checkbox" ${day.completed ? 'checked' : ''}>
          <span>${escapeHTML(day.task)}</span>
        </label>
      `;

      // Event listener for checkbox progress toggle
      const checkbox = div.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        state.weeklyPlan[index].completed = e.target.checked;
        this.saveProgressState();
        this.renderPlanUI();
      });

      dom.planGridContainer.appendChild(div);
    });

    // Update progress tracker bar
    const totalDays = state.weeklyPlan.length;
    const percentage = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
    dom.planCompletionPercent.textContent = `${percentage}%`;
    dom.planProgressIndicator.style.width = `${percentage}%`;
    dom.planProgressIndicator.setAttribute('aria-valuenow', percentage);
  }
};

// --- GEMINI API CLIENT & INTERACTION ---
const AIModule = {
  isConnecting: false,

  setApiKey() {
    const rawKey = dom.geminiApiKeyInput.value.trim();
    if (!rawKey) {
      this.showStatus('Please enter a key before connecting.', true);
      return;
    }
    
    // In-memory assignment
    geminiApiKey = rawKey;
    dom.geminiApiKeyInput.value = ''; // Immediately clear input field for security
    dom.saveApiKeyBtn.classList.add('hidden');
    dom.clearApiKeyBtn.classList.remove('hidden');
    this.showStatus('Gemini API key linked in-memory successfully!');
  },

  clearApiKey() {
    geminiApiKey = '';
    dom.saveApiKeyBtn.classList.remove('hidden');
    dom.clearApiKeyBtn.classList.add('hidden');
    dom.geminiApiKeyInput.value = '';
    this.showStatus('API key cleared from memory.');
  },

  showStatus(msg, isError = false) {
    dom.apiStatusMsg.textContent = msg;
    dom.apiStatusMsg.style.color = isError ? 'var(--accent-rose)' : 'var(--accent-cyan)';
  },

  async queryCoach(promptText, customChat = false) {
    if (!geminiApiKey) {
      this.handleCoachFallback(promptText, customChat);
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;
    this.setTypingIndicator(true);

    try {
      // Endpoint using Gemini 1.5 Flash (highly performant and general purpose)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      
      const requestPayload = {
        contents: [{
          parts: [{ text: promptText }]
        }]
      };

      // Set JSON schema if compiling initial report plan
      if (!customChat) {
        requestPayload.generationConfig = {
          responseMimeType: "application/json"
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`API returned status code: ${response.status}`);
      }

      const responseData = await response.json();
      const contentText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!contentText) {
        throw new Error('Empty model payload response.');
      }

      if (customChat) {
        this.appendChatMessage(contentText, 'system');
      } else {
        this.processAIPortfolioPlan(contentText);
      }
    } catch (e) {
      console.error('Gemini connection error', e);
      if (customChat) {
        this.appendChatMessage("I encountered an issue communicating with the AI service. Running local fallback advice mode. Let's chat offline!", 'system');
      } else {
        // Fallback to local plan silently if setup report failed
        PlanGenerator.generateLocalPlan();
        this.appendChatMessage(`Hello ${state.userName}! I've generated a customized fallback action plan targeting your highest emission category: **${state.highestCategory}**! You can ask me custom questions below!`, 'system');
      }
    } finally {
      this.isConnecting = false;
      this.setTypingIndicator(false);
    }
  },

  processAIPortfolioPlan(rawJsonText) {
    try {
      // Sanitize potential backticks wrap
      let cleanJson = rawJsonText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.slice(7);
      }
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.slice(3);
      }
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.slice(0, -3);
      }
      cleanJson = cleanJson.trim();

      const payload = JSON.parse(cleanJson);
      
      // Load Analysis greeting
      if (payload.analysis) {
        this.appendChatMessage(payload.analysis, 'system');
      }

      // Load action plan
      if (payload.weekly_plan && Array.isArray(payload.weekly_plan)) {
        state.weeklyPlan = payload.weekly_plan.map(item => ({
          day: item.day,
          task: escapeHTML(item.task),
          impact: escapeHTML(item.impact),
          category: escapeHTML(item.category),
          completed: false
        }));
        PlanGenerator.saveProgressState();
        PlanGenerator.renderPlanUI();
      } else {
        // Failover
        PlanGenerator.generateLocalPlan();
      }
    } catch (e) {
      console.error('Failed to parse AI JSON plan, triggering fallback generator', e);
      PlanGenerator.generateLocalPlan();
    }
  },

  handleCoachFallback(promptText, customChat) {
    if (!customChat) {
      PlanGenerator.generateLocalPlan();
      this.appendChatMessage(`Hello **${state.userName}**! I'm acting as your offline Coach. Since no Gemini API key is linked, I've loaded a customized 7-day sustainability plan targeting your highest emissions source: **${state.highestCategory}**! You can link a key at any time in the 'AI Setup' tab for deep contextual chatting.`, 'system');
    } else {
      this.setTypingIndicator(true);
      setTimeout(() => {
        this.setTypingIndicator(false);
        const lowerPrompt = promptText.toLowerCase();
        let reply = `Offline Coach Mode: I am ready to guide you! Since there's no API key active, here is targeted advice for your **${state.highestCategory}** category: `;
        
        if (lowerPrompt.includes('electricity') || lowerPrompt.includes('power') || lowerPrompt.includes('light')) {
          reply = "Electricity tips: Switch household bulbs to LEDs, enable smart eco power-strips, and run washing cycles on cold water. This reduces carbon loads immediately!";
        } else if (lowerPrompt.includes('travel') || lowerPrompt.includes('car') || lowerPrompt.includes('transit') || lowerPrompt.includes('commute')) {
          reply = "Transit tips: Opt for public buses or trains when travelling. For distances under 3km, walk or bike. Regular vehicle tire pressure checks improve gas mileage.";
        } else if (lowerPrompt.includes('diet') || lowerPrompt.includes('food') || lowerPrompt.includes('eat') || lowerPrompt.includes('meat')) {
          reply = "Dietary tips: Swapping mixed meals for vegetarian choices even twice a week significantly curbs agricultural methane release. Focus on local pantry options!";
        } else if (lowerPrompt.includes('water') || lowerPrompt.includes('shower') || lowerPrompt.includes('leak')) {
          reply = "Water tips: Low-flow shower aerators reduce volume usage by 30%. Fixing slow residential leakages prevents wasted municipal supply energy.";
        } else {
          reply += `Try making small adjustments daily. Focus first on reducing **${state.highestCategory.toLowerCase()}** as it contributes most to your score.`;
        }
        
        this.appendChatMessage(reply, 'system');
      }, 700);
    }
  },

  appendChatMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-message chat-message-${sender}`;
    
    // Safe text formatting for basic markdown support (bolding and lists)
    let safeText = escapeHTML(text);
    
    // Translate **bold** to safe HTML
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Translate single bullet points (* item or - item)
    safeText = safeText.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return `<li>${trimmed.substring(2)}</li>`;
      }
      return line ? `<p>${line}</p>` : '';
    }).join('');

    // If text contains <li>, wrap them in list tags
    if (safeText.includes('<li>')) {
      // Re-wrap groups of list items
      safeText = safeText.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    }

    bubble.innerHTML = safeText;
    dom.chatMessagesContainer.appendChild(bubble);
    
    // Auto scroll chat box
    dom.chatMessagesContainer.scrollTop = dom.chatMessagesContainer.scrollHeight;
  },

  setTypingIndicator(visible) {
    if (visible) {
      dom.chatTypingStatus.classList.remove('hidden');
      dom.chatMessagesContainer.scrollTop = dom.chatMessagesContainer.scrollHeight;
    } else {
      dom.chatTypingStatus.classList.add('hidden');
    }
  },

  triggerInitialAnalysisPrompt() {
    const promptText = `
      You are the user's AI Sustainability Coach.
      Profile details:
      Name: ${state.userName}
      Diet Type: ${dom.dietType.value}
      Daily travel: ${dom.travelDistance.value} km via ${dom.travelMode.value}
      Monthly utility power: ${dom.electricityUsage.value} kWh
      Water tier: ${dom.waterUsage.value}

      Calculations:
      Transit footprint: ${state.emissions.transport} tonnes CO2e/year
      Diet footprint: ${state.emissions.diet} tonnes CO2e/year
      Electricity footprint: ${state.emissions.electricity} tonnes CO2e/year
      Water footprint: ${state.emissions.water} tonnes CO2e/year
      Total footprint: ${state.emissions.total} tonnes CO2e/year
      Sustainability Rating: ${state.rating}
      Highest Driver: ${state.highestCategory}

      Tasks:
      1. Write a direct, encouraging analysis greeting addressing ${state.userName} by name. Detail which category is their primary emissions source, why it is high, and how their footprint ranks against the Paris Agreement target of staying under 2.0 tonnes per capita. (Max 200 words).
      2. Construct a tailored 7-day action reduction plan. Each day must feature a specific target category, a short task (max 15 words), and a calculated impact (in kg CO2 saved).
      
      Return ONLY a JSON response matching the following schema. Avoid wrapping in markdown blocks or writing extra descriptions outside the JSON.
      {
        "analysis": "Hello User...",
        "weekly_plan": [
          { "day": 1, "task": "Replace a short trip with walking.", "impact": "-1.5 kg CO2", "category": "Transit" },
          ... up to day 7
        ]
      }
    `;
    
    // Clear chat container first
    dom.chatMessagesContainer.innerHTML = '';
    
    // Initiate AI fetch
    this.queryCoach(promptText, false);
  },

  triggerChatQueryPrompt(questionText) {
    const promptText = `
      You are the AI Sustainability Coach. Respond to the user's question.
      User's profile details:
      Name: ${state.userName}
      Diet: ${dom.dietType.value}
      Transit: ${dom.travelDistance.value} km/day via ${dom.travelMode.value} (Footprint: ${state.emissions.transport} tonnes)
      Electricity: ${dom.electricityUsage.value} kWh/month (Footprint: ${state.emissions.electricity} tonnes)
      Water tier: ${dom.waterUsage.value} (Footprint: ${state.emissions.water} tonnes)
      Total Footprint: ${state.emissions.total} tonnes. Rating: ${state.rating}
      Highest driver is: ${state.highestCategory}

      User question: "${questionText}"

      Write a concise, practical reply (max 120 words). Offer scientific context and actionable suggestions.
    `;
    this.queryCoach(promptText, true);
  }
};

// --- DOM RENDERERS ---
function renderDashboard() {
  dom.resultsSection.classList.remove('hidden');
  dom.totalScoreDisplay.textContent = state.emissions.total.toFixed(2);
  
  // Rating badge styling
  dom.ratingBadgeDisplay.textContent = state.rating;
  dom.ratingBadgeDisplay.className = 'rating-badge'; // Reset classes
  const ratingClass = state.rating.toLowerCase().replace(/ /g, '-');
  dom.ratingBadgeDisplay.classList.add(`rating-${ratingClass}`);

  // Value legends
  dom.valTransport.textContent = state.emissions.transport.toFixed(2);
  dom.valDiet.textContent = state.emissions.diet.toFixed(2);
  dom.valElectricity.textContent = state.emissions.electricity.toFixed(2);
  dom.valWater.textContent = state.emissions.water.toFixed(2);

  // Highest driver alert
  dom.highestCategoryDisplay.textContent = state.highestCategory;
  dom.highestContribAlert.classList.remove('hidden');

  // Dynamic dominant category action guide
  const explanationLibrary = {
    Transportation: {
      explanation: "Transportation emissions dominate because of daily combustion of fossil fuels (gas/diesel) in personal vehicles. Commuting solo in a personal car releases significant greenhouse gases per kilometer compared to collective transport.",
      tip: "Replace one driving commute per week with public transit, or carpool with a colleague. Alternatively, switch trips under 3km to walking or cycling to save approximately 2.2 kg of CO₂ per trip."
    },
    Diet: {
      explanation: "Dietary emissions dominate due to the resource-intensive nature of animal agriculture. Livestock production (especially beef and lamb) accounts for substantial methane emissions, land clearing, and feed production footprint.",
      tip: "Swap beef or lamb for plant-based proteins (beans, lentils, tofu) twice a week. Introducing Meatless Mondays alone can reduce your annual food footprint by up to 20%."
    },
    Electricity: {
      explanation: "Electricity footprint dominates because power grids rely heavily on fossil fuels (coal/gas). Large appliances, heating/cooling systems, and standby 'vampire' power draw generate high carbon footprints over time.",
      tip: "Wash laundry in cold water and air-dry on a rack to save up to 2.0 kg of CO₂ per load. Additionally, adjust your thermostat by 2°C and unplug idle electronics."
    },
    Water: {
      explanation: "Water footprint dominates due to the massive energy required by municipal systems to treat, pump, and heat water. Hot water usage (showers, washing machines) carries a double energy penalty.",
      tip: "Install a high-efficiency low-flow showerhead and limit showers to 5 minutes. This can save up to 1.8 kg of CO₂ daily from water-heating and purification energy."
    }
  };

  const guide = explanationLibrary[state.highestCategory] || explanationLibrary.Transportation;
  dom.driverExplanationText.textContent = guide.explanation;
  dom.driverTipText.textContent = guide.tip;
  dom.driverRecommendationCard.classList.remove('hidden');

  // Math expressions details
  const dist = parseFloat(dom.travelDistance.value);
  const mode = dom.travelMode.value;
  const diet = dom.dietType.value;
  const kwh = parseFloat(dom.electricityUsage.value);
  const waterVal = dom.waterUsage.value;

  dom.explainTransportMath.innerHTML = `(${dist} km/day × 365 days × ${EMISSION_FACTORS.transport[mode]} kg CO₂/km) / 1000 = <strong>${state.emissions.transport}</strong> tonnes CO₂e`;
  dom.explainDietMath.innerHTML = `(${EMISSION_FACTORS.diet[diet]} kg CO₂/day × 365 days) / 1000 = <strong>${state.emissions.diet}</strong> tonnes CO₂e`;
  dom.explainElectricityMath.innerHTML = `(${kwh} kWh/month × 12 months × 0.5 kg CO₂/kWh) / 1000 = <strong>${state.emissions.electricity}</strong> tonnes CO₂e`;
  dom.explainWaterMath.innerHTML = `(${EMISSION_FACTORS.water[waterVal]} kg CO₂/month × 12 months) / 1000 = <strong>${state.emissions.water}</strong> tonnes CO₂e`;

  // Draw chart
  ChartDrawer.renderSVGChart();
  
  // Scroll to dashboard smoothly
  dom.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- INITIALIZATION & EVENT BINDINGS ---
function init() {
  // 1. Slider real-time response
  dom.travelDistance.addEventListener('input', (e) => {
    dom.travelDistanceVal.textContent = `${e.target.value} km`;
  });

  // 2. Form submission
  dom.footprintForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    calculateCarbonFootprint();
    HistoryManager.saveAssessment();
    renderDashboard();
    
    // Load/Generate Action Plan & Start coach conversation
    dom.aiCoachSection.classList.remove('hidden');
    AIModule.triggerInitialAnalysisPrompt();
  });

  // 3. API collapsible settings panel
  dom.toggleApiPanelBtn.addEventListener('click', () => {
    const isHidden = dom.apiSettingsContainer.classList.contains('hidden');
    if (isHidden) {
      dom.apiSettingsContainer.classList.remove('hidden');
      dom.toggleApiPanelBtn.setAttribute('aria-expanded', 'true');
      dom.geminiApiKeyInput.focus();
    } else {
      dom.apiSettingsContainer.classList.add('hidden');
      dom.toggleApiPanelBtn.setAttribute('aria-expanded', 'false');
    }
  });

  dom.saveApiKeyBtn.addEventListener('click', () => {
    AIModule.setApiKey();
  });

  dom.clearApiKeyBtn.addEventListener('click', () => {
    AIModule.clearApiKey();
  });

  // Support pressing 'Enter' key inside API key inputs
  dom.geminiApiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      AIModule.setApiKey();
    }
  });

  // 4. Chat queries submissions
  dom.chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = dom.chatInputMsg.value.trim();
    if (!query) return;

    // Append user message
    AIModule.appendChatMessage(query, 'user');
    dom.chatInputMsg.value = '';
    
    // Ask AI Coach
    AIModule.triggerChatQueryPrompt(query);
  });

  // 5. History and Export controls
  dom.clearHistoryBtn.addEventListener('click', () => {
    HistoryManager.clearHistory();
  });
  dom.exportHistoryBtn.addEventListener('click', () => {
    HistoryManager.exportJSON();
  });

  // Load history on load
  HistoryManager.loadHistory();
  HistoryManager.renderHistoryTable();

  // Load saved plan progress if any
  PlanGenerator.loadProgressState();
}

// Kickstart script on DOM load
window.addEventListener('DOMContentLoaded', init);
