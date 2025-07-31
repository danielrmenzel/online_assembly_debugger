   // ============================================================================
    // TESTING FRAMEWORK FUNCTIONS
    // ============================================================================
    // Test Categories Organization
    const testCategories = {
      unit: ['simple', 'add', 'factorial', 'sum_up_to'],
      advanced: [
        'fibonacci', 'prime', 'main_function', 'factorial_large', 'fibonacci_large', 'sum_recursive', 'power_recursive', 'gcd_recursive',
        'while_loop', 'nested_loops', 'array_sum', 'array_max', 'bubble_sort', 'binary_search',
        'matrix_multiply', 'quicksort_partition', 'collatz', 'triangle_numbers', 'bitwise_ops',
        'bit_counting', 'struct_test', 'heavy_computation'
      ],
      function_calls: [
        'five_function_cycle', 'four_function_cycle', 'two_function_ping_pong', 
        'three_function_with_loops', 'function_call_in_loop', 'three_function_original'
      ],
      function_limits: [
        'function_limit_1', 'function_limit_2', 'function_limit_3', 'function_limit_4',
        'function_limit_5', 'function_limit_6', 'function_limit_7'
      ],
      edge_case_stress: [
        'regex_static_modifier', 'regex_return_pointer', 'regex_inline_qualifier', 'regex_multiple_qualifiers',
        'regex_function_attributes', 'regex_complex_return_type', 'brace_string_literal', 'brace_multiline_comments',
        'brace_single_comments', 'multiline_function_def', 'inline_single_line', 'complex_whitespace',
        'preprocessor_directives', 'multiple_returns', 'function_pointers', 'multiple_functions_line',
        'nested_function_calls', 'variable_shadowing', 'no_frame_pointer', 'tail_call_optimization',
        'inline_assembly', 'string_with_braces_complex', 'comment_braces_nested', 'weird_formatting_extreme'
      ],
      dynamic_validation: [
        'dynamic_complex_qualifiers', 'dynamic_diverse_features'
      ]
    };
    
    // Test Data Structure with All Test Cases
    const tests = {
      // Unit Tests
      simple: { 
        code: `int main() {
    return 42;
}`, 
        expected: 42, 
        description: "Test simple return value",
        timeout: 20000
      },
      add: { 
        code: `int add(int a, int b) {
    return a + b;
}

int main() {
    return add(15, 25);
}`, 
        expected: 40, 
        description: "Test addition function",
        timeout: 20000
      },
      factorial: { 
        code: `int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    return factorial(5);
}`, 
        expected: 120, 
        description: "Test recursive factorial function",
        timeout: 20000
      },
      sum_up_to: {
        code: `int sum_up_to(int n) {
    int sum = 0;
    for (int i = 1; i <= n; i++) {
        if (i == 2 || i == 4) continue;
        if (i > n) break;
        sum += i;
    }
    return sum;
}

int main() {
    return sum_up_to(5);
}`,
        expected: 9,
        description: "Test for loop with continue and break",
        timeout: 20000
      },
      
      // Integration Tests
      fibonacci: { 
        code: `int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    return fibonacci(5);
}`, 
        expected: 5, 
        description: "Test fibonacci sequence",
        timeout: 20000
      },
      prime: { 
        code: `int isPrime(int n) {
    if (n <= 1) return 0;
    if (n <= 3) return 1;
    if (n % 2 == 0 || n % 3 == 0) return 0;
    
    for (int i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return 0;
    }
    return 1;
}

int main() {
    return isPrime(17);
}`, 
        expected: 1, 
        description: "Test prime number check",
        timeout: 20000
      },
      main_function: {
        code: `void print_sign(int x) {
    // Dummy function for testing
}

int sum_up_to(int n) {
    int sum = 0;
    for (int i = 1; i <= n; i++) {
        if (i == 2 || i == 4) continue;
        if (i > n) break;
        sum += i;
    }
    return sum;
}

int main() {
    print_sign(10);
    int result = sum_up_to(5);
    return result;
}`,
        expected: 9,
        description: "Test complete main function with multiple function calls",
        timeout: 20000
      },
      
      // Advanced Tests - Recursion
      factorial_large: {
        code: `int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    return factorial(6);
}`,
        expected: 720,
        description: "Test factorial with larger number",
        timeout: 20000
      },
      fibonacci_large: {
        code: `int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    return fibonacci(7);
}`,
        expected: 13,
        description: "Test fibonacci with larger number",
        timeout: 20000
      },
      sum_recursive: {
        code: `int sum_recursive(int n) {
    if (n <= 0) return 0;
    return n + sum_recursive(n - 1);
}

int main() {
    return sum_recursive(5);
}`,
        expected: 15,
        description: "Test recursive sum function",
        timeout: 20000
      },
      power_recursive: {
        code: `int power(int base, int exp) {
    if (exp == 0) return 1;
    return base * power(base, exp - 1);
}

int main() {
    return power(2, 4);
}`,
        expected: 16,
        description: "Test recursive power function",
        timeout: 20000
      },
      gcd_recursive: {
        code: `int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}

int main() {
    return gcd(48, 18);
}`,
        expected: 6,
        description: "Test recursive GCD algorithm",
        timeout: 20000
      },
      
      // Advanced Tests - Loops
      while_loop: {
        code: `int main() {
    int i = 0;
    int sum = 0;
    while (i < 5) {
        sum += i;
        i++;
    }
    return sum;
}`,
        expected: 10,
        description: "Test while loop functionality",
        timeout: 20000
      },
      nested_loops: {
        code: `int main() {
    int sum = 0;
    for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= 4; j++) {
            sum += i * j;
        }
    }
    return sum;
}`,
        expected: 60,
        description: "Test nested loop functionality",
        timeout: 20000
      },
      
      // Advanced Tests - Arrays
      array_sum: {
        code: `int main() {
    int arr[5] = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += arr[i];
    }
    return sum;
}`,
        expected: 15,
        description: "Test array initialization and sum",
        timeout: 20000
      },
      array_max: {
        code: `int main() {
    int arr[5] = {3, 7, 2, 9, 1};
    int max = arr[0];
    for (int i = 1; i < 5; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}`,
        expected: 9,
        description: "Test finding maximum in array",
        timeout: 20000
      },
      bubble_sort: {
        code: `int main() {
    int arr[5] = {64, 34, 25, 12, 22};
    int n = 5;
    
    // Bubble sort
    for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
    
    return arr[0]; // Return smallest element
}`,
        expected: 12,
        description: "Test bubble sort algorithm",
        timeout: 20000
      },
      binary_search: {
        code: `int binary_search(int arr[], int low, int high, int target) {
    if (high >= low) {
        int mid = low + (high - low) / 2;
        
        if (arr[mid] == target)
            return mid;
        
        if (arr[mid] > target)
            return binary_search(arr, low, mid - 1, target);
        
        return binary_search(arr, mid + 1, high, target);
    }
    
    return -1;
}

int main() {
    int arr[5] = {2, 3, 4, 10, 40};
    int n = 5;
    int target = 10;
    int result = binary_search(arr, 0, n - 1, target);
    return result;
}`,
        expected: 3,
        description: "Test recursive binary search",
        timeout: 20000
      },
      
      // Advanced Tests - Mathematical
      matrix_multiply: {
        code: `int main() {
    // 2x2 matrix multiplication
    int a[2][2] = {{1, 2}, {3, 4}};
    int b[2][2] = {{2, 0}, {1, 2}};
    int result[2][2];
    
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            result[i][j] = 0;
            for (int k = 0; k < 2; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    
    return result[1][1]; // Return bottom-right element
}`,
        expected: 8,
        description: "Test 2x2 matrix multiplication",
        timeout: 20000
      },
      quicksort_partition: {
        code: `int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    
    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return (i + 1);
}

int main() {
    int arr[5] = {10, 80, 30, 90, 40};
    int n = 5;
    int pivot_index = partition(arr, 0, n - 1);
    return pivot_index;
}`,
        expected: 2,
        description: "Test quicksort partition function",
        timeout: 20000
      },
      collatz: {
        code: `int collatz(int n) {
    int steps = 0;
    while (n != 1) {
        if (n % 2 == 0) {
            n = n / 2;
        } else {
            n = 3 * n + 1;
        }
        steps++;
    }
    return steps;
}

int main() {
    return collatz(7);
}`,
        expected: 16,
        description: "Test Collatz conjecture sequence",
        timeout: 20000
      },
      triangle_numbers: {
        code: `int main() {
    int n = 8;
    int sum = 0;
    for (int i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}`,
        expected: 36,
        description: "Test triangle numbers calculation",
        timeout: 20000
      },
      
      // Advanced Tests - Bitwise
      bitwise_ops: {
        code: `int main() {
    int a = 12;  // 1100 in binary
    int b = 25;  // 11001 in binary
    
    int and_result = a & b;    // 8 (1000)
    int or_result = a | b;     // 29 (11101)
    int xor_result = a ^ b;    // 21 (10101)
    
    return xor_result;
}`,
        expected: 21,
        description: "Test bitwise operations",
        timeout: 20000
      },
      bit_counting: {
        code: `int count_bits(int n) {
    int count = 0;
    while (n) {
        count += n & 1;
        n >>= 1;
    }
    return count;
}

int main() {
    return count_bits(15); // 1111 in binary = 4 bits set
}`,
        expected: 4,
        description: "Test bit counting algorithm",
        timeout: 20000
      },
      
      // Advanced Tests - Structures (simplified)
      struct_test: {
        code: `int main() {
    // Simulate struct using variables
    int point_x = 5;
    int point_y = 10;
    
    int distance_squared = point_x * point_x + point_y * point_y;
    return distance_squared;
}`,
                             expected: 125,
        description: "Test structure-like operations",
        timeout: 20000
      },
      
      // Advanced Tests - Performance
      heavy_computation: {
        code: `int compute_sum(int n) {
    int sum = 0;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= 100; j++) {
            sum += i * j % 17;
        }
    }
    return sum % 1000;
}

int main() {
    return compute_sum(10);
}`,
        expected: 500,
        description: "Test heavy computational workload",
        timeout: 20000
      },
      
      // Function Calls Tests
      five_function_cycle: {
        code: `int p1(int x);
int p2(int x);
int p3(int x);
int p4(int x);
int p5(int x);

int p1(int x) { return p2(x + 1); }
int p2(int x) { return p3(x + 2); }
int p3(int x) { return p4(x + 3); }
int p4(int x) { return p5(x + 4); }
int p5(int x) { return x + 5; }

int main() {
    return p1(10);
}`,
        expected: 25,
        description: "Five Function Cycle (p1→p2→p3→p4→p5)",
        timeout: 20000
      },
      four_function_cycle: {
        code: `int h1(int x);
int h2(int x);
int h3(int x);
int h4(int x);

int h1(int x) { return h2(x * 2); }
int h2(int x) { return h3(x + 3); }
int h3(int x) { return h4(x - 1); }
int h4(int x) { return x + 10; }

int main() {
    return h1(5);
}`,
        expected: 22,
        description: "Four Function Cycle (h1→h2→h3→h4)",
        timeout: 20000
      },
      two_function_ping_pong: {
        code: `int ping(int x, int count);
int pong(int x, int count);

int ping(int x, int count) {
    if (count <= 0) return x;
    return pong(x + 1, count - 1);
}

int pong(int x, int count) {
    if (count <= 0) return x;
    return ping(x * 2, count - 1);
}

int main() {
    return ping(1, 4);
}`,
        expected: 10,
        description: "Two Function Ping Pong",
        timeout: 20000
      },
      three_function_with_loops: {
        code: `int func_a(int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum += i;
    }
    return sum;
}

int func_b(int n) {
    return func_a(n) * 2;
}

int func_c(int n) {
    return func_b(n) + 5;
}

int main() {
    return func_c(4);
}`,
        expected: 17,
        description: "Functions with Loops",
        timeout: 20000
      },
      function_call_in_loop: {
        code: `int square(int x) {
    return x * x;
}

int main() {
    int sum = 0;
    for (int i = 1; i <= 3; i++) {
        sum += square(i);
    }
    return sum;
}`,
        expected: 14,
        description: "Function Calls Inside Loops",
        timeout: 20000
      },
      three_function_original: {
        code: `int func1(int x);
int func2(int x);
int func3(int x);

int func1(int x) { return func2(x + 1); }
int func2(int x) { return func3(x + 2); }
int func3(int x) { return x + 3; }

int main() {
    return func1(4);
}`,
        expected: 10,
        description: "Original three function circular test",
        timeout: 20000
      },
      
      // Function Limits Tests
      function_limit_1: {
        code: `int main() {
    return 42;
}`,
        expected: 42,
        description: "Single function test - should always work",
        timeout: 5000
      },
      function_limit_2: {
        code: `int helper(int x) {
    return x * 2;
}

int main() {
    return helper(21);
}`,
        expected: 42,
        description: "Two functions - main + helper",
        timeout: 10000
      },
      function_limit_3: {
        code: `int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }

int main() {
    int x = add(10, 5);
    int y = mul(x, 2);
    return y + 12;
}`,
        expected: 42,
        description: "Three functions - concurrent calls",
        timeout: 15000
      },
      function_limit_4: {
        code: `int f1(int x) { return x + 1; }
int f2(int x) { return x + 2; }
int f3(int x) { return x + 3; }

int main() {
    return f1(10) + f2(15) + f3(11);
}`,
        expected: 42,
        description: "Four functions - multi-concurrent",
        timeout: 15000
      },
      function_limit_5: {
        code: `int p1(int x) { return x + 10; }
int p2(int x) { return x + 20; }
int p3(int x) { return x + 30; }
int p4(int x) { return x + 40; }

int main() {
    return p1(2) + p2(3) + p3(4) + p4(5) - 200;
}`,
        expected: 42,
        description: "Five functions - stress test concurrent calls",
        timeout: 15000
      },
      function_limit_6: {
        code: `int f1(int x) { return x * 2; }
int f2(int x) { return x * 3; }
int f3(int x) { return x * 4; }
int f4(int x) { return x * 5; }
int f5(int x) { return x * 6; }

int main() {
    return f1(1) + f2(2) + f3(3) + f4(4) + f5(5) - 28;
}`,
        expected: 42,
        description: "Six functions - heavy load",
        timeout: 20000
      },
      function_limit_7: {
        code: `int g1(int x) { return x + 100; }
int g2(int x) { return x + 200; }
int g3(int x) { return x + 300; }
int g4(int x) { return x + 400; }
int g5(int x) { return x + 500; }
int g6(int x) { return x + 600; }

int main() {
    return g1(1) + g2(2) + g3(3) + g4(4) + g5(5) + g6(6) - 2079;
}`,
        expected: 42,
        description: "Seven functions - maximum test concurrent calls",
        timeout: 20000
      },
      
      // Tests That Will Fail - Designed to expose parsing and detection flaws
      regex_static_modifier: {
        code: `static int add(int a, int b) {
    return a + b;
}

int main() {
    return add(5, 3);
}`,
        expected: 8,
        description: "FAIL: Regex captures 'static' instead of 'add' function name",
        timeout: 25000
      },
      
      regex_return_pointer: {
        code: `int* getPointer(void) {
    static int value = 42;
    return &value;
}

int main() {
    return 42; // Simplified since we can't dereference pointers
}`,
        expected: 42,
        description: "FAIL: Regex captures 'int' instead of 'getPointer' function name",
        timeout: 25000
      },
      
      regex_inline_qualifier: {
        code: `inline int fast_calc(int x) {
    return x * 2;
}

int main() {
    return fast_calc(21);
}`,
        expected: 42,
        description: "FAIL: Regex captures 'inline' instead of 'fast_calc' function name",
        timeout: 25000
      },
      
      regex_multiple_qualifiers: {
        code: `static inline int optimized_func(int n) {
    return n + 1;
}

int main() {
    return optimized_func(41);
}`,
        expected: 42,
        description: "FAIL: Regex captures 'static' instead of 'optimized_func' function name",
        timeout: 25000
      },
      
      regex_function_attributes: {
        code: `// Note: __attribute__ might not work in TinyCC, but tests the regex
int attr_func(int x) {
    return x;
}

int main() {
    return attr_func(42);
}`,
        expected: 42,
        description: "FAIL: Function attributes would break regex pattern",
        timeout: 25000
      },
      
      regex_complex_return_type: {
        code: `unsigned long long big_number(void) {
    return 42;
}

int main() {
    return (int)big_number();
}`,
        expected: 42,
        description: "FAIL: Regex captures 'unsigned' instead of 'big_number' function name",
        timeout: 25000
      },
      
      brace_string_literal: {
        code: `int string_test(void) {
    // This string contains braces that will confuse brace counting
    volatile char code[] = "if (x > 0) { return 1; } else { return 0; }";
    return 42;
}

int main() {
    return string_test();
}`,
        expected: 42,
        description: "FAIL: Braces in string literals break function boundary detection",
        timeout: 25000
      },
      
      brace_multiline_comments: {
        code: `int comment_test(void) {
    /* 
     * This multi-line comment contains { braces }
     * that will be incorrectly counted as code blocks!
     * More { braces } here { and here }
     */
    return 42;
}

int main() {
    return comment_test();
}`,
        expected: 42,
        description: "FAIL: Braces in multi-line comments break function boundary detection",
        timeout: 25000
      },
      
      brace_single_comments: {
        code: `int single_comment_test(void) {
    // This comment has { braces } that break counting
    int x = 5; // Another comment with { more braces }
    return x * 8 + 2; // Should be 42
}

int main() {
    return single_comment_test();
}`,
        expected: 42,
        description: "FAIL: Braces in single-line comments break function boundary detection",
        timeout: 25000
      },
      
      multiline_function_def: {
        code: `int
subtract(int a, int b)
{
    return a - b;
}

int main() {
    return subtract(50, 8); // 42
}`,
        expected: 42,
        description: "FAIL: Function name on different line breaks line-based parsing",
        timeout: 25000
      },
      
      inline_single_line: {
        code: `int divide(int a, int b){ return a / b; }

int main() {
    return divide(84, 2); // 42
}`,
        expected: 42,
        description: "FAIL: Single-line function definition may break brace counting",
        timeout: 25000
      },
      
      complex_whitespace: {
        code: `int    weird_spacing   (   int   a   ,   int   b   )   
{
        return     a     +     b     ;
}

int main() {
    return weird_spacing(20, 22);
}`,
        expected: 42,
        description: "FAIL: Complex whitespace and formatting may break regex matching",
        timeout: 25000
      },
      
      preprocessor_directives: {
        code: `#define RESULT 42

int get_result(void) {
    return RESULT;
}

int main() {
    return get_result();
}`,
        expected: 42,
        description: "Warning: Preprocessor directives may confuse function detection",
        timeout: 25000
      },
      
      multiple_returns: {
        code: `int validate_input(int x) {
    if (x < 0) return -1;    // Early return #1
    if (x > 100) return -2;  // Early return #2
    return x;                // Normal return
}

int main() {
    return validate_input(42);
}`,
        expected: 42,
        description: "Warning: Multiple return paths may break single-exit assumptions",
        timeout: 25000
      },
      
      function_pointers: {
        code: `int add(int a, int b) {
    return a + b;
}

int main() {
    int (*operation)(int, int) = add;
    return operation(20, 22);  // This looks like a function call but isn't
}`,
        expected: 0,
        description: "Warning: Function pointers that look like function calls may confuse detection",
        timeout: 25000
      },
      
      multiple_functions_line: {
        code: `int min(int a,int b){return a<b?a:b;}int max(int a,int b){return a>b?a:b;}

int main() {
    return min(42, 50) + max(0, 0); // 42 + 0 = 42
}`,
        expected: 42,
        description: "FAIL: Multiple functions on same line breaks parser",
        timeout: 25000
      },
      
      nested_function_calls: {
        code: `int add(int a, int b) {
    return a + b;
}

int triple_add(int x, int y, int z) {
    return add(add(x, y), z);  // Nested calls in same line
}

int main() {
    return triple_add(10, 15, 17); // 42
}`,
        expected: 42,
        description: "Warning: Nested function calls in same line may confuse detection",
        timeout: 25000
      },
      
      variable_shadowing: {
        code: `int add(int a, int b) {
    return a + b;
}

int main() {
    int add = 10;  // Variable named "add" shadows function!
    int result = add * 4 + 2;  // This is NOT a function call, should be 42
    return result;
}`,
        expected: 42,
        description: "Warning: Variables that shadow function names may confuse call detection",
        timeout: 25000
      },
      
      no_frame_pointer: {
        code: `int simple_add(int a, int b) {
    return a + b;  // Compiler might use registers only, no frame pointer
}

int main() {
    return simple_add(20, 22);
}`,
        expected: 42,
        description: "Warning: Simple functions might not generate expected assembly patterns",
        timeout: 25000
      },
      
      tail_call_optimization: {
        code: `int calculate(int x) {
    if (x <= 0) return 42;
    return calculate(x - 1);  // Might be optimized to jump instead of call+ret
}

int main() {
    return calculate(5);
}`,
        expected: 42,
        description: "Warning: Tail recursion might become jump, not call+ret",
        timeout: 25000
      },
      
      inline_assembly: {
        code: `int inline_asm_test(int x) {
    // Inline assembly might confuse pattern detection
    // Note: Simplified for TinyCC compatibility  
    return x + 1;
}

int main() {
    return inline_asm_test(41);
}`,
        expected: 42,
        description: "Warning: Inline assembly might confuse pattern detection",
        timeout: 25000
      },
      
      string_with_braces_complex: {
        code: `int complex_string_test(void) {
    volatile char template[] = "function test() { if (x > 0) { return {value: 42}; } }";
    // String with nested braces will completely break brace counting
    return 42;
}

int main() {
    return complex_string_test();
}`,
        expected: 42,
        description: "FAIL: Complex string with nested braces will break function boundary detection",
        timeout: 25000
      },
      
      comment_braces_nested: {
        code: `int nested_comment_test(void) {
    /* 
     * Outer comment with { brace
     * /* Inner comment { with } more braces } 
     * End outer comment with } brace
     */
    return 42;
}

int main() {
    return nested_comment_test();
}`,
        expected: 42,
        description: "FAIL: Nested comments with braces will break function boundary detection",
        timeout: 25000
      },
      
      weird_formatting_extreme: {
        code: `int
              extreme_formatting
                        (
        int               x,
                    int y
                                      )
{
            return
                  x
                      +
                          y;
}

int main() {
    return extreme_formatting(20, 22);
}`,
        expected: 42,
        description: "FAIL: Extreme formatting will break regex and line-based parsing",
        timeout: 25000
      },
      
      // Dynamic Validation Tests
      dynamic_complex_qualifiers: {
        code: `// DYNAMIC TEST CASE - Complex qualifiers and novel patterns

// Test 1: Deeply nested function qualifiers (novel pattern)
static const volatile inline unsigned int deeply_qualified_func(register int x) {
    return x + 123;
}

// Test 2: Function with completely unusual whitespace (novel pattern) 
int
        totally_weird_spacing
    (
        int    a,
    int b
)
{
return a * b;
}

// Test 3: Preprocessor nightmare (novel pattern)
#define RETURN_VAL 77
#define FUNC_NAME mystery_func
#define PARAM_TYPE int
PARAM_TYPE FUNC_NAME(PARAM_TYPE val) {
    return val + RETURN_VAL;
}

// Test 4: String and comment chaos (novel pattern)
int string_comment_nightmare(void) {
    char code[] = "/* fake comment */ int fake_func() { return 999; }";
    // Real comment with { fake braces } and more { braces }
    /* Multi-line comment with
       { even more fake braces }
       and function declarations: int another_fake(void); */
    return 333;
}

// Main function with completely novel calculation
int main() {
    // This calculation should be: 123 + 77 + 333 = 533
    // But let's make it more complex to test dynamic behavior
    int a = deeply_qualified_func(0);  // Should return 123
    int b = FUNC_NAME(0);              // Should return 77  
    int c = string_comment_nightmare(); // Should return 333
    return a + b + c;  // Should return 533
}`,
        expected: 533,
        description: "Dynamic validation: Complex qualifiers, preprocessor macros, and edge cases",
        timeout: 25000
      },
      
      dynamic_diverse_features: {
        code: `// Testing diverse C features and complex patterns for debugging

// Test 1: Inline function with multiple qualifiers and a small calculation
static inline const volatile int subtract_and_add(register int a, register int b) {
    return (a - b) + 99;
}

// Test 2: Function with inconsistent parentheses and odd spacing
int strange_parantheses_spacing(
          int x,      int y) 
{
    return x * y;
}

// Test 3: Complex preprocessor and macro usage
#define DIVIDE_BY 3
#define FUNC_NAME divide_and_return
#define ARG_TYPE int
ARG_TYPE FUNC_NAME(ARG_TYPE val) {
    return val / DIVIDE_BY;  // Using integer division
}

// Test 4: String manipulation inside a function with confusing comments
int string_manipulation_with_comments(void) {
    char text[] = "/* Actual comment inside string */ int hidden_func() { return 777; }";
    // Single-line comment with { multiple inconsistencies }
    /* Block comment with
       multiline content and
       random code snippets like int another_function(void); */
    return 555;
}

// Main function to execute all tests
int main() {
    // Combine results from various complex operations
    int result1 = subtract_and_add(50, 30);  // Should return 119 (50 - 30 + 99)
    int result2 = strange_parantheses_spacing(8, 4);  // Should return 32 (8 * 4)
    int result3 = divide_and_return(9);  // Should return 3 (9 / 3) using integer division
    int result4 = string_manipulation_with_comments();  // Should return 555
    
    return result1 + result2 + result3 + result4;  // Expected total: 119 + 32 + 3 + 555 = 709
}`,
        expected: 709,
        description: "Dynamic validation: Diverse C features and complex formatting patterns",
        timeout: 25000
      }
    };
    // Helper function to get timeout value from slider
    function getTimeoutValue() {
      const slider = document.getElementById('timeout-slider');
      return slider ? parseInt(slider.value) * 1000 : 20000; // Default 20 seconds
    }
    
    // Helper function to show status messages
    function showStatus(message, type = 'info') {
      console.log(`[${type.toUpperCase()}] ${message}`);
      // Update status in the UI if needed
      const statusElement = document.getElementById('compile-status');
      if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-${type}`;
      }
    }
    
    // Load test code into editor
    function loadTest(type) {
      if (tests[type] && sourceCodeEditor) {
        sourceCodeEditor.setValue(tests[type].code);
        
        // Show test info in test results area since we don't have separate input fields
        const testResultsDiv = document.getElementById('test-results');
        if (testResultsDiv) {
          testResultsDiv.textContent = `>> LOADED TEST: ${type}\n` +
            `Description: ${tests[type].description}\n` +
            `Expected Return Value: ${tests[type].expected}\n` +
            `Timeout: ${tests[type].timeout}ms\n\n` +
            `Ready to compile and test...`;
        }
        
        showStatus(`Loaded ${type} test`, 'success');
      }
    }
    
    // Update editor from dropdown selection
    function updateEditorFromDropdown(category) {
      const dropdown = document.getElementById(`${category}-test-dropdown`);
      const selectedTest = dropdown.value;
      
      if (selectedTest && tests[selectedTest]) {
        loadTest(selectedTest);
      }
    }
    
    // Run selected test from dropdown
    async function runSelectedTest(category) {
      const dropdown = document.getElementById(`${category}-test-dropdown`);
      const selectedTest = dropdown.value;
      
      if (!selectedTest) {
        showStatus('❌ Please select a test from the dropdown', 'error');
        return;
      }
      
      if (!tests[selectedTest]) {
        showStatus(`❌ Test "${selectedTest}" not found`, 'error');
        return;
      }
      
      loadTest(selectedTest);
      
      // Wait for editor to load, then run the test with predefined values
      setTimeout(async () => {
        const test = tests[selectedTest];
        const expectedValue = test.expected;
        const description = test.description || selectedTest;
        
        console.log(`🧪 Running selected test: ${selectedTest}`);
        console.log(`Expected: ${expectedValue}, Description: ${description}`);
        
        try {
          showStatus(`🧪 Running test: ${selectedTest}...`, 'processing');
          
          // Add test start to log
          const timestamp = new Date().toLocaleTimeString();
          const testResults = document.getElementById('test-results');
          if (testResults) {
            testResults.innerHTML += `\n[${timestamp}] 🧪 TEST: ${selectedTest}`;
            testResults.innerHTML += `\nExpected: ${expectedValue} | ${description}`;
            testResults.scrollTop = testResults.scrollHeight;
          }
          
          // Compile the code
          console.log('🔨 Compiling test code...');
          await new Promise((resolve, reject) => {
            try {
              quickCompileExact();
              setTimeout(resolve, 1000); // Wait for compilation
            } catch (error) {
              reject(error);
            }
          });
          
          // Execute and get result
          console.log('🚀 Executing test...');
          const actualValue = await executeCodeAndGetResult();
          
          // Check result
          const success = actualValue === expectedValue;
          console.log(`✅ Test completed. Expected: ${expectedValue}, Actual: ${actualValue}, Result: ${success ? 'PASSED' : 'FAILED'}`);
          
          if (testResults) {
            testResults.innerHTML += `\nActual: ${actualValue} | ${success ? '✅ PASSED' : '❌ FAILED'}`;
            testResults.innerHTML += `\n${'='.repeat(25)}\n`;
            testResults.scrollTop = testResults.scrollHeight;
          }
          
          showStatus(success ? '✅ Test PASSED' : '❌ Test FAILED', success ? 'success' : 'error');
          
        } catch (error) {
          console.error(`❌ Test execution error:`, error);
          showStatus(`❌ Test execution failed: ${error.message}`, 'error');
          
          const testResults = document.getElementById('test-results');
          if (testResults) {
            testResults.innerHTML += `\n❌ ERROR: ${error.message}`;
            testResults.innerHTML += `\n${'='.repeat(25)}\n`;
            testResults.scrollTop = testResults.scrollHeight;
          }
        }
      }, 100);
    }
    
    // Run custom test with user-provided expected value
    async function runCustomTest() {
      console.log('🎯 Starting custom test...');
      
      const expectedValueInput = document.getElementById('custom-expected-value');
      const testResults = document.getElementById('test-results');
      
      if (!expectedValueInput || !testResults) {
        console.error('❌ Required elements not found!');
        showStatus('❌ Error: Required elements not found', 'error');
        return;
      }
      
      const expectedValue = parseInt(expectedValueInput.value);
      if (isNaN(expectedValue)) {
        showStatus('❌ Please enter a valid expected value', 'error');
        return;
      }
      
      showStatus('🎯 Running custom test...', 'processing');
      
      // Add test start to log
      const timestamp = new Date().toLocaleTimeString();
      testResults.innerHTML += `\n[${timestamp}] 🎯 CUSTOM TEST STARTED`;
      testResults.innerHTML += `\nExpected Return Value: ${expectedValue}`;
      testResults.innerHTML += `\nRunning C Source Editor code...`;
      testResults.scrollTop = testResults.scrollHeight;
      
      try {
        // First compile the code
        console.log('🔨 Compiling custom test code...');
        await new Promise((resolve, reject) => {
          try {
            quickCompileExact();
            console.log('✅ Compilation initiated for custom test');
            setTimeout(resolve, 1000); // Wait for compilation
          } catch (error) {
            console.error('❌ Compilation failed for custom test:', error);
            reject(error);
          }
        });
        
        // Execute and get result
        console.log('🚀 Executing custom test...');
        const actualValue = await executeCodeAndGetResult();
        
        console.log(`✅ Custom test completed. Expected: ${expectedValue}, Actual: ${actualValue}`);
        
        // Check result
        const isPass = actualValue === expectedValue;
        const badge = isPass ? '<span class="badge badge-success">PASS</span>' : '<span class="badge badge-error">FAIL</span>';
        
        // Update test results
        testResults.innerHTML += `\nRESULT: Expected: ${expectedValue} | Actual: ${actualValue} ${badge}\n`;
        testResults.scrollTop = testResults.scrollHeight;
        
        if (isPass) {
          showStatus(`✅ Custom test PASSED (${actualValue})`, 'ready');
        } else {
          showStatus(`❌ Custom test FAILED - Expected: ${expectedValue}, Got: ${actualValue}`, 'error');
        }
        
      } catch (error) {
        console.error('❌ Custom test failed:', error);
        testResults.innerHTML += `\nERROR: ${error.message}\n`;
        testResults.scrollTop = testResults.scrollHeight;
        showStatus(`❌ Custom test FAILED: ${error.message}`, 'error');
      }
    }
    
    // Run all tests in a category
    async function runAllTestsInCategory(category) {
      console.log(`🧪 Starting runAllTestsInCategory for: ${category}`);
      
      const testResults = document.getElementById('test-results');
      if (!testResults) {
        console.error('❌ test-results element not found!');
        alert('Error: test-results element not found!');
        return;
      }
      
      const testsInCategory = testCategories[category];
      console.log(`Found tests in category ${category}:`, testsInCategory);
      
      if (!testsInCategory || testsInCategory.length === 0) {
        showStatus('❌ No tests found in this category', 'error');
        testResults.innerHTML += `\n❌ No tests found in category: ${category}`;
        return;
      }
      
      // All tests in category are valid now
      const validTests = testsInCategory;
      console.log(`Valid tests to run:`, validTests);
      
      window.totalTests = validTests.length;
      window.testProgress = 0;
      
      showStatus(`🧪 Running all ${category} tests...`, 'info');
      
      // Clear previous results and add header
      testResults.innerHTML = `>> RUNNING ${category.toUpperCase()} TESTS...\n${'='.repeat(30)}
🧪 ${category.toUpperCase()} TEST CATEGORY STARTED
${'='.repeat(30)}`;
      
      let passed = 0;
      let failed = 0;
      
      for (const testName of validTests) {
        console.log(`\n🧪 Running test: ${testName}`);
        
        try {
          window.testProgress++;
          updateTestProgress(window.testProgress, window.totalTests);
          
          showStatus(`🧪 Running ${category} test: ${testName}... (${window.testProgress}/${window.totalTests})`, 'info');
          
          const testData = tests[testName];
          if (!testData) {
            throw new Error(`Test ${testName} not found in tests object`);
          }
          
          console.log(`Test data for ${testName}:`, { 
            expected: testData.expected, 
            description: testData.description,
            codeLength: testData.code.length 
          });
          
          // Update test results immediately to show progress
          const timestamp = new Date().toLocaleTimeString();
          testResults.innerHTML += `\n[${timestamp}] 🧪 RUNNING: ${testName.toUpperCase()} - ${testData.description}`;
          testResults.scrollTop = testResults.scrollHeight;
          
          // Load test code
          if (sourceCodeEditor) {
            sourceCodeEditor.setValue(testData.code);
            console.log(`✅ Loaded test code into editor for ${testName}`);
          } else {
            console.warn(`⚠️ sourceCodeEditor not available for ${testName}`);
          }
          
          // Small delay to allow UI update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Compile the test code
          console.log(`🔨 Compiling ${testName}...`);
          await new Promise((resolve, reject) => {
            try {
              quickCompileExact();
              console.log(`✅ Compilation initiated for ${testName}`);
              setTimeout(resolve, 1000); // Wait longer for compilation
            } catch (error) {
              console.error(`❌ Compilation failed for ${testName}:`, error);
              reject(error);
            }
          });
          
          // Execute and get result with test-specific timeout
          console.log(`🚀 Executing ${testName}...`);
          const testTimeout = testData.timeout || getTimeoutValue();
          const actualValue = await executeCodeAndGetResult(testTimeout);
          
          console.log(`✅ Test ${testName} completed. Expected: ${testData.expected}, Actual: ${actualValue}`);
          
          // Check result
          const isPass = actualValue === testData.expected;
          const badge = isPass ? '<span class="badge badge-success">PASS</span>' : '<span class="badge badge-error">FAIL</span>';
          
          // Update the test result line
          testResults.innerHTML += `\nRESULT: Expected: ${testData.expected} | Actual: ${actualValue} ${badge}\n`;
          
          if (isPass) {
            passed++;
            console.log(`✅ ${testName} PASSED`);
          } else {
            failed++;
            console.log(`❌ ${testName} FAILED`);
          }
          
        } catch (error) {
          console.error(`❌ Test ${testName} failed with error:`, error);
          testResults.innerHTML += `\nRESULT: Expected: ${tests[testName]?.expected || 'N/A'} | Actual: ERROR - ${error.message} <span class="badge badge-error">FAIL</span>\n`;
          failed++;
        }
        
        testResults.scrollTop = testResults.scrollHeight;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Category summary
      const successRate = window.totalTests > 0 ? ((passed / window.totalTests) * 100).toFixed(1) : 0;
      const summaryBadge = failed === 0 ? '<span class="badge badge-success">ALL PASSED</span>' : '<span class="badge badge-warning">SOME FAILED</span>';
      
      testResults.innerHTML += `\n${'='.repeat(30)}
🧪 ${category.toUpperCase()} CATEGORY COMPLETED ${summaryBadge}
✅ Passed: ${passed} | ❌ Failed: ${failed} | 📊 Total: ${passed + failed}
📈 Success Rate: ${successRate}%
${'='.repeat(30)}`;
      testResults.scrollTop = testResults.scrollHeight;
      
      const overallStatus = failed === 0 ? 'success' : 'error';
      showStatus(`${category} tests completed: ${passed} passed, ${failed} failed (${successRate}% success)`, overallStatus);
      
      console.log(`🏁 Completed ${category} tests: ${passed} passed, ${failed} failed`);
    }
    
    // Run all test categories - with full UI updates
    async function runAllTestCategories() {
      console.log('🚀 Starting runAllTestCategories');
      showStatus('🚀 Running all test categories...', 'info');
      
      const testResults = document.getElementById('test-results');
      if (!testResults) {
        console.error('❌ test-results element not found!');
        alert('Error: test-results element not found!');
        return;
      }
      
      // Clear results and add header
      testResults.innerHTML = `🚀 RUNNING ALL TEST CATEGORIES
${'='.repeat(35)}`;
      
      const categories = Object.keys(testCategories);
      console.log('Categories to run:', categories);
      
      // Calculate total tests across all categories for progress bar
      let totalTestsAllCategories = 0;
      for (const category of categories) {
        totalTestsAllCategories += testCategories[category].length;
      }
      
      // Set up progress tracking
      window.totalTests = totalTestsAllCategories;
      window.testProgress = 0;
      
      let overallPassed = 0;
      let overallFailed = 0;
      
      for (const category of categories) {
        try {
          console.log(`\n📂 Starting category: ${category}`);
          
          // Add category header to results
          testResults.innerHTML += `\n\n${'='.repeat(25)}
📂 STARTING ${category.toUpperCase()} CATEGORY
${'='.repeat(25)}`;
          testResults.scrollTop = testResults.scrollHeight;
          
          // Get tests for this category
          const testsInCategory = testCategories[category];
          const validTests = testsInCategory;
          
          let categoryPassed = 0;
          //let categoryFailed = 0;
          
          //let categoryPassed = 0;
          let categoryFailed = 0;
          
          // Run each test in the category with full UI updates
          for (const testName of validTests) {
            console.log(`\n🧪 Running ${category}/${testName}`);
            
            try {
              const testData = tests[testName];
              if (!testData) {
                throw new Error(`Test ${testName} not found`);
              }
              
              // Update progress bar
              window.testProgress++;
              updateTestProgress(window.testProgress, window.totalTests);
              
              // Update status with progress
              showStatus(`🧪 Running ${category} test: ${testName}... (${window.testProgress}/${window.totalTests})`, 'info');
              
              // Update UI with current test
              const timestamp = new Date().toLocaleTimeString();
              testResults.innerHTML += `\n[${timestamp}] 🧪 RUNNING: ${testName.toUpperCase()} - ${testData.description}`;
              testResults.scrollTop = testResults.scrollHeight;
              
              // Load test code
              if (sourceCodeEditor) {
                sourceCodeEditor.setValue(testData.code);
              }
              
              // Small delay for UI update
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Compile
              console.log(`🔨 Compiling ${testName}...`);
              quickCompileExact();
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Execute
              console.log(`🚀 Executing ${testName}...`);
              const actualValue = await executeCodeAndGetResult(testData.timeout || 20000);
              
              // Check result
              const isPass = actualValue === testData.expected;
              const badge = isPass ? '<span class="badge badge-success">PASS</span>' : '<span class="badge badge-error">FAIL</span>';
              
              // Update results
              testResults.innerHTML += `\nRESULT: Expected: ${testData.expected} | Actual: ${actualValue} ${badge}\n`;
              testResults.scrollTop = testResults.scrollHeight;
              
              if (isPass) {
                categoryPassed++;
                overallPassed++;
              } else {
                categoryFailed++;
                overallFailed++;
              }
              
              console.log(`✅ ${testName} PASSED`);
              
            } catch (error) {
              console.error(`❌ Test ${testName} failed:`, error);
              
                  testResults.innerHTML += `\nRESULT: Expected: ${tests[testName]?.expected || 'N/A'} | Actual: ERROR - ${error.message} <span class="badge badge-error">FAIL</span>\n`;
              testResults.scrollTop = testResults.scrollHeight;
              
              categoryFailed++;
              overallFailed++;
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          // Category summary
          const categoryTotal = categoryPassed + categoryFailed;
          const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(1) : 0;
          const categorySummaryBadge = categoryFailed === 0 ? '<span class="badge badge-success">ALL PASSED</span>' : '<span class="badge badge-warning">SOME FAILED</span>';
          
          testResults.innerHTML += `\n${'='.repeat(25)}
📂 ${category.toUpperCase()} COMPLETED ${categorySummaryBadge}
✅ Passed: ${categoryPassed} | ❌ Failed: ${categoryFailed} | 📊 Total: ${categoryTotal}
📈 Success Rate: ${categoryRate}%
${'='.repeat(25)}`;
          testResults.scrollTop = testResults.scrollHeight;
          
          console.log(`🏁 ${category} completed: ${categoryPassed} passed, ${categoryFailed} failed`);
          
        } catch (error) {
          console.error(`❌ Error running ${category} category:`, error);
          
          testResults.innerHTML += `\n❌ ERROR in ${category.toUpperCase()} category: ${error.message}`;
          testResults.scrollTop = testResults.scrollHeight;
          
          overallFailed++; // Count category failure
        }
        
        // Delay between categories
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Final summary
      const overallTotal = overallPassed + overallFailed;
      const overallSuccessRate = overallTotal > 0 ? ((overallPassed / overallTotal) * 100).toFixed(1) : 0;
      const finalBadge = overallFailed === 0 ? '<span class="badge badge-success">ALL PASSED</span>' : '<span class="badge badge-warning">SOME FAILED</span>';
      
      testResults.innerHTML += `\n\n${'='.repeat(35)}
🏁 ALL CATEGORIES COMPLETED ${finalBadge}
✅ Total Passed: ${overallPassed} | ❌ Total Failed: ${overallFailed} | 📊 Total Tests: ${overallTotal}
📈 Overall Success Rate: ${overallSuccessRate}%
${'='.repeat(35)}`;
      testResults.scrollTop = testResults.scrollHeight;
      
      showStatus(`All tests completed: ${overallPassed} passed, ${overallFailed} failed (${overallSuccessRate}% success)`, 
                 overallFailed === 0 ? 'success' : 'error');
      
      console.log(`🏁 All categories completed: ${overallPassed} passed, ${overallFailed} failed`);
    }
    
    // Clear test results
    function clearTestResults() {
      document.getElementById('test-results').innerHTML = '<strong>>> TEST RESULTS WILL APPEAR HERE...</strong>';
    }
    
    // Update test progress
    function updateTestProgress(current, total) {
      const progressBar = document.getElementById('test-progress-bar');
      const progressContainer = document.getElementById('test-progress');
      
      if (total > 0) {
        const percentage = (current / total) * 100;
        progressBar.style.width = percentage + '%';
        progressContainer.style.display = 'block';
        
        if (current === total) {
          setTimeout(() => {
            progressContainer.style.display = 'none';
          }, 2000);
        }
      }
    }
    
    // Run single test (custom or loaded)
    async function runSingleTest() {
      console.log('🧪 Starting runSingleTest');
      
      const expectedValue = parseInt(document.getElementById('expected-value').value);
      const description = document.getElementById('test-description').value || 'Current code';
      
      console.log(`Test parameters: expected=${expectedValue}, description="${description}"`);
      
      if (isNaN(expectedValue)) {
        showStatus('❌ Please enter a valid expected return value', 'error');
        console.error('❌ Invalid expected value');
        return;
      }
      
      const testResults = document.getElementById('test-results');
      if (!testResults) {
        console.error('❌ test-results element not found!');
        alert('Error: test-results element not found!');
        return;
      }
      
      showStatus('🧪 Running single test...', 'info');
      
      try {
        console.log('🔨 Starting compilation...');
        // Compile the current code
        quickCompileExact();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait longer for compilation
        console.log('✅ Compilation completed');
        
        console.log('🚀 Starting test execution...');
        // Execute the code and get result with default timeout
        const actualValue = await executeCodeAndGetResult();
        console.log(`✅ Test execution completed. Result: ${actualValue}`);
        
        // Display test result
        const status = actualValue === expectedValue ? '✅ PASS' : '❌ FAIL';
        const timestamp = new Date().toLocaleTimeString();
        
        // Clear previous results and show new result
        testResults.innerHTML = `[${timestamp}] 🧪 Test: ${description}
Expected: ${expectedValue}
Actual: ${actualValue} (Return value after execution)
Status: ${status}
---`;
        testResults.scrollTop = testResults.scrollHeight;
        
        showStatus(`Test ${status === '✅ PASS' ? 'PASSED' : 'FAILED'}: ${description}`, 
                   status === '✅ PASS' ? 'success' : 'error');
        
        console.log(`🏁 Single test completed: ${status}`);
        
      } catch (error) {
        console.error('❌ Test execution failed:', error);
        
        const timestamp = new Date().toLocaleTimeString();
        testResults.innerHTML = `[${timestamp}] 🧪 Test: ${description}
Expected: ${expectedValue}
Actual: ERROR - ${error.message}
Status: ❌ FAIL
---`;
        testResults.scrollTop = testResults.scrollHeight;
        showStatus(`Test FAILED: ${error.message}`, 'error');
      }
    }
    
    // Core test execution function - uses existing "Run" button workflow
    async function executeCodeAndGetResult(timeoutMs = null) {
      if (timeoutMs === null) {
        timeoutMs = getTimeoutValue();
      }
      
      console.log(`🚀 executeCodeAndGetResult starting with timeout: ${timeoutMs}ms`);
      
      return new Promise((resolve, reject) => {
        let executionTimeout;
        let isCompleted = false;
        
        // Set up timeout to cancel execution if it takes too long
        executionTimeout = setTimeout(() => {
          if (!isCompleted) {
            isCompleted = true;
            console.error(`❌ Execution timeout after ${timeoutMs}ms`);
            // Stop any running execution
            if (unicornDebugger && unicornDebugger.isRunning) {
              console.log('🛑 Stopping execution due to timeout');
              unicornDebugger.stopExecution();
            }
            reject(new Error(`Execution timeout after ${timeoutMs}ms (possible infinite loop)`));
          }
        }, timeoutMs);
        
        try {
          // Step 1: Initialize debugger using existing button logic
          const runUnicornBtn = document.getElementById('runUnicorn');
          console.log(`🔍 runUnicorn button:`, { 
            exists: !!runUnicornBtn, 
            disabled: runUnicornBtn?.disabled,
            text: runUnicornBtn?.textContent 
          });
          
          if (!runUnicornBtn || runUnicornBtn.disabled) {
            isCompleted = true;
            clearTimeout(executionTimeout);
            console.error('❌ Debugger not available');
            reject(new Error('Debugger not available. Please compile code first.'));
            return;
          }
          
          // Initialize debugger by clicking the button
          console.log('🔧 Clicking runUnicorn button...');
          runUnicornBtn.click();
          
          // Step 2: Wait for debugger initialization and then run
          setTimeout(() => {
            if (isCompleted) return;
            
            console.log(`🔍 Debugger state:`, { 
              exists: !!unicornDebugger, 
              hasEngine: !!(unicornDebugger?.engine),
              isRunning: unicornDebugger?.isRunning 
            });
            
            if (!unicornDebugger || !unicornDebugger.engine) {
              isCompleted = true;
              clearTimeout(executionTimeout);
              console.error('❌ Debugger failed to initialize');
              reject(new Error('Debugger failed to initialize'));
              return;
            }
            
            // Step 3: Reset debugger to ensure clean state
            const resetBtn = document.getElementById('resetBtn');
            console.log(`🔄 Reset button:`, { 
              exists: !!resetBtn, 
              disabled: resetBtn?.disabled 
            });
            
            if (resetBtn && !resetBtn.disabled) {
              console.log('🔄 Clicking reset button...');
              resetBtn.click();
            }
            
            // Step 4: Run the program using existing "Run" button logic
            setTimeout(() => {
              if (isCompleted) return;
              
              const runBtn = document.getElementById('runBtn');
              console.log(`▶️ Run button:`, { 
                exists: !!runBtn, 
                disabled: runBtn?.disabled,
                display: runBtn?.style.display 
              });
              
              if (!runBtn || runBtn.disabled) {
                isCompleted = true;
                clearTimeout(executionTimeout);
                console.error('❌ Run button not available');
                reject(new Error('Run button not available'));
                return;
              }
              
              // Set up completion detection by monitoring debugger state
              let checkCount = 0;
              const checkCompletion = () => {
                if (isCompleted) return;
                checkCount++;
                
                if (checkCount % 20 === 0) { // Log every second (20 * 50ms)
                  console.log(`⏱️ Checking completion (${checkCount}): isRunning=${unicornDebugger?.isRunning}`);
                }
                
                try {
                  // Check if debugger is still running
                  if (unicornDebugger.isRunning) {
                    // Still running, check again in a bit
                    setTimeout(checkCompletion, 50);
                    return;
                  }
                  
                  console.log('✅ Execution completed, reading return value...');
                  
                  // Execution completed, get return value
                  const returnValue = unicornDebugger.is64bit ? 
                    Number(unicornDebugger.engine.reg_read_i64(UnicornModule.X86_REG_RAX)) :
                    unicornDebugger.engine.reg_read_i32(UnicornModule.X86_REG_EAX);
                  
                  console.log(`✅ Return value: ${returnValue}`);
                  
                  isCompleted = true;
                  clearTimeout(executionTimeout);
                  resolve(returnValue);
                  
                } catch (error) {
                  // If we can't read registers, execution might have failed
                  if (!isCompleted) {
                    console.error('❌ Failed to get return value:', error);
                    isCompleted = true;
                    clearTimeout(executionTimeout);
                    reject(new Error(`Failed to get return value: ${error.message}`));
                  }
                }
              };
              
              // Click run button and start monitoring
              console.log('▶️ Clicking run button...');
              runBtn.click();
              
              // Start checking for completion
              setTimeout(checkCompletion, 100);
              
            }, 200); // Wait for reset to complete
            
          }, 500); // Wait for debugger initialization
          
        } catch (error) {
          if (!isCompleted) {
            console.error('❌ Setup failed:', error);
            isCompleted = true;
            clearTimeout(executionTimeout);
            reject(new Error(`Setup failed: ${error.message}`));
          }
        }
      });
    }
    
    // ============================================================================
    // END TESTING FRAMEWORK FUNCTIONS
    // ============================================================================