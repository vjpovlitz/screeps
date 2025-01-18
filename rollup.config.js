import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import screeps from 'rollup-plugin-screeps';

// Load Screeps credentials from .screeps.json
let credentials;
try {
    credentials = require('./.screeps.json');
} catch (err) {
    console.error("No .screeps.json found! Please create it with your credentials.");
    process.exit(1);
}

export default {
    input: 'main.js',
    output: {
        file: 'dist/main.js',
        format: 'cjs',
        exports: 'auto'
    },
    plugins: [
        resolve(),
        commonjs(),
        screeps({config: credentials})
    ]
}; 