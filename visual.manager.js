module.exports = {
    run: function(room) {
        // Larger dashboard position in top right
        const dashX = 35;  // Moved more to the left
        const dashY = 1;
        const lineHeight = 1.3;  // Increased line height
        const padding = 0.5;

        // Get all necessary data
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(!spawn) return;
        
        const creeps = room.find(FIND_MY_CREEPS);
        const creepCounts = _.countBy(creeps, c => c.memory.role);
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        const extensions = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        });

        // Calculate dashboard size based on content
        const extensionSites = sites.filter(s => s.structureType === STRUCTURE_EXTENSION);
        const numLines = 5 + (extensionSites.length > 0 ? extensionSites.length + 1 : 0);
        
        // Draw larger dashboard background with more opacity
        room.visual.rect(dashX - padding, dashY - padding, 25, (numLines * lineHeight) + padding, {
            fill: '#000000',
            opacity: 0.7,
            stroke: '#ffffff',
            strokeWidth: 0.05
        });

        // Main Stats - Larger text
        room.visual.text(
            `🏰 RCL ${room.controller.level}: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`,
            dashX, dashY,
            {align: 'left', color: '#ffff00', font: 0.8}
        );

        room.visual.text(
            `⚡ ${room.energyAvailable}/${room.energyCapacityAvailable} (${Math.floor((room.energyAvailable/room.energyCapacityAvailable) * 100)}%)`,
            dashX, dashY + lineHeight,
            {align: 'left', color: '#ffaa00', font: 0.8}
        );

        room.visual.text(
            `👷 Creeps: H:${creepCounts.harvester || 0}/4 U:${creepCounts.upgrader || 0}/2 B:${creepCounts.builder || 0}/3`,
            dashX, dashY + lineHeight * 2,
            {align: 'left', color: '#ffffff', font: 0.8}
        );

        // Construction Progress Section
        if(sites.length > 0) {
            room.visual.text(
                `🏗️ Construction Progress:`,
                dashX, dashY + lineHeight * 3,
                {align: 'left', color: '#ffaa00', font: 0.8}
            );

            // Extension Progress
            const extensionNames = ['Bethesda', 'Silver Spring', 'Gaithersburg', 'Bowie', 'Hagerstown'];
            extensionSites.forEach((site, index) => {
                const name = extensionNames[extensions.length + index] || `Extension${extensions.length + index + 1}`;
                const progress = Math.floor((site.progress/site.progressTotal) * 100);
                const progressBar = this.getProgressBar(progress);
                
                room.visual.text(
                    `${name}: ${progressBar} ${progress}%`,
                    dashX + 1, dashY + lineHeight * (4 + index),
                    {align: 'left', color: '#ffffff', font: 0.7}
                );
            });

            // Tower Progress if any
            const towerSite = sites.find(s => s.structureType === STRUCTURE_TOWER);
            if(towerSite) {
                const towerProgress = Math.floor((towerSite.progress/towerSite.progressTotal) * 100);
                const towerBar = this.getProgressBar(towerProgress);
                room.visual.text(
                    `Tower: ${towerBar} ${towerProgress}%`,
                    dashX + 1, dashY + lineHeight * (4 + extensionSites.length),
                    {align: 'left', color: '#ff0000', font: 0.7}
                );
            }
        }

        // CPU Usage at bottom
        room.visual.text(
            `🔄 CPU: ${Game.cpu.getUsed().toFixed(1)}/${Game.cpu.limit}`,
            dashX, dashY + lineHeight * (numLines - 0.5),
            {align: 'left', color: '#00ff00', font: 0.7}
        );
    },

    getProgressBar: function(percentage) {
        const width = 10;
        const filled = Math.floor((percentage / 100) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '▒'.repeat(empty);
    },

    // Keep your existing displayStructureLabels and displayConstructionProgress methods
}; 