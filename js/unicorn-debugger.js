
    // Wait for Unicorn module to load
    var UnicornModule = uc;
    
    /**
     * Advanced WebAssembly-based CPU emulator and debugger for compiled C programs.
     * Integrates Unicorn Engine emulation with Capstone disassembly for comprehensive
     * step-by-step debugging with register/stack visualization and C function mapping.
     * 
     * @class UnicornDebugger
     * @description
     * **Core Capabilities:**
     * - Single-step instruction execution with register/stack state tracking
     * - Real-time disassembly highlighting synchronized with execution
     * - C function-level source code correlation and highlighting
     * - Breakpoint management with automatic program termination detection
     * - Comprehensive execution tracing with performance analytics
     * - Dynamic memory analysis and bounds checking
     * 
     * **Architecture Support:**
     * - x86 (32-bit) and x86_64 (64-bit) instruction sets
     * - ELF object files (.o) and linked executables
     * - WebAssembly memory isolation with proper cleanup
     * 
     * **Integration Points:**
     * - TinyCC WebAssembly compiler output processing
     * - CodeMirror source editor for function highlighting
     * - DOM elements for register/stack/trace visualization
     * - Performance measurement system for educational analytics
     */
    class UnicornDebugger {
      /**
       * Initializes the WebAssembly-based CPU debugger with Unicorn Engine integration.
       * 
       * @param {Object} engine - Unicorn Engine WebAssembly instance for CPU emulation
       * @param {boolean} is64bit - Architecture flag: true for x86_64, false for x86
       * @param {number} entryPoint - Memory address to begin program execution (e.g., 0x10000000)
       * 
       * @description
       * **Initialization Process:**
       * 1. Configure CPU emulation engine with architecture-specific settings
       * 2. Initialize Capstone disassembler for real-time instruction analysis
       * 3. Setup execution tracing and breakpoint management systems
       * 4. Create C function mapping infrastructure for source correlation
       * 5. Register Unicorn Engine hooks for instruction and memory monitoring
       * 6. Initialize register state (RIP/EIP) to specified entry point
       * 
       * **State Management:**
       * - Tracks current execution address and instruction history
       * - Maintains breakpoint set with automatic detection logic
       * - Manages execution flow (running/paused/stopped states)
       * - Stores C function boundaries for source code highlighting
       * 
       * @throws {Error} If Unicorn Engine module is not properly loaded
       * @throws {Error} If Capstone disassembler initialization fails
       * 
       * @example
       * const debugger = new UnicornDebugger(unicornEngine, true, 0x10000000);
       * debugger.stepInstruction(); // Execute one instruction
       * debugger.runUntilHalt();    // Run until program completion
       * 
       * @since Version 1.0 - Initial WebAssembly debugging implementation
       */
      constructor(engine, is64bit, entryPoint) {
        this.engine = engine;
        this.is64bit = is64bit;
        this.entryPoint = entryPoint;
        this.currentAddress = entryPoint;
        this.breakpoints = new Set();
        this.isRunning = false;
        this.isPaused = false;
        this.disasm = new cs.Capstone(cs.ARCH_X86, is64bit ? cs.MODE_64 : cs.MODE_32);
        this.executionTrace = [];
        this.lastLoggedAddress = null;
        
        // C function-level highlighting system
        this.lineMapping = new Map();
        this.currentHighlightedFunction = null;
        
        // Set initial RIP/EIP
        if (is64bit) {
          this.engine.reg_write_i64(UnicornModule.X86_REG_RIP, entryPoint);
        } else {
          this.engine.reg_write_i32(UnicornModule.X86_REG_EIP, entryPoint);
        }
        
        this.setupHooks();
      }
      
      setupHooks() {
        // Hook for tracking execution
        this.engine.hook_add(UnicornModule.HOOK_CODE, (engine, address) => {
          this.currentAddress = address;
          
          // Log to execution trace - only if not already logged
          if (!this.lastLoggedAddress || this.lastLoggedAddress !== address) {
            this.logToExecutionTrace(address);
            this.lastLoggedAddress = address;
          }
          
          if (this.breakpoints.has(address)) {
            this.isPaused = true;
            this.isRunning = false;
            console.log(`Breakpoint hit at 0x${address.toString(16)} - Program terminated`);
            this.updateUI();
            // Check if this is an exit breakpoint by checking if it contains HLT instruction
            try {
              const instrBytes = this.engine.mem_read(address, 1);
              if (instrBytes[0] === 0xF4) { // HLT instruction
                console.log('Program completed successfully (exit breakpoint hit)');
                if (!window.isPerformanceModeActive) {
                  document.getElementById('emuOutput').textContent += '\nProgram completed successfully.\n';
                }
              }
            } catch(e) {
              // If we can't read the instruction, assume it's a normal breakpoint
            }
            return false; // Stop execution
          }
        });
        
        // Hook for halt instruction - use the breakpoint instead since HOOK_INSN may not be available
        // Dynamic exit breakpoints will handle program termination
        
        
      }
      
      stepInstruction() {
        try {
          this.isPaused = false;
          const startAddr = this.getCurrentPC();
          
          // Capture pre-execution state for step analysis
          const preState = this.captureStepState();
          
          // Get instruction length and disassembly
          const instrBytes = this.engine.mem_read(startAddr, 16);
          const instructions = this.disasm.disasm(instrBytes, startAddr, 1);
          const instrLength = instructions[0].size;
          const instructionText = `${instructions[0].mnemonic} ${instructions[0].op_str}`;
          console.log(`Executing: ${instructionText} at 0x${startAddr.toString(16)}`);
          
          // Execute exactly one instruction with proper end address
          this.engine.emu_start(startAddr, startAddr + instrLength, 0, 1);
          this.currentAddress = this.getCurrentPC();
          
          // Capture post-execution state and log step analysis
          const postState = this.captureStepState();
          this.logStepAnalysis(startAddr, instructionText, preState, postState);
          
          // Log execution trace AFTER instruction executes
          this.logExecutedInstruction();
          
          // Clear last logged address for next instruction
          this.lastLoggedAddress = null;
          
          // Log detailed debug info to console
          this.logDebugState(startAddr, instructionText);
          
          this.updateUI();
          if (!window.isPerformanceModeActive) {
            this.highlightCurrentLine();
          }
          if (!window.isPerformanceModeActive) {
            this.highlightCFunction(this.currentAddress);
          }
        } catch(e) {
          console.error('Step error:', e);
          const errorMsg = e.message || e.toString();
          
          // Check for specific error types
          if (errorMsg.includes('UC_ERR_INSN_INVALID')) {
            const pc = this.getCurrentPC();
            if (!window.isPerformanceModeActive) {
              document.getElementById('emuOutput').textContent += `Invalid instruction at 0x${pc.toString(16)}\n`;
            }
          } else if (errorMsg.includes('UC_ERR_FETCH_UNMAPPED')) {
            const pc = this.getCurrentPC();
            if (!window.isPerformanceModeActive) {
              document.getElementById('emuOutput').textContent += `Unmapped instruction fetch at 0x${pc.toString(16)}\n`;
            }
          } else {
            if (!window.isPerformanceModeActive) {
              document.getElementById('emuOutput').textContent += `Step error: ${errorMsg}\n`;
            }
          }
          
          // Show final return value when execution stops
          try {
            const returnValue = this.is64bit ? 
              this.engine.reg_read_i64(UnicornModule.X86_REG_RAX) :
              this.engine.reg_read_i32(UnicornModule.X86_REG_EAX);
            if (!window.isPerformanceModeActive) {
              document.getElementById('emuOutput').textContent += `\nProgram finished. Return value: ${returnValue} (0x${returnValue.toString(16)})\n`;
            }
          } catch(e) {
            // Ignore if we can't read registers
          }
          
          this.isPaused = true;
          this.isRunning = false;
          this.updateUI();
        }
      }
      
      runUntilHalt() {
        if (this.isRunning) {
          console.log('Already running');
          return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.executionCount = 0;
        this.maxInstructions = 10000; // Safety limit
        
        console.log('Starting continuous execution until HLT...');
        if (!window.isPerformanceModeActive) {
          document.getElementById('emuOutput').textContent += 'Running until halt...\n';
        }
        
        this.updateButtonStates();
        this.continueExecution();
      }
      
      continueExecution() {
        if (!this.isRunning || this.isPaused) {
          return;
        }
        
        // Safety check
        if (this.executionCount >= this.maxInstructions) {
          console.log('Maximum instruction limit reached - stopping execution');
          if (!window.isPerformanceModeActive) {
            document.getElementById('emuOutput').textContent += `\nExecution stopped: ${this.maxInstructions} instruction limit reached\n`;
          }
          this.stopExecution();
          return;
        }
        
        try {
          const startAddr = this.getCurrentPC();
          
          // Check for halt instruction before execution
          if (this.isHaltInstruction(startAddr)) {
            console.log('HLT instruction encountered - stopping execution');
            if (!window.isPerformanceModeActive) {
              document.getElementById('emuOutput').textContent += '\nHLT instruction reached - program terminated\n';
            }
            this.stopExecution();
            return;
          }
          
          // Execute one step
          this.stepInstruction();
          this.executionCount++;
          
          // Continue execution after small delay for UI responsiveness
          setTimeout(() => this.continueExecution(), 5);
          
        } catch(e) {
          console.error('Execution error:', e);
          if (!window.isPerformanceModeActive) {
            document.getElementById('emuOutput').textContent += `\nExecution stopped due to error: ${e.message}\n`;
          }
          this.stopExecution();
        }
      }
      
      stopExecution() {
        this.isRunning = false;
        this.isPaused = true;
        console.log(`Execution stopped after ${this.executionCount} instructions`);
        if (!window.isPerformanceModeActive) {
          document.getElementById('emuOutput').textContent += `\nExecution stopped. Instructions executed: ${this.executionCount}\n`;
        }
        this.updateButtonStates();
        this.updateUI();
      }
      
      isHaltInstruction(address) {
        try {
          const instrBytes = this.engine.mem_read(address, 16);
          const instructions = this.disasm.disasm(instrBytes, address, 1);
          if (instructions.length > 0) {
            const mnemonic = instructions[0].mnemonic.toLowerCase();
            return mnemonic === 'hlt';
          }
        } catch(e) {
          // If we can't read the instruction, assume it's not halt
          return false;
        }
        return false;
      }
      
      updateButtonStates() {
        const runBtn = document.getElementById('runBtn');
        const stopBtn = document.getElementById('stopBtn');
        const stepBtn = document.getElementById('stepBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        const fabRun = document.querySelector('.fab-run');
        const fabStop = document.querySelector('.fab-stop');
        const fabStep = document.querySelector('.fab-step');
        
        if (!window.isPerformanceModeActive) {
          if (this.isRunning) {
            // During execution: hide run, show stop, disable step/reset
            if (runBtn) { runBtn.style.display = 'none'; }
            if (stopBtn) { stopBtn.style.display = 'inline-block'; stopBtn.disabled = false; }
            if (stepBtn) { stepBtn.disabled = true; }
            if (resetBtn) { resetBtn.disabled = true; }
            
            if (fabRun) { fabRun.style.display = 'none'; }
            if (fabStop) { fabStop.style.display = 'block'; fabStop.disabled = false; }
            if (fabStep) { fabStep.disabled = true; fabStep.style.opacity = '0.5'; }
          } else {
            // When stopped: show run, hide stop, enable step/reset
            if (runBtn) { runBtn.style.display = 'inline-block'; runBtn.disabled = false; }
            if (stopBtn) { stopBtn.style.display = 'none'; }
            if (stepBtn) { stepBtn.disabled = false; }
            if (resetBtn) { resetBtn.disabled = false; }
            
            if (fabRun) { fabRun.style.display = 'block'; fabRun.disabled = false; }
            if (fabStop) { fabStop.style.display = 'none'; }
            if (fabStep) { fabStep.disabled = false; fabStep.style.opacity = '1'; }
          }
        }
      }
      
      reset() {
        this.currentAddress = this.entryPoint;
        this.executionTrace = [];
        this.lastLoggedAddress = null;
        this.isRunning = false;
        this.isPaused = false;
        this.executionCount = 0;
        
        if (this.is64bit) {
          this.engine.reg_write_i64(UnicornModule.X86_REG_RIP, this.entryPoint);
        } else {
          this.engine.reg_write_i32(UnicornModule.X86_REG_EIP, this.entryPoint);
        }
        
        this.updateButtonStates();
        this.updateUI();
        if (!window.isPerformanceModeActive) {
          document.getElementById('emuOutput').textContent = 'Debugger reset.\n';
          document.getElementById('stepAnalysisOutput').textContent = '';
        }
      }
      
      captureStepState() {
        // Capture registers and stack state for step analysis
        const registers = this.getAllRegisters();
        const stack = this.getStackContents(8);
        return { registers, stack };
      }
      
      logStepAnalysis(address, instruction, preState, postState) {
        const stepOutput = document.getElementById('stepAnalysisOutput');
        if (!stepOutput) return;
        
        // Format step entry with just address and instruction
        let output = `0x${address.toString(16).padStart(8, '0')}: ${instruction}\n`;
        
        // Show register changes
        const preRegs = preState.registers;
        const postRegs = postState.registers;
        const changedRegs = [];
        
        for (const reg in postRegs) {
          if (preRegs[reg] !== postRegs[reg]) {
            changedRegs.push(`${reg}: 0x${preRegs[reg].toString(16)} → 0x${postRegs[reg].toString(16)}`);
          }
        }
        
        if (changedRegs.length > 0) {
          output += `  REG: ${changedRegs.join(', ')}\n`;
        }
        
        // Show stack changes (simplified - just show top few entries)
        const preStack = preState.stack;
        const postStack = postState.stack;
        const stackChanges = [];
        
        for (let i = 0; i < Math.min(preStack.length, postStack.length, 3); i++) {
          if (preStack[i] && postStack[i] && preStack[i].value !== postStack[i].value) {
            stackChanges.push(`[${postStack[i].address}]: 0x${preStack[i].value.toString(16)} → 0x${postStack[i].value.toString(16)}`);
          }
        }
        
        if (stackChanges.length > 0) {
          output += `  STACK: ${stackChanges.join(', ')}\n`;
        }
        
        output += '\n';
        stepOutput.textContent += output;
        stepOutput.scrollTop = stepOutput.scrollHeight;
      }
      
      getCurrentPC() {
        return this.is64bit ? 
          this.engine.reg_read_i64(UnicornModule.X86_REG_RIP) :
          this.engine.reg_read_i32(UnicornModule.X86_REG_EIP);
      }
      
      getAllRegisters() {
        if (this.is64bit) {
          return {
            RAX: this.engine.reg_read_i64(UnicornModule.X86_REG_RAX),
            RBX: this.engine.reg_read_i64(UnicornModule.X86_REG_RBX),
            RCX: this.engine.reg_read_i64(UnicornModule.X86_REG_RCX),
            RDX: this.engine.reg_read_i64(UnicornModule.X86_REG_RDX),
            RSI: this.engine.reg_read_i64(UnicornModule.X86_REG_RSI),
            RDI: this.engine.reg_read_i64(UnicornModule.X86_REG_RDI),
            RBP: this.engine.reg_read_i64(UnicornModule.X86_REG_RBP),
            RSP: this.engine.reg_read_i64(UnicornModule.X86_REG_RSP),
            RIP: this.engine.reg_read_i64(UnicornModule.X86_REG_RIP),
            RFLAGS: this.engine.reg_read_i64(UnicornModule.X86_REG_EFLAGS)
          };
        } else {
          return {
            EAX: this.engine.reg_read_i32(UnicornModule.X86_REG_EAX),
            EBX: this.engine.reg_read_i32(UnicornModule.X86_REG_EBX),
            ECX: this.engine.reg_read_i32(UnicornModule.X86_REG_ECX),
            EDX: this.engine.reg_read_i32(UnicornModule.X86_REG_EDX),
            ESI: this.engine.reg_read_i32(UnicornModule.X86_REG_ESI),
            EDI: this.engine.reg_read_i32(UnicornModule.X86_REG_EDI),
            EBP: this.engine.reg_read_i32(UnicornModule.X86_REG_EBP),
            ESP: this.engine.reg_read_i32(UnicornModule.X86_REG_ESP),
            EIP: this.engine.reg_read_i32(UnicornModule.X86_REG_EIP),
            EFLAGS: this.engine.reg_read_i32(UnicornModule.X86_REG_EFLAGS)
          };
        }
      }
      
      getStackContents(count = 16) {
        const sp = this.is64bit ? 
          this.engine.reg_read_i64(UnicornModule.X86_REG_RSP) :
          this.engine.reg_read_i32(UnicornModule.X86_REG_ESP);
        
        const stackData = [];
        const wordSize = this.is64bit ? 8 : 4;
        
        for (let i = 0; i < count; i++) {
          try {
            const addr = sp + (i * wordSize);
            const bytes = this.engine.mem_read(addr, wordSize);
            let value = 0;
            for (let j = 0; j < wordSize; j++) {
              value |= bytes[j] << (j * 8);
            }
            stackData.push({ address: addr, value: value });
          } catch (e) {
            break;
          }
        }
        return stackData;
      }
      
      
      logToExecutionTrace(address) {
        try {
          const instrBytes = this.engine.mem_read(address, 16);
          const instructions = this.disasm.disasm(instrBytes, address, 1);
          if (instructions.length > 0) {
            const insn = instructions[0];
            
            // Store instruction info to log AFTER execution
            this.pendingTrace = {
              address: address,
              mnemonic: insn.mnemonic,
              operands: insn.op_str
            };
          }
        } catch(e) {
          // Silently fail to avoid flooding console during execution
        }
      }
      
      logExecutedInstruction() {
        if (this.pendingTrace) {
          try {
            // Get RAX value AFTER instruction execution
            const rax = this.is64bit ? 
              this.engine.reg_read_i64(UnicornModule.X86_REG_RAX) :
              this.engine.reg_read_i32(UnicornModule.X86_REG_EAX);
            
            const trace = `0x${this.pendingTrace.address.toString(16).padStart(8, '0')}: ${this.pendingTrace.mnemonic.padEnd(8)} ${this.pendingTrace.operands.padEnd(20)} [RAX=0x${rax.toString(16)}]`;
            
            // Add to execution trace array
            if (!this.executionTrace) this.executionTrace = [];
            this.executionTrace.push(trace);
            
            // Update UI
            this.updateExecutionTrace();
            this.pendingTrace = null;
          } catch(e) {
            // Silently fail to avoid flooding console during execution
          }
        }
      }
      
      logDebugState(address, instruction) {
        try {
          const registers = this.getAllRegisters();
          const stack = this.getStackContents(8); // Get top 8 stack items
          
          console.group(`🔍 DEBUG STATE - After executing: ${instruction} at 0x${address.toString(16)}`);
          
          // Log registers
          console.log('📊 REGISTERS:');
          Object.entries(registers).forEach(([name, value]) => {
            const hexValue = value.toString(16).padStart(this.is64bit ? 16 : 8, '0');
            const decValue = value;
            console.log(`  ${name}: 0x${hexValue} (${decValue})`);
          });
          
          // Log stack
          console.log('📚 STACK (top 8 items):');
          if (stack.length > 0) {
            stack.forEach((item, index) => {
              const hexAddr = item.address.toString(16).padStart(this.is64bit ? 16 : 8, '0');
              const hexValue = item.value.toString(16).padStart(this.is64bit ? 16 : 8, '0');
              const decValue = item.value;
              console.log(`  [${index}] 0x${hexAddr}: 0x${hexValue} (${decValue})`);
            });
          } else {
            console.log('  (Stack appears empty or unreadable)');
          }
          
          console.groupEnd();
        } catch(e) {
          console.log('Failed to log debug state:', e.message);
        }
      }
      
      addBreakpoint(address) {
        this.breakpoints.add(address);
        console.log(`Breakpoint added at 0x${address.toString(16)}`);
      }
           
      updateUI() {
        this.updateRegisters();
        this.updateStack();
      }
      
      updateRegisters() {
        const registers = this.getAllRegisters();
        const regHTML = Object.entries(registers)
          .map(([name, value]) => 
            `<div class="register">
              <span class="reg-name">${name}:</span>
              <span class="reg-value">0x${value.toString(16).padStart(this.is64bit ? 16 : 8, '0')}</span>
            </div>`
          ).join('');
        if (!window.isPerformanceModeActive) {
          document.getElementById('registerGrid').innerHTML = regHTML;
        }
      }
      
      updateStack() {
        const stack = this.getStackContents();
        const stackHTML = stack.map(item => 
          `<div class="stack-item">
            <span class="stack-addr">0x${item.address.toString(16).padStart(this.is64bit ? 16 : 8, '0')}:</span>
            <span class="stack-value">0x${item.value.toString(16).padStart(this.is64bit ? 16 : 8, '0')}</span>
          </div>`
        ).join('');
        if (!window.isPerformanceModeActive) {
          document.getElementById('stackView').innerHTML = stackHTML;
        }
      }
      
      
      updateExecutionTrace() {
        if (this.executionTrace && this.executionTrace.length > 0) {
          const traceText = this.executionTrace.join('\n');
          
          // Update execution log with enhanced trace data
          const emuOutputDiv = document.getElementById('emuOutput');
          emuOutputDiv.textContent = traceText;
          
          // Auto-scroll to bottom
          emuOutputDiv.scrollTop = emuOutputDiv.scrollHeight;
        }
      }
      
      highlightCurrentLine() {
        const pc = this.getCurrentPC();
        const disasmDiv = document.getElementById('disassembly');
        
        // Get original disassembly text if it's still plain text
        let originalText = disasmDiv.getAttribute('data-original-text');
        if (!originalText) {
          originalText = disasmDiv.textContent;
          disasmDiv.setAttribute('data-original-text', originalText);
        }
        
        const lines = originalText.split('\n');
        const pcHex = pc.toString(16).padStart(8, '0');
        
        // Convert to HTML with proper highlighting
        const htmlLines = lines.map(line => {
          if (line.includes(`0x${pcHex}:`)) {
            return `<div class="highlighted-line">${this.escapeHtml(line)}</div>`;
          }
          return `<div>${this.escapeHtml(line)}</div>`;
        });
        
        disasmDiv.innerHTML = htmlLines.join('');
        
       
      }
      
      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      
      // Simple, reliable function-level mapping for C code highlighting  
      mapAssemblyToC(cCodeContent, assemblyInstructions) {
        if (!cCodeContent) {
          console.log('No C code content available for mapping');
          return;
        }
        
        console.log('Creating function-level C-to-assembly mapping...');
        
        const lines = cCodeContent.split('\n');
        const cFunctions = this.extractCFunctions(lines);
        const asmFunctions = this.detectAssemblyFunctionBoundaries(assemblyInstructions);
        
        console.log(`Found ${cFunctions.length} C functions and ${asmFunctions.length} assembly functions`);
        
        if (asmFunctions.length === cFunctions.length) {
          this.createSimpleFunctionMapping(cFunctions, asmFunctions, assemblyInstructions);
        } else {
          console.log('Function count mismatch - attempting best-effort mapping');
          if (cFunctions.length > 0 && asmFunctions.length > 0) {
            this.createSimpleFunctionMapping(cFunctions, asmFunctions, assemblyInstructions);
          }
        }
      }
      
      extractCFunctions(lines) {
        const functions = [];
        let braceDepth = 0;
        let currentFunction = null;
        
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          const trimmed = line.trim();
          
          // Detect function starts
          if (trimmed.includes('(') && trimmed.includes('{') && 
              !trimmed.includes('if') && !trimmed.includes('while') && 
              !trimmed.includes('for') && !trimmed.includes('switch')) {
            currentFunction = {
              name: this.extractFunctionName(trimmed),
              startLine: lineNum,
              endLine: lineNum
            };
            functions.push(currentFunction);
            braceDepth = 1; // Start counting from the opening brace
          } else if (currentFunction) {
            // Track brace depth
            braceDepth += (line.match(/\{/g) || []).length;
            braceDepth -= (line.match(/\}/g) || []).length;
            
            // Function ends when braces balance
            if (braceDepth === 0) {
              currentFunction.endLine = lineNum;
              currentFunction = null;
            }
          }
        });
        
        return functions;
      }
      
      createSimpleFunctionMapping(cFunctions, asmFunctions, assemblyInstructions) {
        console.log('Creating simple function-level mapping...');
        
        for (let i = 0; i < Math.min(cFunctions.length, asmFunctions.length); i++) {
          const cFunc = cFunctions[i];
          const asmFunc = asmFunctions[i];
          
          console.log(`Mapping C function ${cFunc.name} (lines ${cFunc.startLine}-${cFunc.endLine}) to assembly 0x${asmFunc.startAddr.toString(16)}-0x${asmFunc.endAddr.toString(16)}`);
          
          let mappedCount = 0;
          // Map ALL instructions in this assembly function to the C function range
          assemblyInstructions.forEach(instruction => {
            const address = this.getInstructionAddress(instruction);
            if (address >= asmFunc.startAddr && address <= asmFunc.endAddr) {
              this.lineMapping.set(address, {
                functionName: cFunc.name,
                functionStart: cFunc.startLine,
                functionEnd: cFunc.endLine,
                type: 'function'
              });
              mappedCount++;
            }
          });
          console.log(`  Mapped ${mappedCount} instructions to ${cFunc.name}`);
        }
        
        console.log(`✓ Function mapping complete: ${this.lineMapping.size} instructions mapped`);
      }
      
      
      
      
      
      
      
      
      detectAssemblyFunctionBoundaries(assemblyInstructions) {
        const boundaries = [];
        let currentFunctionStart = null;
        
        for (let i = 0; i < assemblyInstructions.length; i++) {
          const instruction = assemblyInstructions[i];
          const asmText = instruction.assembly || instruction.instruction || 'unknown';
          const address = this.getInstructionAddress(instruction);
          
          if (asmText.includes('push rbp') || asmText.includes('push ebp')) {
            if (currentFunctionStart !== null && i > 0) {
              const prevInstruction = assemblyInstructions[i - 1];
              const prevAddress = this.getInstructionAddress(prevInstruction);
              if (prevAddress !== null) {
                boundaries.push({
                  startAddr: currentFunctionStart,
                  endAddr: prevAddress
                });
              }
            }
            currentFunctionStart = address;
          }
        }
        
        if (currentFunctionStart !== null && assemblyInstructions.length > 0) {
          const lastInstruction = assemblyInstructions[assemblyInstructions.length - 1];
          const lastAddress = this.getInstructionAddress(lastInstruction);
          if (lastAddress !== null) {
            boundaries.push({
              startAddr: currentFunctionStart,
              endAddr: lastAddress
            });
          }
        }
        
        return boundaries;
      }
      
      getInstructionAddress(instruction) {
        if (instruction.getAddress) return instruction.getAddress();
        if (instruction.nodeAddr) return parseInt(instruction.nodeAddr.innerHTML, 16);
        if (instruction.address) return instruction.address;
        return null;
      }
      
      
      extractFunctionName(functionLine) {
        const match = functionLine.match(/(\w+)\s*\(/);
        return match ? match[1] : 'unknown';
      }
      
      
      highlightCFunction(assemblyAddress) {
        const functionInfo = this.lineMapping.get(assemblyAddress);
        
        if (!functionInfo || !sourceCodeEditor) {
            return;
        }

        const currentFunctionName = functionInfo.functionName;

        // Only update highlighting if we've switched functions and not in performance mode
        if (!window.isPerformanceModeActive && this.currentHighlightedFunction !== currentFunctionName) {
            this.clearCHighlight();

            // Highlight the entire function using CodeMirror's addLineClass
            for (let lineNum = functionInfo.functionStart; lineNum <= functionInfo.functionEnd; lineNum++) {
                const lineIndex = lineNum - 1; // CodeMirror uses 0-based indexing
                sourceCodeEditor.addLineClass(lineIndex, 'background', 'highlight-line');
            }

            this.currentHighlightedFunction = currentFunctionName;
            console.log(`✓ Highlighting C function ${currentFunctionName} (lines ${functionInfo.functionStart}-${functionInfo.functionEnd})`);
        }
      }
      
      clearCHighlight() {
        if (!window.isPerformanceModeActive && sourceCodeEditor) {
          // Clear all lines since we're doing function-level highlighting
          const lineCount = sourceCodeEditor.lineCount();
          for (let i = 0; i < lineCount; i++) {
            sourceCodeEditor.removeLineClass(i, 'background', 'highlight-line');
          }
        }
        if (!window.isPerformanceModeActive) {
          this.currentHighlightedFunction = null;
        }
      }
    }
    
    /**
     * Advanced ELF section disassembler with function symbol resolution and call tracing.
     * Processes compiled machine code bytes into human-readable assembly with enhanced
     * function boundary detection, call target resolution, and educational annotations.
     * 
     * @param {Uint8Array} bytes - Raw machine code bytes from ELF section (e.g., .text section)
     * @param {number} arch - Capstone architecture constant (cs.ARCH_X86)
     * @param {number} mode - Capstone mode constant (cs.MODE_32 or cs.MODE_64)
     * @param {number} baseAddr - Virtual base address for instruction addressing (e.g., 0x10000000)
     * @param {string} sectionName - ELF section name for output formatting (e.g., ".text")
     * @param {Array<Object>} [functionSymbols=null] - Optional function symbol table for enhanced output
     * @param {string} functionSymbols[].name - Function name (e.g., "main", "factorial")
     * @param {number} functionSymbols[].address - Function start address
     * @param {number} functionSymbols[].offset - Function offset within section
     * 
     * @returns {string} Formatted assembly disassembly with function labels and call annotations
     * 
     * @description
     * **Disassembly Pipeline:**
     * 1. Initialize Capstone disassembler with specified architecture and mode
     * 2. Create function address mapping for symbol resolution
     * 3. Process each instruction with address calculation and byte formatting
     * 4. Insert function labels at appropriate addresses (<functionName>:)
     * 5. Annotate call instructions with target function names
     * 6. Mark return instructions with exit annotations
     * 7. Generate educational assembly output with proper formatting
     * 
     * **Function Symbol Integration:**
     * - Maps function names to memory addresses for label insertion
     * - Resolves call targets to display "call 0x1000 ; → factorial()"
     * - Identifies function boundaries for enhanced readability
     * - Handles both symbol table data and pattern-based detection
     * 
     * **Educational Enhancements:**
     * - Hex address display with consistent padding (0x10000000:)
     * - Raw byte sequences for instruction analysis (48 89 e5)
     * - Mnemonic and operand separation for clarity
     * - Call target resolution with → arrow annotations
     * - Function boundary markers with <> brackets
     * 
     * @throws {Error} If Capstone disassembler initialization fails
     * @throws {Error} If byte array is invalid or corrupted
     * 
     * @example
     * const symbols = [{name: "main", address: 0x10000000}, {name: "add", address: 0x10000020}];
     * const assembly = disassembleSection(machineCode, cs.ARCH_X86, cs.MODE_64, 
     *                                   0x10000000, ".text", symbols);
     * console.log(assembly);
     * // Output:
     * // === .text Section Disassembly ===
     * // 
     * // <main>:
     * // 0x10000000: 48 89 e5             mov rbp, rsp
     * // 0x10000003: e8 18 00 00 00       call 0x10000020 ; → add()
     * 
     * @see extractFunctionSymbols() For generating function symbol tables
     * @see parseELF() For ELF file processing and section extraction
     * @since Version 1.0 - Enhanced disassembly with function correlation
     */
    function disassembleSection(bytes, arch, mode, baseAddr, sectionName, functionSymbols = null) {
      try {
        const disasm = new cs.Capstone(arch, mode);
        const instructions = disasm.disasm(bytes, baseAddr);
        
        let output = `\n=== ${sectionName} Section Disassembly ===\n`;
        
        // Create a map of addresses to function names for quick lookup
        const functionMap = new Map();
        const callTargetMap = new Map();
        
        console.log(`disassembleSection received ${functionSymbols ? functionSymbols.length : 'null'} function symbols`);
        
        if (functionSymbols) {
          functionSymbols.forEach(func => {
            functionMap.set(func.address, func.name);
            callTargetMap.set(func.address, func.name);
            console.log(`  Mapped symbol ${func.name} to address 0x${func.address.toString(16)}`);
          });
        }
        
        instructions.forEach(insn => {
          // Check if this instruction starts a function
          if (functionMap.has(insn.address)) {
            const functionName = functionMap.get(insn.address);
            output += `\n<${functionName}>:\n`;
          }
          
          // Format the basic instruction
          let line = `0x${insn.address.toString(16).padStart(8, '0')}: ${insn.bytes.map(b => b.toString(16).padStart(2, '0')).join(' ').padEnd(24)} ${insn.mnemonic} ${insn.op_str}`;
          
          // Add annotations for special instructions
          if (insn.mnemonic === 'call') {
            // Try to resolve call target
            const targetMatch = insn.op_str.match(/0x([0-9a-fA-F]+)/);
            if (targetMatch) {
              const targetAddr = parseInt(targetMatch[1], 16);
              if (callTargetMap.has(targetAddr)) {
                line += ` ; → ${callTargetMap.get(targetAddr)}()`;
              }
            }
          } else if (insn.mnemonic === 'ret') {
            // Check if this is at the end of a function (simple heuristic)
            const nextInstIndex = instructions.findIndex(i => i.address === insn.address) + 1;
            if (nextInstIndex < instructions.length && functionMap.has(instructions[nextInstIndex].address)) {
              line += ' ; → exit';
            } else if (nextInstIndex >= instructions.length) {
              line += ' ; → exit';
            }
          }
          
          output += line + '\n';
        });
        
        return output;
      } catch(e) {
        return `\nDisassembly error for ${sectionName}: ${e.message}\n`;
      }
    }

    // Helper function to extract function symbols from ELF
    function extractFunctionSymbols(parsed, textBaseAddr) {
      const {sectionHeaders, view} = parsed;
      const functions = [];
      
      try {
        // Try .symtab first, then .dynsym as fallback
        let symtabSection = sectionHeaders.find(sh => sh.name === '.symtab');
        let strtabSection = sectionHeaders.find(sh => sh.name === '.strtab');
        
        if (!symtabSection) {
          console.log('.symtab not found, trying .dynsym');
          symtabSection = sectionHeaders.find(sh => sh.name === '.dynsym');
          strtabSection = sectionHeaders.find(sh => sh.name === '.dynstr');
        }
        
        if (!symtabSection || !strtabSection || symtabSection.size === 0) {
          console.log('No symbol table found for function extraction');
          console.log('Available sections:', sectionHeaders.map(sh => sh.name));
          console.log('symtab found:', !!symtabSection, 'strtab found:', !!strtabSection);
          if (symtabSection) console.log('symtab size:', symtabSection.size);
          return functions;
        }
        
        const is64bit = parsed.elfHeader.class === 'ELF64';
        const symtabData = new Uint8Array(view.buffer, symtabSection.offset, symtabSection.size);
        const strtabData = new Uint8Array(view.buffer, strtabSection.offset, strtabSection.size);
        const symbolSize = is64bit ? 24 : 16;
        const numSymbols = symtabSection.size / symbolSize;
        
        for (let i = 0; i < numSymbols; i++) {
          const symOffset = i * symbolSize;
          const nameOffset = new DataView(symtabData.buffer, symtabData.byteOffset + symOffset).getUint32(0, true);
          
          const value = is64bit ?
            Number(new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + 8).getBigUint64(0, true)) :
            new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + 4).getUint32(0, true);
          
          const info = new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + (is64bit ? 4 : 12)).getUint8(0);
          const symbolType = info & 0xf; // ST_TYPE
          
          // Get symbol name
          let symbolName = '';
          if (nameOffset < strtabData.length) {
            for (let j = nameOffset; j < strtabData.length; j++) {
              if (strtabData[j] === 0) break;
              symbolName += String.fromCharCode(strtabData[j]);
            }
          }
          
          // Only process function symbols (STT_FUNC = 2) with valid names
          if (symbolName && symbolType === 2 && value >= 0) {
            // Determine if this is an object file vs executable based on symbol values
            // Object files have small offset values, executables have large virtual addresses
            const looksLikeOffset = value < 0x1000; // Small values are likely offsets
            const actualAddr = looksLikeOffset ? textBaseAddr + value : value;
            
            functions.push({
              name: symbolName,
              address: actualAddr,
              offset: value
            });
          }
        }
        
        // Sort functions by address for better display
        functions.sort((a, b) => a.address - b.address);
        console.log(`Extracted ${functions.length} function symbols:`, functions);
        
        // Debug: show what we found
        if (functions.length > 0) {
          console.log('Function symbols found:');
          functions.forEach(func => {
            console.log(`  ${func.name} at 0x${func.address.toString(16)} (offset: 0x${func.offset.toString(16)})`);
          });
        } else {
          console.log('No function symbols found - labels will not be displayed');
        }
        
      } catch (error) {
        console.log('Error extracting function symbols:', error);
      }
      
      // If no symbols found, try pattern-based detection as fallback
      if (functions.length === 0) {
        console.log("!!!Fallback: Function Symbol Extraction - No symbols found, using pattern-based detection");
        console.log('No symbols found, attempting pattern-based function detection');
        return detectFunctionsFromAssembly(parsed, textBaseAddr);
      }
      
      return functions;
    }

    // Fallback function detection based on assembly patterns
    function detectFunctionsFromAssembly(parsed, textBaseAddr) {
      console.log("!!!Fallback: Pattern-Based Function Detection - Detecting functions from assembly patterns");
      const functions = [];
      
      try {
        const {sectionHeaders, view} = parsed;
        const textSection = sectionHeaders.find(sh => sh.name === '.text');
        
        if (!textSection || textSection.size === 0) {
          console.log('No .text section found for pattern detection');
          return functions;
        }
        
        const is64bit = parsed.elfHeader.class === 'ELF64';
        const arch = cs.ARCH_X86;
        const mode = is64bit ? cs.MODE_64 : cs.MODE_32;
        const bytes = new Uint8Array(view.buffer, textSection.offset, textSection.size);
        
        const disasm = new cs.Capstone(arch, mode);
        const instructions = disasm.disasm(bytes, textBaseAddr);
        
        let functionIndex = 0;
        
        for (let i = 0; i < instructions.length; i++) {
          const insn = instructions[i];
          
          // Look for function prologue pattern: push rbp/ebp
          if (insn.mnemonic === 'push' && (insn.op_str === 'rbp' || insn.op_str === 'ebp')) {
            // Check if next instruction is mov rbp, rsp (typical function start)
            if (i + 1 < instructions.length) {
              const nextInsn = instructions[i + 1];
              if (nextInsn.mnemonic === 'mov' && 
                  (nextInsn.op_str === 'rbp, rsp' || nextInsn.op_str === 'ebp, esp')) {
                
                functionIndex++;
                const funcName = `func_${functionIndex}`;
                functions.push({
                  name: funcName,
                  address: insn.address,
                  offset: insn.address - textBaseAddr
                });
                
                console.log(`Pattern detected function ${funcName} at 0x${insn.address.toString(16)}`);
              }
            }
          }
        }
        
        console.log(`Pattern-based detection found ${functions.length} functions`);
        
      } catch (error) {
        console.log('Error in pattern-based function detection:', error);
      }
      
      return functions;
    }

    // Map stored function names from compile to real addresses from link
    function mapStoredNamesToAddresses(storedFunctions, linkedParsed, textBaseAddr) {
      const mappedFunctions = [];
      
      try {
        // Detect function boundaries in the linked executable using pattern detection
        const detectedFunctions = detectFunctionsFromAssembly(linkedParsed, textBaseAddr);
        
        console.log(`Mapping ${storedFunctions.length} stored names to ${detectedFunctions.length} detected functions`);
        
        // Map stored names to detected addresses by order
        for (let i = 0; i < Math.min(storedFunctions.length, detectedFunctions.length); i++) {
          mappedFunctions.push({
            name: storedFunctions[i].name,
            address: detectedFunctions[i].address,
            offset: detectedFunctions[i].offset
          });
          
          console.log(`Mapped ${storedFunctions[i].name} to address 0x${detectedFunctions[i].address.toString(16)}`);
        }
        
        // Add _start function if we have more detected functions than stored ones
        if (detectedFunctions.length > storedFunctions.length) {
          const startFunction = detectedFunctions[detectedFunctions.length - 1];
          mappedFunctions.push({
            name: '_start',
            address: startFunction.address,
            offset: startFunction.offset
          });
          console.log(`Added _start function at address 0x${startFunction.address.toString(16)}`);
        }
        
      } catch (error) {
        console.log('Error mapping stored names to addresses:', error);
      }
      
      return mappedFunctions;
    }

    // --- ELF PARSER (same as before) ---
    function readUint(view, off, size, le) {
      if (size === 1) return view.getUint8(off, le);
      if (size === 2) return view.getUint16(off, le);
      if (size === 4) return view.getUint32(off, le);
      const lo = view.getUint32(off, le);
      const hi = view.getUint32(off+4, le);
      return hi * 0x100000000 + lo;
    }
    function getString(view, off) {
      let s = '';
      for (let i = off;; i++) {
        const b = view.getUint8(i);
        if (!b) break;
        s += String.fromCharCode(b);
      }
      return s;
    }
    function parseELF(buf) {
      const view = new DataView(buf);
      if ([0x7F,0x45,0x4C,0x46].some((v,i)=>view.getUint8(i)!==v))
        throw new Error('Not an ELF file');
      const is32 = view.getUint8(4)===1;
      const le   = view.getUint8(5)===1;
      const ptr  = is32?4:8;
      const u16  = off=>readUint(view, off, 2, le);
      const u32  = off=>readUint(view, off, 4, le);
      const u64  = off=>readUint(view, off, 8, le);
      const get  = off=>(ptr===4?u32(off):u64(off));
      const eh = {
        class: is32?'ELF32':'ELF64', data: le?'little':'big',
        entry: get(24), phoff: get(is32?28:32), shoff: get(is32?32:40),
        phentsz: u16(is32?42:54), phnum: u16(is32?44:56),
        shentsz: u16(is32?46:58), shnum: u16(is32?48:60), shstrndx: u16(is32?50:62)
      };
      const ph=[];
      for(let i=0;i<eh.phnum;i++){
        const off = eh.phoff + i*eh.phentsz;
        ph.push({ type:u32(off), flags:is32?u32(off+24):u32(off+4),
          offset:get(off+(is32?4:8)), vaddr:get(off+(is32?8:16)),
          filesz:get(off+(is32?16:32)), memsz:get(off+(is32?20:40)),
          align:get(off+(is32?28:48)) });
      }
      const sh=[];
      for(let i=0;i<eh.shnum;i++){
        const off = eh.shoff + i*eh.shentsz;
        const nameOff = u32(off);
        const type    = u32(off+4);
        const flags   = ptr===4?u32(off+8):u64(off+8);
        const addr    = ptr===4?u32(off+12):u64(off+16);
        const offset  = ptr===4?u32(off+16):u64(off+24);
        const size    = ptr===4?u32(off+20):u64(off+32);
        const link    = u32(off + (ptr===4?24:40));
        const info    = u32(off + (ptr===4?28:44));
        const addralign = ptr===4?u32(off+32):u64(off+48);
        const entsize   = ptr===4?u32(off+36):u64(off+56);
        sh.push({nameOff,type,flags,addr,offset,size,link,info,addralign,entsize});
      }
      const strsh = sh[eh.shstrndx];
      sh.forEach(s=>s.name = getString(view, strsh.offset + s.nameOff));
      return {elfHeader:eh, programHeaders:ph, sectionHeaders:sh, view};
    }
    function showJSON(obj, isLinking = false){
      const operation = isLinking ? 'LINKED' : 'COMPILED';
      const timestamp = new Date().toLocaleTimeString();
      
      const header = `=== ${operation} ELF ANALYSIS (${timestamp}) ===\n\n`;
      const jsonContent = JSON.stringify(obj, (k,v)=>(k==='view'?undefined:v), 2);
      
      // Always write to the single compile-output div
      if (!window.isPerformanceModeActive) {
        document.getElementById('compile-output').textContent = header + jsonContent;
      }
    }
    
    
    function showCompileAnalysis(parsed) {
      showJSON(parsed, false);
      
      // Store function names from compiled object file
      const {sectionHeaders} = parsed;
      const textSection = sectionHeaders.find(sh => sh.name === '.text');
      if (textSection) {
        const functionSymbols = extractFunctionSymbols(parsed, 0x10000000); // Object file base
        if (functionSymbols.length > 0) {
          window.compiledFunctionNames = functionSymbols;
          window.lastCompiledCode = getSourceCode ? getSourceCode() : '';
          console.log('✓ Stored function names from compile:', functionSymbols.map(f => f.name));
        }
      }
    }
    
    let parsed;
    let unicornDebugger = null;
    
    // Global storage for function names from compile step
    window.compiledFunctionNames = null;
    window.lastCompiledCode = null; // Track what code was compiled
    
    // Testing Framework Global Variables
    window.testProgress = 0;
    window.totalTests = 0;
    
    
    
    document.getElementById('fileInput').addEventListener('change', e=>{
      const f = e.target.files[0]; if(!f) return;
      const r = new FileReader();
      r.onload = ()=>{ 
        try{ 
          parsed = parseELF(r.result); 
          showCompileAnalysis(parsed); // Default to compile analysis for manual file uploads 
          
          // Generate disassembly
          const {sectionHeaders, view, elfHeader} = parsed;
          const is64bit = elfHeader.class === 'ELF64';
          const arch = cs.ARCH_X86;
          const mode = is64bit ? cs.MODE_64 : cs.MODE_32;
          
          let disasmOutput = '';
          sectionHeaders.forEach(sh => {
            if(sh.name === '.text' && sh.size > 0 && sh.offset > 0) {
              const bytes = new Uint8Array(view.buffer, sh.offset, sh.size);
              // Determine correct base address for disassembly
              const isObjectFile = sectionHeaders.some(s => (s.flags & 0x2) && s.size > 0 && s.addr === 0);
              const disasmBaseAddr = isObjectFile ? 0x10000000 : sh.addr; // Use dynamic base for objects, real addr for executables
              
              // Extract function symbols for enhanced disassembly
              console.log(`Extracting function symbols with textBaseAddr: 0x${disasmBaseAddr.toString(16)}, isObjectFile: ${isObjectFile}`);
              const functionSymbols = extractFunctionSymbols(parsed, disasmBaseAddr);
              
              disasmOutput += disassembleSection(bytes, arch, mode, disasmBaseAddr, sh.name, functionSymbols);
            }
          });
          
          if (!window.isPerformanceModeActive) {
            if (!window.isPerformanceModeActive) {
          document.getElementById('disassembly').textContent = disasmOutput || 'No executable sections found';
        }
            document.getElementById('runUnicorn').disabled=false;
          }
        }catch(err){
          showJSON({error:err.message});
        }
      };
      r.readAsArrayBuffer(f);
    });

    // Smart reset that preserves function names for same C code
    function resetStep2Status() {
      // Check if C code has changed
      const currentCode = getSourceCode ? getSourceCode() : '';
      const codeChanged = window.lastCompiledCode !== currentCode;
      
      // Clear previous ELF data and disable debugger
      if (!window.isPerformanceModeActive) {
        document.getElementById('compile-output').textContent = '';
        document.getElementById('disassembly').textContent = 'Disassembly will appear here after loading object file...';
        document.getElementById('runUnicorn').disabled = true;
      }
      parsed = null;
      
      // Only clear function names if C code has changed
      if (codeChanged) {
        window.compiledFunctionNames = null;
        window.lastCompiledCode = currentCode;
        console.log('✓ C code changed - cleared stored function names');
      } else {
        console.log('✓ Same C code - preserving stored function names');
      }
      
      // Reset debugger state display
      updateDebuggerDisplay();
    }
    
    // Full reset including stored function names - for explicit clear
    function fullReset() {
      resetStep2Status();
      
      // Force clear stored function names
      window.compiledFunctionNames = null;
      window.lastCompiledCode = null;
      console.log('✓ Force cleared stored function names');
    }

    // Auto-load compiled .o file function
    function autoLoadCompiledFile(binaryData, compileMode = 'compile') {
      try {
        console.log('Auto-loading compiled .o file...');
        
        // Convert Uint8Array to ArrayBuffer if needed
        const buffer = binaryData.buffer ? binaryData.buffer : binaryData;
        
        // Parse the ELF data directly
        parsed = parseELF(buffer);
        
        // Show analysis in single ELF tab
        showJSON(parsed, compileMode === 'link');
        
        // Store function names if this is a compile operation
        if (compileMode === 'compile') {
          const {sectionHeaders} = parsed;
          const textSection = sectionHeaders.find(sh => sh.name === '.text');
          if (textSection) {
            const functionSymbols = extractFunctionSymbols(parsed, 0x10000000); // Object file base
            if (functionSymbols.length > 0) {
              window.compiledFunctionNames = functionSymbols;
              window.lastCompiledCode = getSourceCode ? getSourceCode() : '';
              console.log('✓ Stored function names from compile:', functionSymbols.map(f => f.name));
            }
          }
        }
        
        // Generate disassembly
        const {sectionHeaders, view, elfHeader} = parsed;
        const is64bit = elfHeader.class === 'ELF64';
        const arch = cs.ARCH_X86;
        const mode = is64bit ? cs.MODE_64 : cs.MODE_32;
        
        let disasmOutput = '';
        sectionHeaders.forEach(sh => {
          if(sh.name === '.text' && sh.size > 0 && sh.offset > 0) {
            const bytes = new Uint8Array(view.buffer, sh.offset, sh.size);
            // Determine correct base address for disassembly
            const isObjectFile = sectionHeaders.some(s => (s.flags & 0x2) && s.size > 0 && s.addr === 0);
            const disasmBaseAddr = isObjectFile ? 0x10000000 : sh.addr; // Use dynamic base for objects, real addr for executables
            
            // Extract function symbols for enhanced disassembly
            let functionSymbols;
            
            if (compileMode === 'link' && (window.compiledFunctionNames || binaryData._savedPhase1Functions)) {
              // Use stored function names from compile step with real addresses
              const functionsToUse = window.compiledFunctionNames || binaryData._savedPhase1Functions;
              console.log(`Using stored function names for linked executable (source: ${window.compiledFunctionNames ? 'window' : 'resultData'})`);
              functionSymbols = mapStoredNamesToAddresses(functionsToUse, parsed, disasmBaseAddr);
            } else {
              console.log(`Auto-load: Extracting function symbols with textBaseAddr: 0x${disasmBaseAddr.toString(16)}, isObjectFile: ${isObjectFile}`);
              functionSymbols = extractFunctionSymbols(parsed, disasmBaseAddr);
            }
            
            disasmOutput += disassembleSection(bytes, arch, mode, disasmBaseAddr, sh.name, functionSymbols);
          }
        });
        
        if (!window.isPerformanceModeActive) {
          document.getElementById('disassembly').textContent = disasmOutput || 'No executable sections found';
        }
        
        // Enable the debugger initialization button
        document.getElementById('runUnicorn').disabled = false;
        
        // Update main status indicator
        updateStatus('Object file auto-loaded successfully', 'ready');
        
        console.log('✅ Auto-load successful!');
        return true;
        
      } catch (error) {
        console.error('❌ Auto-load failed:', error);
        
        // Update main status indicator with error
        updateStatus('Auto-load failed - use manual upload', 'error');
        
        return false;
      }
    }

    document.getElementById('runUnicorn').addEventListener('click', ()=>{
      if(typeof UnicornModule==='undefined' || !UnicornModule.Unicorn){
        document.getElementById('emuOutput').textContent = 'Error: Unicorn not loaded';
        return;
      }
      
      // PERFORMANCE TEST FIX: Check if resultData has attached Phase 1 function names
      if (resultData && resultData._savedPhase1Functions && (!window.compiledFunctionNames || window.compiledFunctionNames.length <= 1)) {
        console.log('🔧 Restoring Phase 1 function names from resultData for performance test');
        window.compiledFunctionNames = resultData._savedPhase1Functions;
        window.lastCompiledCode = resultData._savedPhase1Code;
        console.log('✅ Function names restored from resultData:', resultData._savedPhase1Functions.map(f => f.name));
      }
      
      // Extract data from parsed ELF first
      const {sectionHeaders, programHeaders, view, elfHeader} = parsed;
      
      // Determine architecture and mode from ELF header
      const is64bit = elfHeader.class === 'ELF64';
      const arch = UnicornModule.ARCH_X86;
      const mode = is64bit ? UnicornModule.MODE_64 : UnicornModule.MODE_32;
      
      console.log(`Creating Unicorn engine for ${is64bit ? '64-bit' : '32-bit'} x86`);
      const engine = new UnicornModule.Unicorn(arch, mode);
      
      // Handle object files (sections with addr=0) vs executables 
      const isObjectFile = sectionHeaders.some(sh => (sh.flags & 0x2) && sh.size > 0 && sh.addr === 0);
      
      // Dynamic base address selection for object files (if needed)
      let baseAddr;
      if(isObjectFile) {
        // For object files, choose a safe base address dynamically
        // Start from a reasonable base and ensure it doesn't conflict
        baseAddr = 0x10000000; // Start lower than before to avoid conflicts
        console.log(`Object file detected, using dynamic base address: 0x${baseAddr.toString(16)}`);
      } else {
        console.log(`Executable detected, using ELF virtual addresses directly`);
      }
      const mappedRegions = new Set();
      const sectionAddresses = new Map();  // Track where we loaded each section
      const functionBoundaries = new Map(); // Map function name to {start, size} - declare at broad scope
      
      console.log(`Processing ${isObjectFile ? 'object file' : 'executable'} with ${sectionHeaders.length} sections`);
      
      sectionHeaders.forEach(sh=>{
        // Only map allocated sections (SHF_ALLOC = 0x2) with size > 0
        if((sh.flags & 0x2) && sh.size > 0){
          let targetAddr = sh.addr;
          
          // For object files, assign base addresses since they start at 0
          if(isObjectFile && sh.addr === 0){
            targetAddr = baseAddr;
            // Align to page boundary and reserve space
            targetAddr = Math.ceil(targetAddr / 0x1000) * 0x1000;
            baseAddr = targetAddr + Math.ceil(sh.size / 0x1000) * 0x1000;
          }
          
          // Skip if address is still 0 (invalid)
          if(targetAddr === 0){
            console.log(`Skipping section ${sh.name}: invalid address`);
            return;
          }
          
          // Ensure addresses and sizes are page-aligned
          const alignedAddr = Math.floor(targetAddr / 0x1000) * 0x1000;
          const alignedSize = Math.max(0x1000, Math.ceil(sh.size / 0x1000) * 0x1000);
          
          // Skip if we've already mapped this memory region
          const regionKey = `${alignedAddr}-${alignedSize}`;
          if(mappedRegions.has(regionKey)){
            console.log(`Skipping already mapped region for section ${sh.name}`);
            return;
          }
          
          const prot = (sh.flags & 0x1 ? UnicornModule.PROT_READ  : 0) |
                       (sh.flags & 0x2 ? UnicornModule.PROT_WRITE : 0) |
                       (sh.flags & 0x4 ? UnicornModule.PROT_EXEC  : 0);
          
          try {
            console.log(`Mapping section ${sh.name}: addr=0x${alignedAddr.toString(16)}, size=0x${alignedSize.toString(16)}, prot=${prot || UnicornModule.PROT_READ}`);
            engine.mem_map(alignedAddr, alignedSize, prot || UnicornModule.PROT_READ);
            mappedRegions.add(regionKey);
            sectionAddresses.set(sh.name, targetAddr);
            
            // Write section data if it exists in the file
            if(sh.size > 0 && sh.offset > 0){
              const bytes = new Uint8Array(view.buffer, sh.offset, sh.size);
              engine.mem_write(targetAddr, bytes);
              console.log(`Wrote ${bytes.length} bytes to 0x${targetAddr.toString(16)} for section ${sh.name}`);
            }
          } catch(e) {
            console.log(`Failed to map section ${sh.name}: addr=0x${alignedAddr.toString(16)}, size=0x${alignedSize.toString(16)}, error=${e.message}`);
          }
        } else {
          console.log(`Skipping section ${sh.name}: flags=0x${sh.flags.toString(16)}, addr=0x${sh.addr.toString(16)}, size=${sh.size}`);
        }
      });
      
      // Set up dynamic stack - find safe address after all sections are mapped
      const STACK_SIZE = 0x10000;     // 64KB stack
      let STACK_ADDR;
      
      if(isObjectFile) {
        // For object files, use safe address above our base mapping
        STACK_ADDR = baseAddr + 0x100000; // 1MB above last section
      } else {
        // For executables, find highest virtual address and place stack above it
        let highestAddr = 0;
        sectionHeaders.forEach(sh => {
          if((sh.flags & 0x2) && sh.size > 0 && sh.addr > 0) { // allocated sections
            const sectionEnd = sh.addr + sh.size;
            if(sectionEnd > highestAddr) {
              highestAddr = sectionEnd;
            }
          }
        });
        
        // Also check program headers for highest address
        programHeaders.forEach(ph => {
          if(ph.type === 1 && ph.memsz > 0) { // PT_LOAD segments
            const segmentEnd = ph.vaddr + ph.memsz;
            if(segmentEnd > highestAddr) {
              highestAddr = segmentEnd;
            }
          }
        });
        
        // Place stack well above highest program address
        STACK_ADDR = Math.ceil((highestAddr + 0x100000) / 0x1000) * 0x1000; // Align and add 1MB buffer
      }
      
      console.log(`Setting up dynamic stack at 0x${STACK_ADDR.toString(16)}, size 0x${STACK_SIZE.toString(16)}`);
      engine.mem_map(STACK_ADDR, STACK_SIZE, UnicornModule.PROT_ALL);
      
      // Set stack pointer based on architecture
      if(is64bit) {
        engine.reg_write_i64(UnicornModule.X86_REG_RSP, STACK_ADDR + STACK_SIZE - 0x1000);
      } else {
        engine.reg_write_i32(UnicornModule.X86_REG_ESP, STACK_ADDR + STACK_SIZE - 0x1000);
      }
      
      // Determine entry point
      let entryPoint = elfHeader.entry;
      let functionMap = new Map(); // Declare functionMap here for proper scope
      
      // Find symbol table sections (needed for both main finding and relocations)
      const symtabSection = sectionHeaders.find(sh => sh.name === '.symtab');
      const strtabSection = sectionHeaders.find(sh => sh.name === '.strtab');
      
      // For object files, try to find main function in symbol table
      let mainAddr = null;
      
      if(isObjectFile) {
        
        if(symtabSection && strtabSection && symtabSection.size > 0) {
          const symtabData = new Uint8Array(view.buffer, symtabSection.offset, symtabSection.size);
          const strtabData = new Uint8Array(view.buffer, strtabSection.offset, strtabSection.size);
          
          // Parse symbols (each symbol is 24 bytes in 64-bit ELF)
          const symbolSize = is64bit ? 24 : 16;
          const numSymbols = symtabSection.size / symbolSize;
          
          for(let i = 0; i < numSymbols; i++) {
            const symOffset = i * symbolSize;
            const nameOffset = is64bit ? 
              new DataView(symtabData.buffer, symtabData.byteOffset + symOffset).getUint32(0, true) :
              new DataView(symtabData.buffer, symtabData.byteOffset + symOffset).getUint32(0, true);
            
            const value = is64bit ?
              new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + 8).getBigUint64(0, true) :
              new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + 4).getUint32(0, true);
            
            // Get symbol name from string table
            let symbolName = '';
            for(let j = nameOffset; j < strtabData.length; j++) {
              if(strtabData[j] === 0) break;
              symbolName += String.fromCharCode(strtabData[j]);
            }
            
            console.log(`Found symbol: ${symbolName} at 0x${value.toString(16)}`);
            
            if(symbolName === 'main') {
              mainAddr = Number(value);
              console.log(`Found main function at 0x${mainAddr.toString(16)}`);
              break;
            }
          }
        }
        
        // Create a function address map with sizes for resolving calls
        console.log(`Building function map from symbol table. symtabSection: ${!!symtabSection}, strtabSection: ${!!strtabSection}`);
        
        if(symtabSection && strtabSection) {
          console.log(`Symbol table size: ${symtabSection.size}, String table size: ${strtabSection.size}`);
          const symtabData = new Uint8Array(view.buffer, symtabSection.offset, symtabSection.size);
          const strtabData = new Uint8Array(view.buffer, strtabSection.offset, strtabSection.size);
          const symbolSize = is64bit ? 24 : 16;
          const numSymbols = symtabSection.size / symbolSize;
          console.log(`Processing ${numSymbols} symbols, each ${symbolSize} bytes`);
          
          // First pass: collect all function symbols with their sizes
          const functions = [];
          
          for(let i = 0; i < numSymbols; i++) {
            const symOffset = i * symbolSize;
            const nameOffset = new DataView(symtabData.buffer, symtabData.byteOffset + symOffset).getUint32(0, true);
            const value = is64bit ?
              Number(new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + 8).getBigUint64(0, true)) :
              new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + 4).getUint32(0, true);
            
            // Get symbol size and type
            const size = is64bit ?
              Number(new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + 16).getBigUint64(0, true)) :
              new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + 8).getUint32(0, true);
            
            const info = new DataView(symtabData.buffer, symtabData.byteOffset + symOffset + (is64bit ? 4 : 12)).getUint8(0);
            const symbolType = info & 0xf; // ST_TYPE
            
            let symbolName = '';
            if(nameOffset < strtabData.length) {
              for(let j = nameOffset; j < strtabData.length; j++) {
                if(strtabData[j] === 0) break;
                symbolName += String.fromCharCode(strtabData[j]);
              }
            }
            
            // Only process function symbols (STT_FUNC = 2)
            if(symbolName && value >= 0 && symbolType === 2) {
              const actualAddr = sectionAddresses.get('.text') + value;
              functions.push({
                name: symbolName,
                address: actualAddr,
                offset: value,
                size: size || 0
              });
              functionMap.set(symbolName, actualAddr);
              console.log(`Function ${symbolName} at 0x${actualAddr.toString(16)}, size: ${size}`);
            }
          }
          
          // Sort functions by address to calculate boundaries
          functions.sort((a, b) => a.address - b.address);
          
          // Calculate function boundaries
          for(let i = 0; i < functions.length; i++) {
            const func = functions[i];
            let funcSize = func.size;
            
            // If size is 0 or unknown, calculate from next function
            if(funcSize === 0 && i < functions.length - 1) {
              funcSize = functions[i + 1].address - func.address;
            }
            
            functionBoundaries.set(func.name, {
              start: func.address,
              size: funcSize
            });
            
            console.log(`Function ${func.name}: 0x${func.address.toString(16)} - 0x${(func.address + funcSize).toString(16)} (size: ${funcSize})`);
          }
        }
        
        if(mainAddr && mainAddr > 0) {
          // Use main function address + text section base
          const textAddr = sectionAddresses.get('.text');
          entryPoint = textAddr + mainAddr;
          console.log(`Using main function as entry point: 0x${entryPoint.toString(16)}`);
        } else {
          // Fall back to .text section start
          const textAddr = sectionAddresses.get('.text');
          if(textAddr) {
            entryPoint = textAddr;
            console.log(`Main not found, using .text section as entry point: 0x${entryPoint.toString(16)}`);
          } else {
            document.getElementById('emuOutput').textContent = 'Error: No .text section found in object file';
            return;
          }
        }
      }
      
      if(entryPoint === 0) {
        document.getElementById('emuOutput').textContent = 'Error: No valid entry point found';
        return;
      }
      
      // Process relocations to fix function calls
      const relaTextSection = sectionHeaders.find(sh => sh.name === '.rela.text');
      if(relaTextSection && relaTextSection.size > 0 && functionMap.size > 0) {
        console.log('Processing relocations...');
        const relaData = new Uint8Array(view.buffer, relaTextSection.offset, relaTextSection.size);
        const relaSize = is64bit ? 24 : 12; // Size of relocation entry
        const numRelas = relaTextSection.size / relaSize;
        
        for(let i = 0; i < numRelas; i++) {
          const relaOffset = i * relaSize;
          const offset = is64bit ?
            Number(new DataView(relaData.buffer, relaData.byteOffset + relaOffset).getBigUint64(0, true)) :
            new DataView(relaData.buffer, relaData.byteOffset + relaOffset).getUint32(0, true);
          
          const info = is64bit ?
            Number(new DataView(relaData.buffer, relaData.byteOffset + relaOffset + 8).getBigUint64(0, true)) :
            new DataView(relaData.buffer, relaData.byteOffset + relaOffset + 4).getUint32(0, true);
          
          const addend = is64bit ?
            Number(new DataView(relaData.buffer, relaData.byteOffset + relaOffset + 16).getBigInt64(0, true)) :
            0;
          
          const symbolIndex = is64bit ? Math.floor(info / 0x100000000) : (info >> 8);
          const relocType = is64bit ? (info & 0xffffffff) : (info & 0xff);
          
          console.log(`Raw info: 0x${info.toString(16)}, symbolIndex: ${symbolIndex}, relocType: ${relocType}`);
          
          // Get symbol name for this relocation by parsing the symbol table
          let symbolName = '';
          
          if(symbolIndex >= 0 && symtabSection && strtabSection) {
            const symOffset = symbolIndex * (is64bit ? 24 : 16);
            console.log(`Looking up symbol ${symbolIndex} at offset ${symOffset} (symtab size: ${symtabSection.size})`);
            
            if(symOffset < symtabSection.size) {
              const symtabData = new Uint8Array(view.buffer, symtabSection.offset, symtabSection.size);
              const strtabData = new Uint8Array(view.buffer, strtabSection.offset, strtabSection.size);
              
              const nameOffset = new DataView(symtabData.buffer, symtabData.byteOffset + symOffset).getUint32(0, true);
              console.log(`Symbol ${symbolIndex} has name offset ${nameOffset} in string table (size: ${strtabData.length})`);
              
              if(nameOffset < strtabData.length && nameOffset > 0) {
                for(let j = nameOffset; j < strtabData.length; j++) {
                  if(strtabData[j] === 0) break;
                  symbolName += String.fromCharCode(strtabData[j]);
                }
              }
              
              console.log(`Resolved symbol ${symbolIndex} to name: "${symbolName}"`);
            } else {
              console.log(`Symbol ${symbolIndex} could not be read from symbol table`);
            }
          } else {
            console.log(`Invalid symbol index ${symbolIndex} or missing symbol/string tables`);
          }
          
          
          console.log(`Relocation ${i}: offset=0x${offset.toString(16)}, symbolIndex=${symbolIndex}, symbol="${symbolName}", type=${relocType}, addend=${addend}`);
          
          if(symbolName && functionMap.has(symbolName)) {
            const targetAddr = functionMap.get(symbolName);
            const patchAddr = sectionAddresses.get('.text') + offset;
            
            console.log(`Patching call to ${symbolName} at 0x${patchAddr.toString(16)} -> 0x${targetAddr.toString(16)} (type ${relocType})`);
            
            // Patch the relocation depending on type
            try {
              if(relocType === 4) { // R_X86_64_PLT32 - relative call
                // For x86_64, the relative address is calculated as: target - (current_addr + 4)
                // The +4 accounts for the size of the call instruction
                const relativeAddr = targetAddr - (patchAddr + 4);
                const patchBytes = new Uint8Array(4);
                new DataView(patchBytes.buffer).setInt32(0, relativeAddr, true);
                engine.mem_write(patchAddr, patchBytes);
                console.log(`Applied PLT32 relocation: target=0x${targetAddr.toString(16)}, patch=0x${patchAddr.toString(16)}, relative=${relativeAddr} (0x${relativeAddr.toString(16)})`);
              } else if(relocType === 2) { // R_X86_64_PC32 - relative 32-bit
                const relativeAddr = targetAddr - (patchAddr + 4);
                const patchBytes = new Uint8Array(4);
                new DataView(patchBytes.buffer).setInt32(0, relativeAddr, true);
                engine.mem_write(patchAddr, patchBytes);
                console.log(`Applied PC32 relocation: target=0x${targetAddr.toString(16)}, patch=0x${patchAddr.toString(16)}, relative=${relativeAddr} (0x${relativeAddr.toString(16)})`);
              } else if(relocType === 10) { // R_X86_64_32
                const patchBytes = new Uint8Array(4);
                new DataView(patchBytes.buffer).setUint32(0, targetAddr, true);
                engine.mem_write(patchAddr, patchBytes);
                console.log(`Applied absolute relocation: target = 0x${targetAddr.toString(16)}`);
              } else {
                console.log(`Unsupported relocation type: ${relocType}`);
              }
            } catch(e) {
              console.log(`Failed to patch relocation: ${e.message}`);
            }
          } else {
            console.log(`Symbol ${symbolName} not found in function map - available functions: ${Array.from(functionMap.keys()).join(', ')}`);
          }
        }
      }
      
      // Set up proper function call environment for main()
      let exitAddr = null;
      if(isObjectFile && mainAddr && mainAddr > 0) {
        // Set up argc and argv for main function
        if(is64bit) {
          engine.reg_write_i64(UnicornModule.X86_REG_RDI, 0); // argc = 0
          engine.reg_write_i64(UnicornModule.X86_REG_RSI, 0); // argv = NULL
        } else {
          // For 32-bit, push arguments on stack
          const sp = engine.reg_read_i32(UnicornModule.X86_REG_ESP);
          engine.mem_write(sp - 4, new Uint8Array([0, 0, 0, 0])); // argv = NULL
          engine.mem_write(sp - 8, new Uint8Array([0, 0, 0, 0])); // argc = 0
          engine.reg_write_i32(UnicornModule.X86_REG_ESP, sp - 8);
        }
        
        // Set up a return address that will cause execution to stop
        // Choose exit address dynamically to avoid conflicts
        exitAddr = STACK_ADDR + STACK_SIZE + 0x1000; // Place after stack with 4KB gap
        console.log(`Setting up dynamic exit address at 0x${exitAddr.toString(16)}`);
        
        // Map this address to prevent unmapped memory access
        engine.mem_map(exitAddr, 0x1000, UnicornModule.PROT_ALL);
        // Write a simple halt instruction sequence
        const haltBytes = new Uint8Array([0xF4]); // HLT instruction
        engine.mem_write(exitAddr, haltBytes);
        if(is64bit) {
          const sp = engine.reg_read_i64(UnicornModule.X86_REG_RSP);
          const retAddrBytes = new Uint8Array(8);
          new DataView(retAddrBytes.buffer).setBigUint64(0, BigInt(exitAddr), true);
          engine.mem_write(sp - 8, retAddrBytes);
          engine.reg_write_i64(UnicornModule.X86_REG_RSP, sp - 8);
        } else {
          const sp = engine.reg_read_i32(UnicornModule.X86_REG_ESP);
          const retAddrBytes = new Uint8Array(4);
          new DataView(retAddrBytes.buffer).setUint32(0, exitAddr, true);
          engine.mem_write(sp - 4, retAddrBytes);
          engine.reg_write_i32(UnicornModule.X86_REG_ESP, sp - 4);
        }
      }
      
      // Create debugger instance
      unicornDebugger = new UnicornDebugger(engine, is64bit, entryPoint);
      
      // Set up C function mapping if C code is available
      const cCodeInput = document.getElementById('sourceCode');
      const sourceCodeText = getSourceCode();
      
      if (cCodeInput && sourceCodeText.trim()) {
        // Parse assembly instructions from the disassembly
        const disasmDiv = document.getElementById('disassembly');
        const assemblyInstructions = [];
        
        if (disasmDiv) {
          const disasmText = disasmDiv.textContent;
          const lines = disasmText.split('\n');
          
          lines.forEach((line) => {
            // Skip function label lines (start with <)
            if (line.trim().startsWith('<') && line.trim().endsWith('>:')) {
              return;
            }
            
            const match = line.match(/0x([0-9a-fA-F]+):\s+(.+?)\s+(.+)/);
            if (match) {
              const instruction = {
                address: parseInt(match[1], 16),
                instruction: match[3] || match[2]
              };
              assemblyInstructions.push(instruction);
            }
          });
          
          console.log(`Parsed ${assemblyInstructions.length} assembly instructions for C function mapping`);
        }
        
        // Map assembly to C functions
        unicornDebugger.mapAssemblyToC(sourceCodeText, assemblyInstructions);
      }
      
      // Add breakpoint at exit address if we set one up
      if(exitAddr !== null) {
        unicornDebugger.addBreakpoint(exitAddr);
        console.log(`Added breakpoint at dynamic exit address: 0x${exitAddr.toString(16)}`);
      }
      
      // Show debugger UI
      
      // Enable debugger controls
      document.getElementById('stepBtn').disabled = false;
      document.getElementById('runBtn').disabled = false;
      document.getElementById('resetBtn').disabled = false;
      // document.getElementById('addBreakpointBtn').disabled = false;
      
      // Update initial state
      unicornDebugger.updateUI();
      if (!window.isPerformanceModeActive) {
        unicornDebugger.highlightCurrentLine();
      }
      
      if (!window.isPerformanceModeActive) {
        document.getElementById('emuOutput').textContent = 'Debugger initialized. Ready to step through code.\n';
      }
    });
    
    // Debugger control event handlers
    document.getElementById('stepBtn').addEventListener('click', () => {
      if (unicornDebugger) {
        unicornDebugger.stepInstruction();
      }
    });
    
    document.getElementById('runBtn').addEventListener('click', () => {
      if (unicornDebugger) {
        unicornDebugger.runUntilHalt();
      }
    });
    
    document.getElementById('stopBtn').addEventListener('click', () => {
      if (unicornDebugger) {
        unicornDebugger.stopExecution();
      }
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (unicornDebugger) {
        unicornDebugger.reset();
      }
    });
    
    // Function to update debugger display with default values
    function updateDebuggerDisplay() {
      // Reset register display
      const registerGrid = document.getElementById('registerGrid');
      if (registerGrid) {
        const registers = ['RAX', 'RBX', 'RCX', 'RDX', 'RSI', 'RDI', 'RSP', 'RBP', 'RIP', 'RFLAGS'];
        registerGrid.innerHTML = '';
        registers.forEach(regName => {
          const regDiv = document.createElement('div');
          regDiv.className = 'register';
          regDiv.innerHTML = `
            <span class="reg-name">${regName}:</span>
            <span class="reg-value">0x0000000000000000</span>
          `;
          registerGrid.appendChild(regDiv);
        });
      }
      
      // Reset stack display
      const stackView = document.getElementById('stackView');
      if (stackView) {
        stackView.innerHTML = '';
        for (let i = 0; i < 16; i++) {
          const stackDiv = document.createElement('div');
          stackDiv.className = 'stack-item';
          const addr = (i * 8).toString(16).padStart(16, '0');
          stackDiv.innerHTML = `
            <span class="stack-addr">0x${addr}:</span>
            <span class="stack-value">0x0000000000000000</span>
          `;
          stackView.appendChild(stackDiv);
        }
      }
    }
    
   
    

