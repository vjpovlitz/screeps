const chokidar = require('chokidar');
const { execSync } = require('child_process');

// Initialize watcher
const watcher = chokidar.watch('.', {
    ignored: [/(^|[\/\\])\../, 'node_modules', 'package-lock.json'],
    persistent: true
});

console.log('Starting file watcher...');

// Add event listeners
watcher.on('change', path => {
    try {
        console.log(`File ${path} changed. Pushing to GitHub...`);
        execSync('git add .');
        execSync(`git commit -m "Auto-update: ${path}"`);
        execSync('git push origin main');
        console.log('Changes pushed successfully!');
    } catch (error) {
        console.error('Error pushing changes:', error.message);
    }
}); 