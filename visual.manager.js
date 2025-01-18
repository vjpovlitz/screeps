module.exports = {
    run: function(room) {
        const dashX = 35;
        const dashY = 1;
        const lineHeight = 1.3;
        const padding = 0.5;

        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(!spawn) return;
        
        const creeps = room.find(FIND_MY_CREEPS);
        const creepCounts = _.countBy(creeps, c => c.memory.role);
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        
        // Group construction sites by type
        const constructionByType = _.groupBy(sites, 'structureType');
        
        // Calculate dashboard size including all construction types
        const numConstructionTypes = Object.keys(constructionByType).length;
        const numLines = 5 + numConstructionTypes;
        
        // Draw dashboard background
        room.visual.rect(dashX - padding, dashY - padding, 25, (numLines * lineHeight) + padding, {
            fill: '#000000',
            opacity: 0.7,
            stroke: '#ffffff',
            strokeWidth: 0.05
        });

        // Main Stats
        room.visual.text(
            `🏰 RCL ${room.controller.level}: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`,
            dashX, dashY,
            {align: 'left', color: '#ffff00', font: 0.8}
        );

        room.visual.text(
            `⚡ ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            dashX, dashY + lineHeight,
            {align: 'left', color: '#ffaa00', font: 0.8}
        );

        room.visual.text(
            `👷 H:${creepCounts.harvester || 0}/4 U:${creepCounts.upgrader || 0}/2 B:${creepCounts.builder || 0}/3`,
            dashX, dashY + lineHeight * 2,
            {align: 'left', color: '#ffffff', font: 0.8}
        );

        // Construction Progress Section
        let lineOffset = 3;
        if(sites.length > 0) {
            room.visual.text(
                `🏗️ Construction Progress:`,
                dashX, dashY + lineHeight * lineOffset++,
                {align: 'left', color: '#ffaa00', font: 0.8}
            );

            // Show all construction types with progress bars
            const typeIcons = {
                extension: '🔌',
                tower: '🗼',
                container: '📦',
                road: '🛣️',
                spawn: '🏠',
                storage: '🏪'
            };

            Object.entries(constructionByType).forEach(([type, sites]) => {
                const progress = sites.reduce((sum, site) => sum + site.progress, 0);
                const total = sites.reduce((sum, site) => sum + site.progressTotal, 0);
                const percentage = Math.floor((progress / total) * 100);
                const icon = typeIcons[type] || '🏗️';
                
                room.visual.text(
                    `${icon} ${type}: ${this.getProgressBar(percentage)} ${percentage}%`,
                    dashX + 1, dashY + lineHeight * lineOffset++,
                    {align: 'left', color: '#ffffff', font: 0.7}
                );
            });
        }

        // Performance metrics at the bottom
        this.displayPerformanceMetrics(room, dashX, dashY + lineHeight * (lineOffset + 1));
    },

    displayPerformanceMetrics: function(room, dashX, dashY) {
        const cpu = Game.cpu.getUsed();
        const cpuLimit = Game.cpu.limit;
        const cpuPercentage = ((cpu / cpuLimit) * 100).toFixed(1);
        
        // Get upgrade rate from memory stats
        const upgradeRate = Memory.stats && Memory.stats.rooms[room.name] 
            ? Memory.stats.rooms[room.name].upgradeRate.toFixed(2)
            : '0.00';

        room.visual.text(
            `📈 Performance Metrics:`,
            dashX, dashY,
            {align: 'left', color: '#00ff00', font: 0.8}
        );

        room.visual.text(
            `Upgrade Rate: ${upgradeRate}/tick`,
            dashX, dashY + 1.2,
            {align: 'left', color: '#ffffff', font: 0.7}
        );

        room.visual.text(
            `CPU: ${cpu.toFixed(1)}/${cpuLimit} (${cpuPercentage}%)`,
            dashX, dashY + 2.4,
            {align: 'left', color: '#00ff00', font: 0.7}
        );
    },

    getProgressBar: function(percentage) {
        const width = 10;
        const filled = Math.floor((percentage / 100) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '▒'.repeat(empty);
    }
}; 