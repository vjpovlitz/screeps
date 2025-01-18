module.exports = {
    run: function(room) {
        const dashX = 2;  // X position of dashboard
        const dashY = 2;  // Y position of dashboard
        const lineHeight = 1.2;  // Space between lines
        const padding = 1;
        const boxWidth = 25;  // Width of the dashboard box

        // Calculate dashboard size including all construction types
        const numConstructionTypes = 3; // road, extension, container
        const numLines = 5 + numConstructionTypes;
        
        // Draw dashboard background
        room.visual.rect(dashX - padding, dashY - padding, boxWidth, (numLines * lineHeight) + padding, {
            fill: '#000000',
            opacity: 0.7,
            stroke: '#ffffff',
            strokeWidth: 0.05
        });

        // Main Stats - Centered
        room.visual.text(
            `🏰 RCL ${room.controller.level}: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`,
            dashX + (boxWidth/2), dashY,
            {align: 'center', color: '#ffff00', font: 0.8}
        );

        room.visual.text(
            `⚡ ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            dashX + (boxWidth/2), dashY + lineHeight,
            {align: 'center', color: '#ffaa00', font: 0.8}
        );

        // Creep counts - Centered
        const creeps = room.find(FIND_MY_CREEPS);
        const creepCounts = _.countBy(creeps, c => c.memory.role);
        room.visual.text(
            `👷 H:${creepCounts.harvester || 0}/4 U:${creepCounts.upgrader || 0}/2 B:${creepCounts.builder || 0}/3`,
            dashX + (boxWidth/2), dashY + lineHeight * 2,
            {align: 'center', color: '#ffffff', font: 0.8}
        );

        // Construction Progress Header - Centered
        room.visual.text(
            `🏗️ Construction Progress:`,
            dashX + (boxWidth/2), dashY + lineHeight * 3,
            {align: 'center', color: '#ffaa00', font: 0.8}
        );

        // Construction Progress Bars - Centered text with left-aligned bars
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        const constructionByType = _.groupBy(sites, site => site.structureType);
        let lineOffset = 4;

        const typeIcons = {
            road: '🛣️',
            extension: '🔌',
            container: '📦'
        };

        Object.entries(constructionByType).forEach(([type, sites]) => {
            const progress = sites.reduce((sum, site) => sum + site.progress, 0);
            const total = sites.reduce((sum, site) => sum + site.progressTotal, 0);
            const percentage = Math.floor((progress / total) * 100);
            const icon = typeIcons[type] || '🏗️';
            
            // Center the progress bar and text
            const progressBar = this.getProgressBar(percentage);
            const text = `${icon} ${type}: ${progressBar} ${percentage}%`;
            
            room.visual.text(
                text,
                dashX + (boxWidth/2), dashY + lineHeight * lineOffset++,
                {align: 'center', color: '#ffffff', font: 0.7}
            );
        });

        // Performance Metrics Header - Centered
        room.visual.text(
            `📊 Performance Metrics:`,
            dashX + (boxWidth/2), dashY + lineHeight * (lineOffset + 1),
            {align: 'center', color: '#00ff00', font: 0.8}
        );

        // Performance Metrics - Centered
        room.visual.text(
            `Upgrade Rate: ${room.controller.progress}/tick`,
            dashX + (boxWidth/2), dashY + lineHeight * (lineOffset + 2),
            {align: 'center', color: '#ffffff', font: 0.7}
        );

        room.visual.text(
            `CPU Efficiency: ${(Game.cpu.getUsed() * 100 / Game.cpu.limit).toFixed(1)}%`,
            dashX + (boxWidth/2), dashY + lineHeight * (lineOffset + 3),
            {align: 'center', color: '#ffffff', font: 0.7}
        );
    },

    getProgressBar: function(percentage) {
        const width = 10;
        const filled = Math.floor((percentage / 100) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '▒'.repeat(empty);
    }
}; 