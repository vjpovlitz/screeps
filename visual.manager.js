module.exports = {
    run: function(room) {
        const dashX = 35;  // Moved to right side
        const dashY = 1;   // Keep at top
        const lineHeight = 1.2;
        const padding = 0.5;
        const boxWidth = 20;  // Reduced width by 20%

        // Draw dashboard background
        room.visual.rect(dashX, dashY, boxWidth, 8, {
            fill: '#000000',
            opacity: 0.7,
            stroke: '#ffffff',
            strokeWidth: 0.05
        });

        // Center text within smaller box
        const textX = dashX + (boxWidth/2);
        
        // RCL and Energy
        room.visual.text(
            `🏰 RCL ${room.controller.level}: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`,
            textX, dashY + 0.8,
            {align: 'center', color: '#ffff00', font: 0.8}
        );

        room.visual.text(
            `⚡ ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            textX, dashY + 2,
            {align: 'center', color: '#ffaa00', font: 0.8}
        );

        // Creep counts
        const creeps = room.find(FIND_MY_CREEPS);
        const creepCounts = _.countBy(creeps, c => c.memory.role);
        room.visual.text(
            `👷 H:${creepCounts.harvester || 0}/4 U:${creepCounts.upgrader || 0}/2 B:${creepCounts.builder || 0}/3`,
            textX, dashY + 3.2,
            {align: 'center', color: '#ffffff', font: 0.8}
        );

        // Construction Progress header
        room.visual.text(
            `🏗️ Construction Progress:`,
            textX, dashY + 4.4,
            {align: 'center', color: '#ffaa00', font: 0.8}
        );

        // Construction progress bars
        let lineOffset = 5.6;
        ['road', 'extension', 'container'].forEach(type => {
            const sites = room.find(FIND_CONSTRUCTION_SITES, {
                filter: site => site.structureType === type
            });
            const progress = sites.reduce((sum, site) => sum + site.progress, 0);
            const total = sites.reduce((sum, site) => sum + site.progressTotal, 0) || 1;
            const percentage = Math.floor((progress / total) * 100);
            
            room.visual.text(
                `${this.getTypeIcon(type)} ${type}: ${this.getProgressBar(percentage)} ${percentage}%`,
                textX, dashY + lineOffset,
                {align: 'center', color: '#ffffff', font: 0.7}
            );
            lineOffset += 1.2;
        });
    },

    getTypeIcon: function(type) {
        const icons = {
            road: '🛣️',
            extension: '🔌',
            container: '📦'
        };
        return icons[type] || '🏗️';
    },

    getProgressBar: function(percentage) {
        const width = 10;
        const filled = Math.floor((percentage / 100) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '▒'.repeat(empty);
    }
}; 