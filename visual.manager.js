module.exports = {
    run: function(room) {
        // Move dashboard to right side of screen
        const dashX = 35;  // Adjusted to right side
        const dashY = 2;   // Keep near top
        const lineHeight = 1.2;
        const padding = 0.5;
        const boxWidth = 25;

        // Draw dashboard background in right position
        room.visual.rect(dashX, dashY, boxWidth, 8, {
            fill: '#000000',
            opacity: 0.7,
            stroke: '#ffffff',
            strokeWidth: 0.05
        });

        // Center text within box on right side
        const textX = dashX + (boxWidth/2);
        
        // Performance Metrics Header
        room.visual.text(
            `📊 Performance Metrics:`,
            textX, dashY + 0.8,
            {align: 'center', color: '#00ff00', font: 0.8}
        );

        // Metrics content
        room.visual.text(
            `Upgrade Rate: ${room.controller.progress}/tick`,
            textX, dashY + 2,
            {align: 'center', color: '#ffffff', font: 0.7}
        );

        room.visual.text(
            `CPU Efficiency: ${(Game.cpu.getUsed() * 100 / Game.cpu.limit).toFixed(1)}%`,
            textX, dashY + 3.2,
            {align: 'center', color: '#ffffff', font: 0.7}
        );
    }
}; 