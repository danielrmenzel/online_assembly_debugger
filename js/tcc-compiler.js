    // TinyCC Variables
    let tccModule = null;
    let isModuleReady = false;
    let resultData = null;
    let resultType = null;

    // Initialize TinyCC on page load
    window.addEventListener('load', async function() {
            try {
                tccModule = await TccModule();
                
                isModuleReady = true;
                document.getElementById('compBtn').disabled = false;
                document.getElementById('linkBtn').disabled = false;
                
                console.log('TinyCC WebAssembly module loaded successfully');
                console.log('Available functions:', Object.keys(tccModule).filter(k => typeof tccModule[k] === 'function'));
            } catch (error) {
                console.error('Failed to load TinyCC module:', error);
                console.error('Failed to load TinyCC module:', error);
            }
        });


        function setupRuntimeFiles() {
            // Verify required runtime files exist - fail if they don't
            console.log('Verifying TinyCC runtime files...');
            
            const requiredFiles = ['crt1.o', 'crti.o', 'crtn.o', 'libc.a', 'libtcc1.a'];
            const missingFiles = [];
            
            for (const filename of requiredFiles) {
                try {
                    tccModule.FS.stat(filename);
                    console.log(`✓ ${filename} found`);
                } catch (e) {
                    // Try to copy from lib directory
                    try {
                        const data = tccModule.FS.readFile('lib/' + filename);
                        tccModule.FS.writeFile(filename, data);
                        console.log(`✓ Copied ${filename} from lib/`);
                    } catch (e2) {
                        missingFiles.push(filename);
                        console.error(`✗ Missing required file: ${filename}`);
                    }
                }
            }
            
            if (missingFiles.length > 0) {
                const errorMsg = `Runtime files missing: ${missingFiles.join(', ')}. Cannot proceed with linking.`;
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
            
            console.log('All runtime files verified successfully');
        }

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
                
                // Check if we already have output (for append mode)
                const outputDiv = document.getElementById('compilationOutput');
                const hasExistingOutput = outputDiv.textContent.trim() !== '' && 
                                        outputDiv.textContent !== 'Please enter some C code to compile.' &&
                                        outputDiv.textContent !== 'Cleared output. You can now compile again.';
                
                let output = ``;
                
                // Add mode header
                if (mode === 'compile') {
                    output += `COMPILE MODE - TinyCC exit code: ${result}\n`;
                } else {
                    output += `LINK MODE - TinyCC exit code: ${result}\n`;
                }
                
                // If linking failed, suggest object compilation instead
                if (result !== 0 && mode === 'link') {
                    output += `✗ Linking failed.\n`;
                }
                
                if (result === 0) {
                    try {
                        resultData = tccModule.FS.readFile(outputFile);
                        resultType = mode === 'link' ? 'linked_executable' : 'object';
                        
                        output += `✓ SUCCESS! Generated: ${outputFile}\n`;
                        output += `File size: ${resultData.length} bytes\n\n`;
                        
                        // Validate ELF format
                        if (resultData.length >= 4) {
                            const magic = String.fromCharCode(...resultData.slice(0, 4));
                            if (magic === '\x7fELF') {
                                if (mode === 'link') {
                                    output += `✓ Valid ELF executable!\n`;
                                } else {
                                    output += `✓ Valid ELF object file!\n`;
                                }
                                
                                document.getElementById('downloadBtn').disabled = false;
                                console.log(`⚡ ${mode === 'link' ? 'Linking' : 'Compilation'} successful!`);
                                
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
                                output += `\n✓ AUTO-LOADED: Linked executable loaded into debugger!`;
                            } else {
                                output += `\n✓ AUTO-LOADED: Object file automatically loaded into debugger!`;
                            }
                        } else {
                            output += `\n✗ AUTO-LOAD FAILED: Please manually upload the downloaded file`;
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
                
                updateOutput(output, hasExistingOutput);
                
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
                
                updateOutput(`🎉 Success! ${resultType} file downloaded!\n\n` +
                            `You can now upload it to the debugger.`);
                            
                console.log(`🎉 ${resultType} file downloaded successfully!`);
                
            } catch (error) {
                updateOutput(`✗ Failed to download file: ${error.message}`);
            }
        }


        function updateOutput(message, append = false) {
            const outputDiv = document.getElementById('compilationOutput');
            if (append) {
                outputDiv.textContent += '\n' + message;
            } else {
                outputDiv.textContent = message;
            }
        }

        function clearOutput() {
            updateOutput('Cleared output. You can now compile again.');
            document.getElementById('downloadBtn').disabled = true;
            resultData = null;
            resultType = null;
            fullReset();
        }