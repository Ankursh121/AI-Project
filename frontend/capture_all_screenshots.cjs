const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureAll() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const outDir = path.resolve(__dirname, '..', 'screenshots');
  const typoOutDir = path.resolve(__dirname, '..', 'screesnhots');

  for (const dir of [outDir, typoOutDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Delete test file if exists
  const testFile = path.join(outDir, '00_test.png');
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    },
  });

  const page = await browser.newPage();

  async function takeScreenshot(filename, description) {
    console.log(`Capturing: ${filename} (${description})...`);
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    
    // Also copy to typoOutDir
    fs.copyFileSync(filePath, path.join(typoOutDir, filename));
    console.log(`Saved ${filename} (${fs.statSync(filePath).size} bytes)`);
  }

  try {
    // 1. Initial Load - Overview & Vedanta A* Route
    console.log('Navigating to http://127.0.0.1:3000...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(4000); // Wait for Three.js 3D canvas and route to calculate

    await takeScreenshot(
      '01_campus_digital_twin_overview.png',
      'Full 3D Digital Twin campus overview with Vedanta, Chanakya, Sarojini and foothills backdrop'
    );

    await takeScreenshot(
      '02_vedanta_evacuation_astar.png',
      'Vedanta Academic Block evacuation planning via A* algorithm'
    );

    // 2. Step-by-Step Instructions Toggle
    console.log('Toggling step-by-step route instructions...');
    const btnSteps = await page.$('#btn-toggle-route-steps');
    if (btnSteps) {
      await btnSteps.click();
      await sleep(1000);
      await takeScreenshot(
        '03_route_turn_by_turn_steps.png',
        'Turn-by-turn numbered emergency evacuation instructions'
      );
      // Toggle back to chips
      await btnSteps.click();
      await sleep(500);
    }

    // 3. Chanakya Administrative Block Route
    console.log('Selecting Chanakya Administrative Block...');
    await page.select('#start-location-select', 'CHANAKYA');
    await sleep(1500);
    const btnCalculate = await page.$('#btn-find-safe-route');
    if (btnCalculate) await btnCalculate.click();
    await sleep(2500);
    await takeScreenshot(
      '04_chanakya_admin_block_route.png',
      'Chanakya Administrative Block evacuation route to South Portico Gate'
    );

    // 4. Sarojini Girls Hostel Route
    console.log('Selecting Sarojini Girls Hostel...');
    await page.select('#start-location-select', 'SAROJINI');
    await sleep(1500);
    if (btnCalculate) await btnCalculate.click();
    await sleep(2500);
    await takeScreenshot(
      '05_sarojini_hostel_route.png',
      'Sarojini Girls Hostel evacuation route to East Perimeter Hostel Exit'
    );

    // 5. Dynamic Hazard Simulation & Obstacle Avoidance
    console.log('Simulating Emergency Hazard...');
    const btnHazard = await page.$('#btn-simulate-hazard');
    if (btnHazard) {
      await btnHazard.click();
      await sleep(3500); // Wait for hazard injection and route recalculation
      await takeScreenshot(
        '06_dynamic_hazard_fire_avoidance.png',
        'Dynamic hazard fire simulation with real-time route replanning'
      );
    }

    // Reset Scenario
    const btnReset = await page.$('#btn-reset-scenario');
    if (btnReset) {
      await btnReset.click();
      await sleep(2000);
    }

    // Switch back to Vedanta for algorithm comparisons
    await page.select('#start-location-select', 'VEDANTA');
    await sleep(1000);

    // 6. Dijkstra Algorithm Routing
    console.log('Selecting Dijkstra algorithm...');
    await page.select('#algorithm-select', 'dijkstra');
    await sleep(1000);
    if (btnCalculate) await btnCalculate.click();
    await sleep(2500);
    await takeScreenshot(
      '07_dijkstra_shortest_path.png',
      'Evacuation route planning using Dijkstras algorithm'
    );

    // 7. BFS Algorithm Routing
    console.log('Selecting BFS algorithm...');
    await page.select('#algorithm-select', 'bfs');
    await sleep(1000);
    if (btnCalculate) await btnCalculate.click();
    await sleep(2500);
    await takeScreenshot(
      '08_bfs_breadth_first_search.png',
      'Evacuation route planning using Breadth-First Search (BFS)'
    );

    // 8. Utility Agent Routing
    console.log('Selecting Utility Agent...');
    await page.select('#algorithm-select', 'utility');
    await sleep(1000);
    if (btnCalculate) await btnCalculate.click();
    await sleep(2500);
    await takeScreenshot(
      '09_utility_agent_intelligent_routing.png',
      'Multi-objective Utility Agent intelligent routing'
    );

    // 9. Scenarios: Fire Near Vedanta
    console.log('Selecting scenario: Fire Near Vedanta...');
    await page.select('#scenario-select', 'scenario_fire_vedanta');
    await sleep(3000);
    if (btnCalculate) await btnCalculate.click();
    await sleep(2500);
    await takeScreenshot(
      '10_scenario_fire_near_vedanta.png',
      'Emergency scenario: Fire Near Vedanta with path blockage and reroute'
    );

    // 10. Scenarios: Blocked Campus Path
    console.log('Selecting scenario: Blocked Campus Path...');
    await page.select('#scenario-select', 'scenario_blocked_path');
    await sleep(3000);
    if (btnCalculate) await btnCalculate.click();
    await sleep(2500);
    await takeScreenshot(
      '11_scenario_blocked_campus_path.png',
      'Emergency scenario: Blocked Campus Path with Central Plaza impassable'
    );

    // 11. Scenarios: Exit Unavailable
    console.log('Selecting scenario: Exit Unavailable...');
    await page.select('#scenario-select', 'scenario_exit_unavailable');
    await sleep(3000);
    if (btnCalculate) await btnCalculate.click();
    await sleep(2500);
    await takeScreenshot(
      '12_scenario_exit_unavailable.png',
      'Emergency scenario: South Main Gate Exit Unavailable rerouting to alternate exits'
    );

    // Reset Scenario & View for Panoramic view
    if (btnReset) {
      await btnReset.click();
      await sleep(2000);
    }
    await page.select('#scenario-select', 'scenario_normal');
    await page.select('#start-location-select', 'VEDANTA');
    await page.select('#algorithm-select', 'astar');
    if (btnCalculate) await btnCalculate.click();
    await sleep(2000);

    // 12. Cinematic Unobstructed 3D Campus View
    console.log('Toggling panels for unobstructed cinematic view...');
    const btnToggleControls = await page.$('#btn-toggle-controls');
    const btnCloseRoute = await page.$('#btn-close-route-panel');
    if (btnToggleControls) await btnToggleControls.click();
    await sleep(600);
    if (btnCloseRoute) await btnCloseRoute.click();
    await sleep(1500);
    await takeScreenshot(
      '13_cinematic_full_campus_unobstructed.png',
      'Cinematic unobstructed 3D campus twin with controls minimized'
    );

    // 13. Algorithm Laboratory View
    console.log('Navigating to Algorithm Laboratory (?view=algorithms)...');
    await page.goto('http://127.0.0.1:3000?view=algorithms', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);
    
    // Click Run Benchmark button
    try {
      const benchmarkBtns = await page.$$('button');
      for (const btn of benchmarkBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Run Benchmark')) {
          await btn.click();
          await sleep(2500);
          break;
        }
      }
    } catch (e) {
      console.log('Benchmark click note:', e.message);
    }

    await takeScreenshot(
      '14_algorithm_benchmark_laboratory.png',
      'Algorithm Benchmark & Comparison Laboratory with empirical metrics'
    );

    // 14. Evacuation Reports & Analytics View
    console.log('Navigating to Evacuation Reports (?view=reports)...');
    await page.goto('http://127.0.0.1:3000?view=reports', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2500);

    await takeScreenshot(
      '15_evacuation_reports_and_analytics.png',
      'Comprehensive post-evacuation diagnostics, safety KPIs and report'
    );

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture process:', err);
  } finally {
    await browser.close();
  }
}

captureAll();
