// ============================================================================
// INDEPENDENT PHASE PERFORMANCE MEASUREMENT SYSTEM
// For generating comprehensive compilation pipeline analysis for academic thesis
// Approach: Phase1(Compile→Execute) + Phase2(CompileLink→Execute) independently
// Provides separate success rates and timing for each approach, handles failures gracefully
// ============================================================================

// Performance mode flag - disables UI updates during measurement
window.isPerformanceModeActive = false;

// Performance data collection object
window.performanceData = {
  compilationTimes: [],
  executionTimes: [],
  memoryUsage: [],
  testResults: [],
  systemInfo: {},
  startTime: null,
  categories: {},
  moduleLoadingTimes: {
    tinycc: null,
    unicorn: null,
    capstone: null,
    total: null
  }
};

// Collect system information
function collectSystemInfo() {
  const systemInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
    memory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Unknown',
    timestamp: new Date().toISOString(),
    browser: getBrowserInfo(),
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth
    }
  };
  
  window.performanceData.systemInfo = systemInfo;
  console.log('📊 System info collected:', systemInfo);
  return systemInfo;
}

// Get browser information
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let version = 'Unknown';
  
  if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
    version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }
  
  return `${browserName} ${version}`;
}

// Memory usage measurement
function measureMemoryUsage() {
  if (performance.memory) {
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
      timestamp: performance.now()
    };
  }
  return null;
}

// WebAssembly module loading time measurement
window.measureModuleLoadTime = function(moduleName, startTime, endTime) {
  const loadTime = endTime - startTime;
  const memory = measureMemoryUsage();
  
  window.performanceData.moduleLoadingTimes[moduleName.toLowerCase()] = {
    loadTime: Math.round(loadTime * 100) / 100,
    memory: memory ? memory.used : null,
    timestamp: new Date().toISOString(),
    success: true
  };
  
  console.log(`📊 ${moduleName} WebAssembly module loaded in ${loadTime.toFixed(2)}ms`);
  
  // Check if all three modules are loaded and calculate total
  const modules = window.performanceData.moduleLoadingTimes;
  if (modules.tinycc && modules.unicorn && modules.capstone && !modules.total) {
    const totalTime = Math.max(
      modules.tinycc.loadTime || 0,
      modules.unicorn.loadTime || 0, 
      modules.capstone.loadTime || 0
    );
    
    modules.total = {
      loadTime: totalTime,
      allModulesSuccessful: modules.tinycc.success && modules.unicorn.success && modules.capstone.success,
      totalMemoryUsed: (modules.tinycc.memory || 0) + (modules.unicorn.memory || 0) + (modules.capstone.memory || 0),
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 All WebAssembly modules loaded!');
    console.log(`📊 Total loading time: ${totalTime.toFixed(2)}ms`);
  }
};

// Enhanced test execution with dual-mode performance measurement (compile + link)
async function runTestWithPerformanceMeasurement(testName, testData) {
  const overallStartTime = performance.now();
  const startMemory = measureMemoryUsage();
  
  console.log(`📊 Starting dual-mode performance measurement for ${testName}`);
  
  try {
    // Load test code
    if (sourceCodeEditor) {
      sourceCodeEditor.setValue(testData.code);
    }
    
    // ===== PHASE 1: COMPILE-ONLY WITH EXECUTION =====
    console.log(`📊 ${testName} - Phase 1: Compile-only + Execute`);
    const phase1StartTime = performance.now();
    const phase1StartMemory = measureMemoryUsage();
    
    let compileOnlySuccess = false;
    let objectExecutionSuccess = false;
    let compileOnlyTime = 0;
    let objectExecutionTime = 0;
    let objectActualValue = 'ERROR';
    
    // Phase 1 function names - accessible across both phases
    let phase1FunctionNames = null;
    let phase1LastCode = null;
    
    // Step 1A: Compile only
    let objectFileData = null;
    try {
      compileFromSource('compile');
      await new Promise(resolve => setTimeout(resolve, 1000));
      compileOnlySuccess = true;
      // Store the object file data for Phase 1 execution
      objectFileData = resultData;
      console.log(`📊 ${testName} - Phase 1A: Compilation succeeded, object file stored (${objectFileData ? objectFileData.length : 0} bytes)`);
      
      // IMMEDIATELY save Phase 1 function names before they can be contaminated
      phase1FunctionNames = window.compiledFunctionNames;
      phase1LastCode = window.lastCompiledCode;
      // Also save to window global to avoid scoping issues
      window.savedPhase1Functions = phase1FunctionNames;
      window.savedPhase1Code = phase1LastCode;
      console.log(`📊 ${testName} - Phase 1A: Saved function names:`, phase1FunctionNames ? phase1FunctionNames.map(f => f.name) : 'null');
    } catch (error) {
      console.warn(`📊 ${testName} - Phase 1A: Compilation failed:`, error);
    }
    
    const phase1CompileEndTime = performance.now();
    const phase1CompileEndMemory = measureMemoryUsage();
    compileOnlyTime = phase1CompileEndTime - phase1StartTime;
    
    // Step 1B: Execute using object file (if compilation succeeded)
    if (compileOnlySuccess && objectFileData) {
      console.log(`📊 ${testName} - Phase 1B: Executing with object file (${objectFileData.length} bytes)`);
      const objectExecStartTime = performance.now();
      
      try {
        // Temporarily store current resultData and use object file data
        const originalResultData = resultData;
        const originalResultType = resultType;
        resultData = objectFileData;
        resultType = 'object';
        
        objectActualValue = await executeCodeAndGetResult(testData.timeout || 20000);
        objectExecutionSuccess = true;
        console.log(`📊 ${testName} - Phase 1B: Object execution succeeded, result: ${objectActualValue}`);
        
        // Store object file data for comparison
        window.lastObjectFileData = originalResultData;
        
        // Restore original result data
        resultData = originalResultData;
        resultType = originalResultType;
      } catch (error) {
        console.warn(`📊 ${testName} - Phase 1B: Object execution failed:`, error);
        objectActualValue = 'ERROR';
      }
      
      const objectExecEndTime = performance.now();
      objectExecutionTime = objectExecEndTime - objectExecStartTime;
    } else {
      console.log(`📊 ${testName} - Phase 1B: Skipping object execution (compilation failed or no object data)`);
    }
    
    // ===== PHASE 2: COMPILE+LINK WITH EXECUTION =====
    console.log(`📊 ${testName} - Phase 2: Compile+Link + Execute`);
    const phase2StartTime = performance.now();
    const phase2StartMemory = measureMemoryUsage();
    
    let compileLinkSuccess = false;
    let linkedExecutionSuccess = false;
    let compileLinkTime = 0;
    let linkedExecutionTime = 0;
    let linkedActualValue = 'ERROR';
    
    // Step 2A: Compile+Link (fresh start, independent of Phase 1)
    let linkedFileData = null;
    try {
      // Check what's in window.compiledFunctionNames before Phase 2 compile
      console.log(`📊 ${testName} - Phase 2A: Pre-compile function names:`, window.compiledFunctionNames ? window.compiledFunctionNames.map(f => f.name) : 'null');
      
      // DEBUGGING: Check resultData before linking
      console.log(`📊 ${testName} - Phase 2A: Pre-link resultData:`, {
        hasResultData: !!resultData,
        resultType: resultType,
        size: resultData ? resultData.length : 0
      });
      
      compileFromSource('link');
      
      // DEBUGGING: Check resultData after linking
      console.log(`📊 ${testName} - Phase 2A: Post-link resultData:`, {
        hasResultData: !!resultData,
        resultType: resultType,
        size: resultData ? resultData.length : 0
      });
      
      // CRITICAL: Check if linking actually succeeded by comparing file sizes
      const linkedFileSize = resultData ? resultData.length : 0;
      const objectFileSize = window.lastObjectFileData ? window.lastObjectFileData.length : 0;
      
      if (linkedFileSize === objectFileSize && resultType === 'object') {
        console.error(`📊 ${testName} - Phase 2A: LINKING FAILED - resultData still contains object file (${linkedFileSize} bytes)`);
        throw new Error('Linking failed - TinyCC did not generate linked executable');
      }
      
      if (resultType !== 'linked_executable') {
        console.error(`📊 ${testName} - Phase 2A: LINKING FAILED - resultType is '${resultType}', expected 'linked_executable'`);
        throw new Error(`Linking failed - resultType is '${resultType}', not 'linked_executable'`);
      }
      
      // Check what Phase 2 compile did to function names
      console.log(`📊 ${testName} - Phase 2A: Post-compile function names:`, window.compiledFunctionNames ? window.compiledFunctionNames.map(f => f.name) : 'null');
      
      // Restore Phase 1 function names for Phase 2 linking/debugging
      if (phase1FunctionNames) {
        window.compiledFunctionNames = phase1FunctionNames;
        window.lastCompiledCode = phase1LastCode;
        console.log(`📊 ${testName} - Phase 2A: Restored Phase 1 function names:`, phase1FunctionNames.map(f => f.name));
      } else {
        console.log(`📊 ${testName} - Phase 2A: No Phase 1 function names to restore`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      compileLinkSuccess = true;
      // Store the linked executable data for Phase 2 execution
      linkedFileData = resultData;
      console.log(`📊 ${testName} - Phase 2A: Compile+Link succeeded, linked file stored (${linkedFileData ? linkedFileData.length : 0} bytes)`);
    } catch (error) {
      console.warn(`📊 ${testName} - Phase 2A: Compile+Link failed:`, error);
      // Clear any cached linked data to prevent confusion
      linkedFileData = null;
    }
    
    const phase2CompileEndTime = performance.now();
    const phase2CompileEndMemory = measureMemoryUsage();
    compileLinkTime = phase2CompileEndTime - phase2StartTime;
    
    // Step 2B: Execute using linked executable (if compile+link succeeded)
    if (compileLinkSuccess && linkedFileData) {
      console.log(`📊 ${testName} - Phase 2B: Executing with linked executable (${linkedFileData.length} bytes)`);
      const linkedExecStartTime = performance.now();
      
      try {
        // Ensure we're using the linked executable data
        resultData = linkedFileData;
        resultType = 'linked_executable';
        
        // DIRECT ATTACHMENT: Attach Phase 1 function names directly to resultData
        const functionsToUse = window.savedPhase1Functions || phase1FunctionNames;
        
        console.log(`📊 ${testName} - Phase 2B: Debug - window.savedPhase1Functions:`, window.savedPhase1Functions ? window.savedPhase1Functions.map(f => f.name) : 'null');
        console.log(`📊 ${testName} - Phase 2B: Debug - phase1FunctionNames:`, phase1FunctionNames ? phase1FunctionNames.map(f => f.name) : 'null');
        
        if (functionsToUse) {
          // Attach function names directly to the binary data
          linkedFileData._savedPhase1Functions = functionsToUse;
          linkedFileData._savedPhase1Code = window.savedPhase1Code || phase1LastCode;
          console.log(`📊 ${testName} - Phase 2B: Attached Phase 1 functions directly to linkedFileData:`, functionsToUse.map(f => f.name));
        } else {
          console.log(`📊 ${testName} - Phase 2B: No Phase 1 functions available for attachment`);
        }
        
        // CRITICAL FIX: Actually load the linked file data into the debugger!
        console.log(`📊 ${testName} - Phase 2B: Loading linked file data into debugger (${linkedFileData ? linkedFileData.length : 0} bytes)`);
        console.log(`📊 ${testName} - Phase 2B: DEBUGGING - Test code being used:`, testData.code);
        console.log(`📊 ${testName} - Phase 2B: DEBUGGING - Expected result:`, testData.expected);
        
        // Verify the linkedFileData is different from the object file data
        if (window.lastObjectFileData && linkedFileData) {
          const sameLength = window.lastObjectFileData.length === linkedFileData.length;
          const sameContent = sameLength && window.lastObjectFileData.every((byte, i) => byte === linkedFileData[i]);
          console.log(`📊 ${testName} - Phase 2B: DEBUGGING - Object vs Linked file comparison: same length=${sameLength}, same content=${sameContent}`);
        }
        
        const linkLoadSuccess = autoLoadCompiledFile(linkedFileData, 'link');
        if (!linkLoadSuccess) {
          throw new Error('Failed to load linked file data into debugger');
        }
        
        // Wait a moment for the debugger to process the new file
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // DEBUGGING: Check what file is actually loaded in the debugger
        console.log(`📊 ${testName} - Phase 2B: DEBUGGING - About to execute. Current parsed data:`, {
          hasGlobalParsed: !!window.parsed,
          parsedType: window.parsed ? (window.parsed.elfHeader ? 'ELF' : 'unknown') : 'null',
          compiledFunctionNames: window.compiledFunctionNames ? window.compiledFunctionNames.map(f => f.name) : 'null'
        });
        
        // DEBUGGING: Force a manual verification by checking if we can initialize debugger
        try {
          const runUnicornBtn = document.getElementById('runUnicorn');
          console.log(`📊 ${testName} - Phase 2B: DEBUGGING - runUnicorn button state:`, {
            exists: !!runUnicornBtn,
            disabled: runUnicornBtn?.disabled,
            text: runUnicornBtn?.textContent?.trim()
          });
        } catch (debugErr) {
          console.warn(`📊 ${testName} - Phase 2B: DEBUGGING - Button check failed:`, debugErr);
        }
        
        linkedActualValue = await executeCodeAndGetResult(testData.timeout || 20000);
        linkedExecutionSuccess = true;
        console.log(`📊 ${testName} - Phase 2B: Linked execution succeeded, result: ${linkedActualValue}`);
      } catch (error) {
        console.warn(`📊 ${testName} - Phase 2B: Linked execution failed:`, error);
        linkedActualValue = 'ERROR';
      }
      
      const linkedExecEndTime = performance.now();
      linkedExecutionTime = linkedExecEndTime - linkedExecStartTime;
    } else {
      console.log(`📊 ${testName} - Phase 2B: Skipping linked execution (compile+link failed or no linked data)`);
    }
    
    // ===== DETERMINE OVERALL SUCCESS AND BEST RESULT =====
    let success = false;
    let actualValue = 'ERROR';
    let executionMode = 'none';
    
    // Prefer linked execution result, fall back to object execution result
    if (linkedExecutionSuccess && linkedActualValue === testData.expected) {
      success = true;
      actualValue = linkedActualValue;
      executionMode = 'linked';
      console.log(`📊 ${testName} - SUCCESS: Using linked execution result (${linkedActualValue})`);
    } else if (objectExecutionSuccess && objectActualValue === testData.expected) {
      success = true;
      actualValue = objectActualValue;
      executionMode = 'object';
      console.log(`📊 ${testName} - SUCCESS: Using object execution fallback (${objectActualValue})${linkedExecutionSuccess ? ' - linked gave wrong result' : ' - linked execution failed'}`);
    } else {
      // Neither execution succeeded with correct result
      if (linkedExecutionSuccess) {
        actualValue = linkedActualValue;
        executionMode = 'linked_wrong_result';
      } else if (objectExecutionSuccess) {
        actualValue = objectActualValue;
        executionMode = 'object_wrong_result';
      } else {
        actualValue = 'ERROR';
        executionMode = 'both_failed';
      }
      console.log(`📊 ${testName} - FAILURE: Both execution modes failed or gave wrong results`);
    }
    
    const totalTime = performance.now() - overallStartTime;
    const endMemory = measureMemoryUsage();
    
    // Store comprehensive performance data with independent phase tracking
    const performanceResult = {
      testName: testName,
      category: getTestCategory(testName),
      description: testData.description,
      expected: testData.expected,
      actual: actualValue,
      success: success,
      phases: {
        compileOnlySuccess: compileOnlySuccess,
        compileLinkSuccess: compileLinkSuccess,
        objectExecutionSuccess: objectExecutionSuccess,
        linkedExecutionSuccess: linkedExecutionSuccess,
        executionMode: executionMode
      },
      results: {
        objectResult: objectActualValue,
        linkedResult: linkedActualValue
      },
      times: {
        compileOnly: Math.round(compileOnlyTime * 100) / 100,
        compileLink: Math.round(compileLinkTime * 100) / 100,
        objectExecution: Math.round(objectExecutionTime * 100) / 100,
        linkedExecution: Math.round(linkedExecutionTime * 100) / 100,
        total: Math.round(totalTime * 100) / 100
      },
      memory: {
        start: startMemory,
        phase1Start: phase1StartMemory,
        phase1CompileEnd: phase1CompileEndMemory,
        phase2Start: phase2StartMemory,
        phase2CompileEnd: phase2CompileEndMemory,
        end: endMemory
      },
      codeSize: testData.code.length,
      timestamp: new Date().toISOString()
    };
    
    // Add to global performance data
    window.performanceData.testResults.push(performanceResult);
    window.performanceData.compilationTimes.push(compileOnlyTime);
    window.performanceData.executionTimes.push(objectExecutionTime + linkedExecutionTime); // Combined execution time
    
    // Add new arrays for independent phase data
    if (!window.performanceData.compileOnlyTimes) {
      window.performanceData.compileOnlyTimes = [];
    }
    if (!window.performanceData.compileLinkTimes) {
      window.performanceData.compileLinkTimes = [];
    }
    if (!window.performanceData.objectExecutionTimes) {
      window.performanceData.objectExecutionTimes = [];
    }
    if (!window.performanceData.linkedExecutionTimes) {
      window.performanceData.linkedExecutionTimes = [];
    }
    
    window.performanceData.compileOnlyTimes.push(compileOnlyTime);
    window.performanceData.compileLinkTimes.push(compileLinkTime);
    window.performanceData.objectExecutionTimes.push(objectExecutionTime);
    window.performanceData.linkedExecutionTimes.push(linkedExecutionTime);
    
    if (endMemory) {
      window.performanceData.memoryUsage.push(endMemory.used);
    }
    
    console.log(`📊 Dual-mode performance data for ${testName}:`, performanceResult);
    
    return performanceResult;
    
  } catch (error) {
    const totalTime = performance.now() - overallStartTime;
    const endMemory = measureMemoryUsage();
    
    const errorResult = {
      testName: testName,
      category: getTestCategory(testName),
      description: testData.description,
      expected: testData.expected,
      actual: 'ERROR',
      success: false,
      error: error.message,
      phases: {
        compileOnlySuccess: false,
        compileLinkSuccess: false,
        objectExecutionSuccess: false,
        linkedExecutionSuccess: false,
        executionMode: 'error'
      },
      results: {
        objectResult: 'ERROR',
        linkedResult: 'ERROR'
      },
      times: {
        compileOnly: 0,
        compileLink: 0,
        objectExecution: 0,
        linkedExecution: 0,
        total: Math.round(totalTime * 100) / 100
      },
      memory: {
        start: startMemory,
        end: endMemory
      },
      codeSize: testData.code.length,
      timestamp: new Date().toISOString()
    };
    
    window.performanceData.testResults.push(errorResult);
    console.error(`📊 Dual-mode performance measurement failed for ${testName}:`, error);
    
    return errorResult;
  }
}

// Get test category for a test name
function getTestCategory(testName) {
  for (const [category, tests] of Object.entries(testCategories)) {
    if (tests.includes(testName)) {
      return category;
    }
  }
  return 'unknown';
}

// Run all tests with performance measurement
async function runAllTestsWithPerformanceMeasurement() {
  console.log('🚀 Starting comprehensive performance measurement...');
  
  // Enable performance mode to disable UI updates
  window.isPerformanceModeActive = true;
  console.log('📊 Performance mode activated - UI updates disabled');
  
  // Initialize performance data
  window.performanceData.startTime = new Date().toISOString();
  collectSystemInfo();
  
  const testResults = document.getElementById('test-results');
  if (testResults) {
    testResults.innerHTML = '📊 PERFORMANCE MEASUREMENT IN PROGRESS...\n' + '='.repeat(50) + '\n';
  }
  
  let totalTests = 0;
  let completedTests = 0;
  
  // Count total tests
  for (const category of Object.keys(testCategories)) {
    totalTests += testCategories[category].length;
  }
  
  window.performanceData.categories = {};
  
  // Run tests by category
  for (const [categoryName, testList] of Object.entries(testCategories)) {
    console.log(`📂 Starting performance measurement for ${categoryName} category...`);
    
    const categoryResults = {
      name: categoryName,
      tests: [],
      summary: {
        total: testList.length,
        passed: 0,
        failed: 0,
        avgCompilationTime: 0,
        avgExecutionTime: 0,
        avgMemoryUsage: 0
      }
    };
    
    if (testResults) {
      testResults.innerHTML += `\n📂 ${categoryName.toUpperCase()} CATEGORY\n` + '-'.repeat(30) + '\n';
    }
    
    // Run each test in category
    for (const testName of testList) {
      completedTests++;
      updateTestProgress(completedTests, totalTests);
      
      // Clear function names between different tests to prevent cross-contamination
      // This ensures each test gets fresh function symbol mapping
      window.compiledFunctionNames = null;
      window.lastCompiledCode = null;
      // Also clear our saved Phase 1 function globals
      window.savedPhase1Functions = null;
      window.savedPhase1Code = null;
      
      console.log(`🧪 Dual-mode performance measuring: ${testName} (${completedTests}/${totalTests})`);
      
      if (testResults) {
        testResults.innerHTML += `🧪 ${testName} (compile+link)... `;
        testResults.scrollTop = testResults.scrollHeight;
      }
      
      try {
        const result = await runTestWithPerformanceMeasurement(testName, tests[testName]);
        categoryResults.tests.push(result);
        
        if (result.success) {
          categoryResults.summary.passed++;
        } else {
          categoryResults.summary.failed++;
        }
        
        if (testResults) {
          const phases = result.phases;
          const times = result.times;
          
          // Show overall status with context about which mode succeeded
          let overallStatus;
          if (result.success) {
            if (result.phases.executionMode === 'object') {
              if (result.phases.compileLinkSuccess && !result.phases.linkedExecutionSuccess) {
                overallStatus = '✅ OVERALL PASS (fallback to object - linked compiled but failed execution)';
              } else if (!result.phases.compileLinkSuccess) {
                overallStatus = '✅ OVERALL PASS (fallback to object - linking failed)';
              } else {
                overallStatus = '✅ OVERALL PASS (preferred object)';
              }
            } else if (result.phases.executionMode === 'linked') {
              overallStatus = '✅ OVERALL PASS (linked executable working)';
            } else {
              overallStatus = '✅ OVERALL PASS';
            }
          } else {
            overallStatus = '❌ OVERALL FAIL';
          }
          testResults.innerHTML += `${overallStatus}\n`;
          
          // Compile phase status
          const compileStatus = phases.compileOnlySuccess ? '✅ PASS' : '❌ FAIL';
          testResults.innerHTML += `  Compile: ${compileStatus} (${times.compileOnly}ms)\n`;
          
          // Link phase status - distinguish between compilation success and execution viability
          let linkStatus;
          if (!phases.compileLinkSuccess) {
            linkStatus = '❌ FAIL (compilation)';
          } else if (phases.linkedExecutionSuccess) {
            linkStatus = '✅ PASS (executable)';
          } else {
            linkStatus = '✅ PASS (compiled) / ❌ FAIL (execution)';
          }
          testResults.innerHTML += `  Link: ${linkStatus} (${times.compileLink}ms)\n`;
          
          // Execution status with better context
          const objExecStatus = phases.objectExecutionSuccess ? '✅' : '❌';
          let linkedExecDisplay;
          
          if (!phases.compileLinkSuccess) {
            linkedExecDisplay = '❌(skipped - link failed)';
          } else if (phases.linkedExecutionSuccess) {
            linkedExecDisplay = `✅(${times.linkedExecution}ms)`;
          } else {
            linkedExecDisplay = `❌(${times.linkedExecution}ms)`;
          }
          
          testResults.innerHTML += `  Execute: obj:${objExecStatus}(${times.objectExecution}ms), linked:${linkedExecDisplay}, mode: ${phases.executionMode}\n\n`;
        }
        
        if (testResults) {
          testResults.scrollTop = testResults.scrollHeight;
        }
        
        // Small delay to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        categoryResults.summary.failed++;
        console.error(`❌ Performance measurement failed for ${testName}:`, error);
        
        if (testResults) {
          testResults.innerHTML += `❌ ERROR (${error.message})\n`;
          testResults.scrollTop = testResults.scrollHeight;
        }
      }
    }
    
    // Calculate category averages for independent phase data
    const allTests = categoryResults.tests;
    const validTests = allTests.filter(t => !t.error);
    
    if (validTests.length > 0) {
      categoryResults.summary.avgCompileOnlyTime = Math.round(
        validTests.reduce((sum, t) => sum + t.times.compileOnly, 0) / validTests.length * 100
      ) / 100;
      categoryResults.summary.avgCompileLinkTime = Math.round(
        validTests.reduce((sum, t) => sum + t.times.compileLink, 0) / validTests.length * 100
      ) / 100;
      categoryResults.summary.avgObjectExecutionTime = Math.round(
        validTests.reduce((sum, t) => sum + t.times.objectExecution, 0) / validTests.length * 100
      ) / 100;
      categoryResults.summary.avgLinkedExecutionTime = Math.round(
        validTests.reduce((sum, t) => sum + t.times.linkedExecution, 0) / validTests.length * 100
      ) / 100;
      
      // Calculate success rates by phase
      categoryResults.summary.compileSuccessRate = Math.round(
        (validTests.filter(t => t.phases.compileOnlySuccess).length / validTests.length) * 100
      );
      categoryResults.summary.linkSuccessRate = Math.round(
        (validTests.filter(t => t.phases.compileLinkSuccess).length / validTests.length) * 100
      );
      categoryResults.summary.objectExecutionSuccessRate = Math.round(
        (validTests.filter(t => t.phases.objectExecutionSuccess).length / validTests.length) * 100
      );
      categoryResults.summary.linkedExecutionSuccessRate = Math.round(
        (validTests.filter(t => t.phases.linkedExecutionSuccess).length / validTests.length) * 100
      );
    }
    
    window.performanceData.categories[categoryName] = categoryResults;
    
    if (testResults) {
      testResults.innerHTML += `📊 ${categoryName} Summary: ${categoryResults.summary.passed}/${categoryResults.summary.total} passed ` +
        `(${categoryResults.summary.avgCompileOnlyTime}ms compile, ${categoryResults.summary.avgCompileLinkTime}ms link, obj:${categoryResults.summary.avgObjectExecutionTime}ms, linked:${categoryResults.summary.avgLinkedExecutionTime}ms) ` +
        `[${categoryResults.summary.compileSuccessRate}% compile success, ${categoryResults.summary.linkSuccessRate}% link success]\n\n`;
      testResults.scrollTop = testResults.scrollHeight;
    }
  }
  
  // Generate final report
  generatePerformanceReport();
  
  // Disable performance mode to re-enable UI updates
  window.isPerformanceModeActive = false;
  console.log('📊 Performance mode deactivated - UI updates re-enabled');
  
  console.log('🏁 Performance measurement completed!');
  if (testResults) {
    testResults.innerHTML += '🏁 PERFORMANCE MEASUREMENT COMPLETED!\n' +
      'Check console for detailed report and use exportPerformanceData() to save results.\n';
  }
}

// Generate comprehensive performance report
function generatePerformanceReport() {
  const data = window.performanceData;
  const allTests = data.testResults;
  const successfulTests = allTests.filter(t => t.success);
  const failedTests = allTests.filter(t => !t.success);
  
  const report = {
    summary: {
      totalTests: allTests.length,
      passed: successfulTests.length,
      failed: failedTests.length,
      successRate: ((successfulTests.length / allTests.length) * 100).toFixed(1) + '%'
    },
    performance: {
      compileOnly: {
        min: data.compileOnlyTimes ? Math.min(...data.compileOnlyTimes).toFixed(2) : 'N/A',
        max: data.compileOnlyTimes ? Math.max(...data.compileOnlyTimes).toFixed(2) : 'N/A',
        avg: data.compileOnlyTimes ? (data.compileOnlyTimes.reduce((a, b) => a + b, 0) / data.compileOnlyTimes.length).toFixed(2) : 'N/A',
        median: data.compileOnlyTimes ? calculateMedian(data.compileOnlyTimes).toFixed(2) : 'N/A'
      },
      linkOnly: {
        min: data.linkOnlyTimes ? Math.min(...data.linkOnlyTimes.filter(t => t > 0)).toFixed(2) : 'N/A',
        max: data.linkOnlyTimes ? Math.max(...data.linkOnlyTimes.filter(t => t > 0)).toFixed(2) : 'N/A',
        avg: data.linkOnlyTimes ? (data.linkOnlyTimes.reduce((a, b) => a + b, 0) / data.linkOnlyTimes.filter(t => t > 0).length).toFixed(2) : 'N/A',
        median: data.linkOnlyTimes ? calculateMedian(data.linkOnlyTimes.filter(t => t > 0)).toFixed(2) : 'N/A'
      },
      compileLink: {
        min: data.compileLinkTimes ? Math.min(...data.compileLinkTimes).toFixed(2) : 'N/A',
        max: data.compileLinkTimes ? Math.max(...data.compileLinkTimes).toFixed(2) : 'N/A',
        avg: data.compileLinkTimes ? (data.compileLinkTimes.reduce((a, b) => a + b, 0) / data.compileLinkTimes.length).toFixed(2) : 'N/A',
        median: data.compileLinkTimes ? calculateMedian(data.compileLinkTimes).toFixed(2) : 'N/A'
      },
      execution: {
        min: Math.min(...data.executionTimes).toFixed(2),
        max: Math.max(...data.executionTimes).toFixed(2),
        avg: (data.executionTimes.reduce((a, b) => a + b, 0) / data.executionTimes.length).toFixed(2),
        median: calculateMedian(data.executionTimes).toFixed(2)
      }
    },
    categories: {}
  };
  
  // Add category-specific data for sequential compile→link testing
  for (const [categoryName, categoryData] of Object.entries(data.categories)) {
    report.categories[categoryName] = {
      total: categoryData.summary.total,
      passed: categoryData.summary.passed,
      failed: categoryData.summary.failed,
      successRate: ((categoryData.summary.passed / categoryData.summary.total) * 100).toFixed(1) + '%',
      compileSuccessRate: categoryData.summary.compileSuccessRate || 0,
      linkSuccessRate: categoryData.summary.linkSuccessRate || 0,
      avgCompileOnlyTime: categoryData.summary.avgCompileOnlyTime || 0,
      avgLinkOnlyTime: categoryData.summary.avgLinkOnlyTime || 0,
      avgExecutionTime: categoryData.summary.avgExecutionTime || 0
    };
  }
  
  console.log('📊 PERFORMANCE REPORT:');
  console.log('='.repeat(50));
  console.log(JSON.stringify(report, null, 2));
  console.log('='.repeat(50));
  
  // Store report in global data
  data.report = report;
  
  return report;
}

// Calculate median value
function calculateMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Export performance data to JSON
function exportPerformanceData() {
  const data = window.performanceData;
  const json = JSON.stringify(data, null, 2);
  
  // Create downloadable file
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📄 Performance data exported to JSON file');
  return json;
}

// Export performance report as CSV
function exportPerformanceCSV() {
  const data = window.performanceData;
  const tests = data.testResults;
  
  // CSV headers for sequential compile→link data
  const headers = [
    'Test Name', 'Category', 'Description', 'Expected', 'Actual', 'Success',
    'Compile Success', 'Link Success', 'Execution Success', 'Execution Mode',
    'Compile Only Time (ms)', 'Link Only Time (ms)', 'Total Pipeline Time (ms)', 
    'Execution Time (ms)', 'Total Time (ms)', 'Code Size (chars)', 'Memory Usage (MB)', 'Timestamp'
  ];
  
  // CSV rows with sequential compile→link timing data
  const rows = tests.map(test => [
    test.testName,
    test.category,
    test.description,
    test.expected,
    test.actual,
    test.success,
    test.phases ? test.phases.compileSuccess : 'N/A',
    test.phases ? test.phases.linkSuccess : 'N/A', 
    test.phases ? test.phases.executionSuccess : 'N/A',
    test.phases ? test.phases.executionMode : 'N/A',
    test.times.compileOnly || test.times.compilation || 0,
    test.times.linkOnly || 0,
    test.times.compileLink || 0,
    test.times.execution,
    test.times.total,
    test.codeSize,
    test.memory.end ? test.memory.end.used : 'N/A',
    test.timestamp
  ]);
  
  // Create CSV content
  const csvContent = [headers, ...rows].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-results-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📊 Test results exported to CSV file');
  return csvContent;
}

// Get performance summary for thesis
function getThesisSummary() {
  const data = window.performanceData;
  if (!data.report) {
    console.warn('No performance data available. Run tests first.');
    return null;
  }
  
  const summary = {
    testExecution: {
      totalTests: data.report.summary.totalTests,
      passedTests: data.report.summary.passed,
      failedTests: data.report.summary.failed,
      successRate: data.report.summary.successRate
    },
    performance: {
      compileOnlyTime: {
        average: data.report.performance.compileOnly.avg + 'ms',
        median: data.report.performance.compileOnly.median + 'ms',
        range: `${data.report.performance.compileOnly.min}-${data.report.performance.compileOnly.max}ms`
      },
      linkOnlyTime: {
        average: data.report.performance.linkOnly.avg + 'ms',
        median: data.report.performance.linkOnly.median + 'ms',
        range: `${data.report.performance.linkOnly.min}-${data.report.performance.linkOnly.max}ms`
      },
      compileLinkTime: {
        average: data.report.performance.compileLink.avg + 'ms',
        median: data.report.performance.compileLink.median + 'ms',
        range: `${data.report.performance.compileLink.min}-${data.report.performance.compileLink.max}ms`
      },
      executionTime: {
        average: data.report.performance.execution.avg + 'ms',
        median: data.report.performance.execution.median + 'ms',
        range: `${data.report.performance.execution.min}-${data.report.performance.execution.max}ms`
      }
    },
    webAssemblyModules: data.moduleLoadingTimes,
    categorySummary: data.report.categories,
    systemInfo: data.systemInfo,
    timestamp: data.startTime
  };
  
  console.log('📋 THESIS SUMMARY:');
  console.log(JSON.stringify(summary, null, 2));
  
  return summary;
}

// Save performance stats to file for manual table creation
function savePerformanceStatsToFile() {
  const data = window.performanceData;
  
  if (!data.report) {
    console.warn('No performance data available. Run tests first with runAllTestsWithPerformanceMeasurement()');
    return null;
  }
  
  let statsOutput = 'PERFORMANCE STATISTICS FOR THESIS\n';
  statsOutput += '=====================================\n\n';
  
  // Overall Summary
  statsOutput += 'OVERALL SUMMARY:\n';
  statsOutput += `Total Tests: ${data.report.summary.totalTests}\n`;
  statsOutput += `Passed: ${data.report.summary.passed}\n`;
  statsOutput += `Failed: ${data.report.summary.failed}\n`;
  statsOutput += `Success Rate: ${data.report.summary.successRate}\n\n`;
  
  // WebAssembly Module Loading Times
  if (data.moduleLoadingTimes.total) {
    statsOutput += 'WEBASSEMBLY MODULE LOADING TIMES:\n';
    const modules = data.moduleLoadingTimes;
    statsOutput += `TinyCC: ${modules.tinycc.loadTime}ms (Memory: ${modules.tinycc.memory || 'N/A'}MB)\n`;
    statsOutput += `Unicorn: ${modules.unicorn.loadTime}ms (Memory: ${modules.unicorn.memory || 'N/A'}MB)\n`;
    statsOutput += `Capstone: ${modules.capstone.loadTime}ms (Memory: ${modules.capstone.memory || 'N/A'}MB)\n`;
    statsOutput += `Total: ${modules.total.loadTime}ms (Memory: ${modules.total.totalMemoryUsed || 'N/A'}MB)\n\n`;
  }
  
  // Compilation Performance
  statsOutput += 'COMPILATION PERFORMANCE:\n';
  const perf = data.report.performance;
  statsOutput += `Compile Only - Min: ${perf.compileOnly.min}ms, Avg: ${perf.compileOnly.avg}ms, Max: ${perf.compileOnly.max}ms, Median: ${perf.compileOnly.median}ms\n`;
  statsOutput += `Compile+Link - Min: ${perf.compileLink.min}ms, Avg: ${perf.compileLink.avg}ms, Max: ${perf.compileLink.max}ms, Median: ${perf.compileLink.median}ms\n`;
  statsOutput += `Execution - Min: ${perf.execution.min}ms, Avg: ${perf.execution.avg}ms, Max: ${perf.execution.max}ms, Median: ${perf.execution.median}ms\n\n`;
  
  // Category Results
  statsOutput += 'CATEGORY RESULTS:\n';
  for (const [categoryName, categoryData] of Object.entries(data.report.categories)) {
    statsOutput += `${categoryName}: ${categoryData.passed}/${categoryData.total} (${categoryData.successRate})\n`;
  }
  statsOutput += '\n';
  
  // System Info
  if (data.systemInfo) {
    statsOutput += 'SYSTEM INFORMATION:\n';
    const sys = data.systemInfo;
    statsOutput += `Browser: ${sys.browser}\n`;
    statsOutput += `Platform: ${sys.platform}\n`;
    statsOutput += `CPU Cores: ${sys.hardwareConcurrency}\n`;
    statsOutput += `Memory: ${sys.memory}\n`;
    statsOutput += `Resolution: ${sys.screen.width}x${sys.screen.height}\n`;
    statsOutput += `Test Date: ${new Date(sys.timestamp).toLocaleDateString('de-DE')}\n\n`;
  }
  
  // Save to file
  const blob = new Blob([statsOutput], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-stats-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📄 Performance stats saved to file');
  console.log(statsOutput);
  
  return statsOutput;
}

// Initialize performance measurement on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 Performance measurement system initialized');
  collectSystemInfo();
});