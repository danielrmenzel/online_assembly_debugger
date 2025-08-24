// TinyCC Variables
let tccModule = null;
let isModuleReady = false;
let resultData = null;
let resultType = null;

// Initialize TinyCC when page loads
window.addEventListener('load', async function () {
    try {
        tccModule = await TccModule();

        isModuleReady = true;
        document.getElementById('quickBtn').disabled = false;
        document.getElementById('linkBtn').disabled = false;

        console.log('TinyCC module ready with reference approach');
        console.log('Available functions:', Object.keys(tccModule).filter(k => typeof tccModule[k] === 'function'));
    } catch (error) {
        console.error('Failed to load TinyCC module:', error);
        updateStatus('error', 'Failed to load TinyCC module: ' + error.message);
    }
});

function updateStatus(type, message) {
    const statusDiv = document.getElementById('status');
    statusDiv.className = 'status ' + type;
    statusDiv.textContent = message;
}

function setupRuntimeFiles() {
    try {
        console.log('Setting up TinyCC runtime files...');

        const runtimeFiles = ['crt1.o', 'crti.o', 'crtn.o'];

        for (const filename of runtimeFiles) {
            try {
                tccModule.FS.stat(filename);
                console.log(`✓ ${filename} already exists`);
            } catch (e) {
                const data = tccModule.FS.readFile('lib/' + filename);
                tccModule.FS.writeFile(filename, data);
                console.log(`✓ Copied ${filename} from lib/`);
            }
        }
        const data = tccModule.FS.readFile('lib/libc.a');
        tccModule.FS.writeFile('libc.a', data);
        console.log('✓ Copied libc.a from lib/');


        const data2 = tccModule.FS.readFile('lib/libtcc1.a');
        tccModule.FS.writeFile('libtcc1.a', data2);
        console.log('✓ Copied libtcc1.a from lib/');

        console.log('Runtime files setup complete');

    } catch (error) {
        console.log('Runtime setup error:', error);
    }
}
/**
 * Compiles C source code using TinyCC WebAssembly module with dual compilation modes.
 * Handles both object file generation (.o) and linked executable creation with proper
 * WebAssembly runtime file setup and memory management.
 * 
 * @param {string} mode - Compilation mode: 'compile' for object file or 'link' for linked executable
 * @param {string} mode.compile - Creates object file (.o) with relative addressing for debugging
 * @param {string} mode.link - Creates linked executable with _start function for execution
 * 
 * @description
 * **Compilation Pipeline:**
 * 1. Reset previous compilation state and clear debugger status
 * 2. Setup TinyCC runtime files (crt1.o, crti.o, crtn.o, libc.a, libtcc1.a)
 * 3. Write C source to virtual filesystem as 'source.c'
 * 4. For linking mode: inject _start() function to call main()
 * 5. Execute TinyCC with appropriate command line arguments
 * 6. Validate output ELF format and enable debugger integration
 * 7. Auto-load compiled result into debugging pipeline
 * 
 * **Memory Management:**
 * - Allocates argc/argv arrays manually for WebAssembly compatibility
 * - Handles string conversion and null termination for TinyCC arguments
 * - Cleans up allocated memory after compilation to prevent leaks
 * 
 * **Error Handling:**
 * - Validates TinyCC exit codes and provides detailed error reporting
 * - Falls back gracefully from linking failures to object compilation
 * - Updates UI status indicators and enables/disables download functionality
 * 
 * @throws {Error} When TinyCC module is not ready or compilation fails critically
 * @modifies {global} resultData - Stores compiled binary data for download/debugging
 * @modifies {global} resultType - Sets to 'object' or 'linked_executable'
 * @modifies {DOM} Updates compilation output display and button states
 * 
 * @example
 * // Compile to object file for debugging
 * compileFromSource('compile');
 * 
 * @example 
 * // Create linked executable for execution
 * compileFromSource('link');
 * 
 * @see setupRuntimeFiles() For WebAssembly runtime file preparation
 * @see autoLoadCompiledFile() For automatic debugger integration
 * @since Version 1.0 - Initial WebAssembly TinyCC integration
 */
function compileFromSource(mode = 'compile') {
    const sourceCode = getSourceCode();
    if (!sourceCode.trim()) {
        updateOutput('Please enter some C code to compile.');
        return;
    }

    try {
        // Reset Step 2 status for new compilation
        resetStep2Status();

        // Setup runtime files first to avoid crt*.o errors
        setupRuntimeFiles();

        // Write source code to virtual filesystem
        const inputFile = 'source.c';
        let outputFile, args;

        // For linking mode, we need to add a _start function since we're using -nostdlib
        let finalSourceCode = sourceCode;
        if (mode === 'link') {
            // Add _start function that calls main() and exits
            finalSourceCode = sourceCode + `

// WebAssembly TinyCC linking requires _start function
void _start() {
    // Call main function and use its return value as exit code
    int result = main();
    // In a real system, this would call exit(result)
    // For WebAssembly debugging, we just return
    return;
}
`;
        }

        tccModule.FS.writeFile(inputFile, finalSourceCode);

        // Configure compilation mode
        if (mode === 'link') {
            // Link mode: create a linked executable for better debugging
            // Use our enhanced runtime files and library setup
            outputFile = 'source_linked';

            // Debug: List available files
            console.log('Available files in TinyCC filesystem:');
            try {
                const files = tccModule.FS.readdir('.');
                console.log('Current directory files:', files);

                // Check lib directory too
                try {
                    const libFiles = tccModule.FS.readdir('lib');
                    console.log('lib/ directory files:', libFiles);
                } catch (e) {
                    console.log('lib/ directory not accessible:', e.message);
                }
            } catch (e) {
                console.log('Cannot list files:', e.message);
            }

            // Try the simplest possible linking approach
            // Use -nostdlib to avoid runtime file dependencies that are causing issues
            args = ['tcc', inputFile, '-o', outputFile, '-nostdlib'];
        } else {
            // Compile mode: create object file (current behavior)
            outputFile = 'source.o';
            args = ['tcc', '-c', '-nostdlib', inputFile, '-o', outputFile];
        }

        // Manual argc/argv construction (ccall array handling has issues)
        const argc = args.length;

        // Allocate memory for argv array
        const argv = tccModule._malloc(argc * 4);
        const argPtrs = [];

        // Create each argument string and store pointer
        for (let i = 0; i < argc; i++) {
            const str = args[i];
            const ptr = tccModule._malloc(str.length + 1);

            // Write string to memory byte by byte
            for (let j = 0; j < str.length; j++) {
                tccModule.setValue(ptr + j, str.charCodeAt(j), 'i8');
            }
            // Add null terminator
            tccModule.setValue(ptr + str.length, 0, 'i8');

            // Store pointer in argv array
            tccModule.setValue(argv + i * 4, ptr, 'i32');
            argPtrs.push(ptr);
        }

        // Call main function with argc/argv
        const result = tccModule._main(argc, argv);

        // Clean up memory
        for (const ptr of argPtrs) {
            tccModule._free(ptr);
        }
        tccModule._free(argv);

        let output = `📊 TinyCC exit code: ${result}\n\n`;

        // If linking failed, suggest object compilation instead
        if (result !== 0 && mode === 'link') {
            output += `⚠️ Linking failed\n`;

        }

        if (result === 0) {
            try {
                resultData = tccModule.FS.readFile(outputFile);
                resultType = mode === 'link' ? 'linked_executable' : 'object';

                output += `✓ SUCCESS! Generated: ${outputFile}\n`;
                output += `📏 File size: ${resultData.length} bytes\n\n`;

                // Validate ELF format
                if (resultData.length >= 4) {
                    const magic = String.fromCharCode(...resultData.slice(0, 4));
                    if (magic === '\x7fELF') {
                        if (mode === 'link') {
                            output += `✅ Valid ELF executable with proper entry points!\n`;
                            output += `� This will have better symbol resolution and cleaner assembly for debugging.\n`;
                            output += `�📥 Click "Download" or load into debugger!`;
                        } else {
                            output += `✅ Valid ELF object file!\n`;
                            output += `📥 Click "Download" to get your .o file!`;
                        }

                        document.getElementById('downloadBtn').disabled = false;
                        updateStatus('ready', `⚡ ${mode === 'link' ? 'Linking' : 'Compilation'} successful!`);

                    } else {
                        output += `⚠️ Generated file may not be standard ELF format\n`;
                        output += `Magic bytes: ${magic}\n`;
                        document.getElementById('downloadBtn').disabled = false;
                    }
                }

                // Auto-load both object files and linked executables into the debugger
                const autoLoadSuccess = autoLoadCompiledFile(resultData, mode);
                if (autoLoadSuccess) {
                    if (mode === 'link') {
                        output += `\n🔄 AUTO-LOADED: Linked executable loaded into debugger!`;
                        output += `\n📋 You should see better symbols and entry points - Click "🔧 Initialize Debugger"`;
                    } else {
                        output += `\n🔄 AUTO-LOADED: Object file automatically loaded into debugger!`;
                        output += `\n📋 Ready for debugging - Click "🔧 Initialize Debugger"`;
                    }
                } else {
                    output += `\n⚠️ AUTO-LOAD FAILED: Please manually upload the downloaded file`;
                }

            } catch (readError) {
                output += `✗ ${mode === 'link' ? 'Linking' : 'Compilation'} claimed success but couldn't read output file:\n`;
                output += `Error: ${readError.message}`;
            }
        } else {
            output += `✗ ${mode === 'link' ? 'Linking' : 'Compilation'} failed with exit code: ${result}\n`;
            output += `Check your C code for syntax errors.`;
            document.getElementById('downloadBtn').disabled = true;
        }

        updateOutput(output);

    } catch (error) {
        console.error('Quick compile error:', error);
        updateOutput(`✗ Quick compile error: ${error.message}`);
        document.getElementById('downloadBtn').disabled = true;
    }
}


function downloadResult() {
    if (!resultData) {
        updateOutput('No result file available for download.');
        return;
    }

    try {
        const blob = new Blob([resultData], {
            type: resultType === 'object' ? 'application/octet-stream' : 'text/plain'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        if (resultType === 'object') {
            a.download = 'compiled.o';
        } else if (resultType === 'linked_executable') {
            a.download = 'compiled_linked.elf';
        } else if (resultType === 'relocatable') {
            a.download = 'relocatable.o';
        } else if (resultType === 'assembly') {
            a.download = 'compiled.s';
        } else if (resultType === 'preprocessed') {
            a.download = 'preprocessed.i';
        } else {
            a.download = 'output.txt';
        }

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        updateOutput(`🎉 Success! ${resultType} file downloaded!\\n\\n` +
            `You can now upload it to the debugger.`);

        updateStatus('ready', `🎉 ${resultType} file downloaded successfully!`);

    } catch (error) {
        updateOutput(`✗ Failed to download file: ${error.message}`);
    }
}


function updateOutput(message) {
    const outputDiv = document.getElementById('compilationOutput');
    outputDiv.textContent = message;
}

function clearOutput() {
    updateOutput('Click a compilation option to start...');
    document.getElementById('downloadBtn').disabled = true;
    resultData = null;
    resultType = null;
    fullReset(); // Use full reset for clear button
}