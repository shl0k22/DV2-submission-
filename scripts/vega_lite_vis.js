//-----------------------------------------------------
// Define all visualisation specs and their container IDs
//-----------------------------------------------------
const specs = {
  map: 'visuals/map.vg.json',
  timeseries: 'visuals/timeseries.vg.json',
  topcommodities: 'visuals/top_commodities.vg.json',
  portsmap: 'visuals/portsmap.vg.json',
  tradebalance: 'visuals/trade_balance.vg.json',
  tradecomposition: 'visuals/trade_composition.vg.json',
  tradeflows: 'visuals/trade_sankey.vg.json',
  regionalshare: 'visuals/regional_share.vg.json'
};

// Store active Vega/Vega-Lite view instances
const views = {};

// Embed options - FIX: Use SVG renderer for better tooltip support
const opts = { 
  actions: false, 
  renderer: 'svg',
  tooltip: true
};

//-----------------------------------------------------
// Load all visualisations asynchronously
//-----------------------------------------------------
async function loadAll() {
  console.log("🌏 Loading all visualisations...");

  for (const [el, spec] of Object.entries(specs)) {
    try {
      const res = await vegaEmbed(`#${el}`, spec, opts);
      views[el] = res.view;
      console.log(`✅ Loaded ${el} from ${spec}`);
    } catch (err) {
      console.warn(`⚠️ Could not load ${spec}:`, err);
    }
  }

  // Apply initial filter states once everything is loaded
  applyControls();
}

//-----------------------------------------------------
// Apply global controls (Year + Trade Direction)
//-----------------------------------------------------
function applyControls() {
  const year = +document.getElementById('yearSlider').value;
  const trade = document.getElementById('tradeType').value;

  // Update label near slider
  document.getElementById('yearValue').textContent = `${year}`;

  Object.entries(views).forEach(([name, view]) => {
    try {
      // Get list of signal names for this view (Vega and Vega-Lite safe)
      const signals = view._signals
        ? Object.keys(view._signals)
        : (view.getState()?.signals ? Object.keys(view.getState().signals) : []);

      // ✅ Only apply if the chart actually defines these signals
      if (signals.includes('yearFilter')) {
        view.signal('yearFilter', year);
      }
      if (signals.includes('tradeType')) {
        view.signal('tradeType', trade);
      }

      // Run updates asynchronously
      view.runAsync();
    } catch (err) {
      console.warn(`⚠️ Could not update signals for ${name}:`, err);
    }
  });
}

//-----------------------------------------------------
// Debounce user input for smoother interactivity
//-----------------------------------------------------
let debounceTimeout;
function debouncedApplyControls() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(applyControls, 120);
}

//-----------------------------------------------------
// Initialise when the DOM is ready
//-----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadAll();

  // Attach global filter listeners
  document.getElementById('yearSlider').addEventListener('input', debouncedApplyControls);
  document.getElementById('tradeType').addEventListener('change', applyControls);
});