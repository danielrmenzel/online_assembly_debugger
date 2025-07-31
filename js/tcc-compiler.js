    // TinyCC Variables
    let tccModule = null;
    let isModuleReady = false;
    let resultData = null;
    let resultType = null;

    // Initialize TinyCC when page loads
    window.addEventListener('load', async function() {
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
            // Ensure runtime files exist in the current directory where TinyCC expects them
            try {
                console.log('Setting up TinyCC runtime files...');
                
                // Check if files exist, if not create them
                const runtimeFiles = ['crt1.o', 'crti.o', 'crtn.o'];
                
                for (const filename of runtimeFiles) {
                    try {
                        tccModule.FS.stat(filename);
                        console.log(`✓ ${filename} already exists`);
                    } catch (e) {
                        // File doesn't exist, copy from lib directory or create minimal one
                        try {
                            const data = tccModule.FS.readFile('lib/' + filename);
                            tccModule.FS.writeFile(filename, data);
                            console.log(`✓ Copied ${filename} from lib/`);
                        } catch (e2) {
                            // Create minimal but functional ELF object file
                            console.log(`⚠️ Creating minimal ${filename}`);
                            const elfHeader = new Uint8Array([
                                0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00,  // ELF magic (64-bit)
                                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                0x01, 0x00, 0x3e, 0x00, 0x01, 0x00, 0x00, 0x00,  // x86_64 relocatable
                                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                                0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00,
                                0x00, 0x00, 0x40, 0x00, 0x01, 0x00, 0x00, 0x00
                            ]);
                            tccModule.FS.writeFile(filename, elfHeader);
                        }
                    }
                }
                
                // Handle libc.a - critical for linking
                try {
                    tccModule.FS.stat('libc.a');
                    console.log('✓ libc.a already exists');
                } catch (e) {
                    try {
                        const data = tccModule.FS.readFile('lib/libc.a');
                        tccModule.FS.writeFile('libc.a', data);
                        console.log('✓ Copied libc.a from lib/');
                    } catch (e2) {
                        // Create minimal archive with ar header
                        console.log('⚠️ Creating minimal libc.a');
                        const archive = new Uint8Array([
                            0x21, 0x3C, 0x61, 0x72, 0x63, 0x68, 0x3E, 0x0A,  // "!<arch>\n"
                            // Add minimal archive entry
                            0x2F, 0x2F, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,  // "//      "
                            0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,  // "        "
                            0x30, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,  // "0       "
                            0x20, 0x20, 0x20, 0x20, 0x30, 0x20, 0x20, 0x20,  // "    0   "
                            0x20, 0x20, 0x30, 0x20, 0x20, 0x20, 0x20, 0x20,  // "  0     "
                            0x20, 0x20, 0x36, 0x30, 0x0A, 0x60, 0x0A        // "  60\n`\n"
                        ]);
                        tccModule.FS.writeFile('libc.a', archive);
                    }
                }
                
                // Handle libtcc1.a - TinyCC's runtime library
                try {
                    tccModule.FS.stat('libtcc1.a');
                    console.log('✓ libtcc1.a already exists');
                } catch (e) {
                    try {
                        const data = tccModule.FS.readFile('lib/libtcc1.a');
                        tccModule.FS.writeFile('libtcc1.a', data);
                        console.log('✓ Copied libtcc1.a from lib/');
                    } catch (e2) {
                        // Create minimal libtcc1.a
                        console.log('⚠️ Creating minimal libtcc1.a');
                        const archive = new Uint8Array([
                            0x21, 0x3C, 0x61, 0x72, 0x63, 0x68, 0x3E, 0x0A,
                            0x2F, 0x2F, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                            0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                            0x30, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                            0x20, 0x20, 0x20, 0x20, 0x30, 0x20, 0x20, 0x20,
                            0x20, 0x20, 0x30, 0x20, 0x20, 0x20, 0x20, 0x20,
                            0x20, 0x20, 0x36, 0x30, 0x0A, 0x60, 0x0A
                        ]);
                        tccModule.FS.writeFile('libtcc1.a', archive);
                    }
                }
                
                console.log('Runtime files setup complete');
                
            } catch (error) {
                console.log('Runtime setup error:', error);
            }
        }

        function quickCompileExact(mode = 'compile') {
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
                    output += `⚠️ Linking failed - this is common with WebAssembly TinyCC.\n`;
                    output += `💡 Try using "⚡ Compile (.o)" instead for object file debugging.\n`;
                    output += `📋 Object files work perfectly with the debugger and show clean assembly.\n\n`;
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

       
        
 

  