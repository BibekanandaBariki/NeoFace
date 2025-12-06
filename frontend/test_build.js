const { exec } = require('child_process');
const path = require('path');

console.log('Testing frontend build...');

exec('npm run build', { cwd: path.join(__dirname) }, (error, stdout, stderr) => {
    if (error) {
        console.error('Build failed:');
        console.error(stderr);
        process.exit(1);
    }
    
    console.log('Build output:');
    console.log(stdout);
    
    if (stderr) {
        console.log('Build warnings:');
        console.log(stderr);
    }
    
    console.log('✅ Frontend build completed successfully!');
});