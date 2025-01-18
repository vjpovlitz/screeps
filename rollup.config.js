import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import screeps from 'rollup-plugin-screeps';

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
        screeps({
            config: {
                token: "your-token-here",
                branch: "default",
                email: "your-email@example.com",
                ptr: false
            },
        })
    ]
}; 