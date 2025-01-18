module.exports = {
    run: function(room) {
        const dashX = 1;  // Adjusted X position
        const dashY = 1;  // Adjusted Y position
        const lineHeight = 1.2;
        const padding = 0.5;
        const boxWidth = 25;

        // Draw dashboard background in original position
        room.visual.rect(dashX, dashY, boxWidth, 8, {
            fill: '#000000',
            opacity: 0.7,
            stroke: '#ffffff',
            strokeWidth: 0.05
        });

        // Center text within existing box
        const textX = dashX + (boxWidth/2);
        
        // Rest of your visualization code with centered text positions
        room.visual.text(
            `🏰 RCL ${room.controller.level}: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`,
            textX, dashY + 0.5,
            {align: 'center', color: '#ffff00', font: 0.8}
        );

        room.visual.text(
            `⚡ ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            textX, dashY + lineHeight,
            {align: 'center', color: '#ffaa00', font: 0.8}
        );

        // Creep counts - Centered
        const creeps = room.find(FIND_MY_CREEPS);
        const creepCounts = _.countBy(creeps, c => c.memory.role);
        room.visual.text(
            `👷 H:${creepCounts.harvester || 0}/4 U:${creepCounts.upgrader || 0}/2 B:${creepCounts.builder || 0}/3`,
            textX, dashY + lineHeight * 2,
            {align: 'center', color: '#ffffff', font: 0.8}
        );

        // Construction Progress Header - Centered
        room.visual.text(
            `🏗️ Construction Progress:`,
            textX, dashY + lineHeight * 3,
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
                textX, dashY + lineHeight * lineOffset++,
                {align: 'center', color: '#ffffff', font: 0.7}
            );
        });

        // Performance Metrics Header - Centered
        room.visual.text(
            `📊 Performance Metrics:`,
            textX, dashY + lineHeight * (lineOffset + 1),
            {align: 'center', color: '#00ff00', font: 0.8}
        );

        // Performance Metrics - Centered
        room.visual.text(
            `Upgrade Rate: ${room.controller.progress}/tick`,
            textX, dashY + lineHeight * (lineOffset + 2),
            {align: 'center', color: '#ffffff', font: 0.7}
        );

        room.visual.text(
            `CPU Efficiency: ${(Game.cpu.getUsed() * 100 / Game.cpu.limit).toFixed(1)}%`,
            textX, dashY + lineHeight * (lineOffset + 3),
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