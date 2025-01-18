module.exports = {
    run: function(room) {
        // Main dashboard
        const dashX = 35;
        const dashY = 1;
        const lineHeight = 1.2;
        const padding = 0.5;
        const boxWidth = 16;

        // Draw main dashboard background - increased height
        room.visual.rect(dashX, dashY, boxWidth, 9, {  // Increased height
            fill: '#000000',
            opacity: 0.7,
            stroke: '#ffffff',
            strokeWidth: 0.05
        });

        // Center text within box
        const textX = dashX + (boxWidth/2);
        
        // Main stats with adjusted spacing
        room.visual.text(
            `🏰 RCL ${room.controller.level}: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`,
            textX, dashY + 1,  // Adjusted spacing
            {align: 'center', color: '#ffff00', font: 0.7}
        );

        room.visual.text(
            `⚡ ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            textX, dashY + 2.2,  // Adjusted spacing
            {align: 'center', color: '#ffaa00', font: 0.7}
        );

        // Creep counts
        const creeps = room.find(FIND_MY_CREEPS);
        const creepCounts = _.countBy(creeps, c => c.memory.role);
        room.visual.text(
            `👷 H:${creepCounts.harvester || 0}/4 U:${creepCounts.upgrader || 0}/2 B:${creepCounts.builder || 0}/3`,
            textX, dashY + 3.4,  // Adjusted spacing
            {align: 'center', color: '#ffffff', font: 0.7}
        );

        // Construction progress
        room.visual.text(
            `🏗️ Construction Progress:`,
            textX, dashY + 4.6,
            {align: 'center', color: '#ffaa00', font: 0.7}
        );

        // Progress bars
        let lineOffset = 5.8;
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
                {align: 'center', color: '#ffffff', font: 0.6}
            );
            lineOffset += 1.2;
        });

        // Performance Metrics box - more compact and centered
        const perfX = 35;
        const perfY = 15;
        const perfWidth = 14;  // Smaller width
        
        // Draw performance metrics background
        room.visual.rect(perfX, perfY, perfWidth, 4, {
            fill: '#000000',
            opacity: 0.7,
            stroke: '#ffffff',
            strokeWidth: 0.05
        });

        // Center performance metrics text
        const perfTextX = perfX + (perfWidth/2);
        
        room.visual.text(
            `📊 Performance Metrics:`,
            perfTextX, perfY + 0.8,
            {align: 'center', color: '#00ff00', font: 0.7}
        );

        room.visual.text(
            `Upgrade Rate: ${room.controller.progress}/tick`,
            perfTextX, perfY + 1.8,
            {align: 'center', color: '#ffffff', font: 0.6}
        );

        room.visual.text(
            `CPU Efficiency: ${(Game.cpu.getUsed() * 100 / Game.cpu.limit).toFixed(1)}%`,
            perfTextX, perfY + 2.8,
            {align: 'center', color: '#ffffff', font: 0.6}
        );

        room.visual.text(
            `⚠️ PRIORITY: Build Towers for Defense!`,
            perfTextX, perfY + 3.8,
            {align: 'center', color: '#ff0000', font: 0.7}
        );

        // Add creep status visualization
        room.find(FIND_MY_CREEPS).forEach(creep => {
            let statusText = `${creep.name} (${creep.memory.role})`;
            let actionText = '';
            
            // Determine action text based on creep memory and state
            if(creep.memory.building) {
                const target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                actionText = target ? `🏗️ Building ${target.structureType}` : '🔍 Seeking site';
            } else if(creep.memory.upgrading) {
                actionText = '⚡ Upgrading';
            } else if(creep.store.getFreeCapacity() > 0) {
                actionText = '📥 Harvesting';
            } else {
                actionText = '📦 Full';
            }

            // Draw status above creep
            room.visual.text(
                statusText,
                creep.pos.x, creep.pos.y - 0.8,
                {color: '#ffffff', font: 0.4, stroke: '#000000', strokeWidth: 0.2}
            );
            
            room.visual.text(
                actionText,
                creep.pos.x, creep.pos.y - 0.4,
                {color: '#ffff00', font: 0.3, stroke: '#000000', strokeWidth: 0.2}
            );
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
        const width = 8;  // Shorter progress bar
        const filled = Math.floor((percentage / 100) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '▒'.repeat(empty);
    }
}; 