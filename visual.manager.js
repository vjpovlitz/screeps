module.exports = {
    run: function(room) {
        // Dashboard position in top right
        const dashX = 45;  // Adjust these coordinates as needed
        const dashY = 2;
        const lineHeight = 1.2;

        // Draw dashboard background
        room.visual.rect(dashX - 1, dashY - 1, 15, 8, {
            fill: '#000000',
            opacity: 0.5,
            stroke: '#ffffff'
        });

        // Room Status Dashboard
        this.displayDashboard(room, dashX, dashY, lineHeight);
        
        // Display other visuals (sources, spawns, etc.)
        this.displayStructureLabels(room);
        
        // Display construction progress (but not individual roads)
        this.displayConstructionProgress(room);
    },

    displayDashboard: function(room, x, y, lineHeight) {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(!spawn) return;

        // Count creeps by role
        const creeps = room.find(FIND_MY_CREEPS);
        const creepCounts = _.countBy(creeps, c => c.memory.role);
        
        // Get construction sites (excluding roads for count)
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        const buildingSites = _.filter(sites, s => s.structureType !== STRUCTURE_ROAD);

        // Dashboard Content
        room.visual.text(
            `🏰 RCL ${room.controller.level} (${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%)`,
            x, y,
            {align: 'left', color: '#ffff00'}
        );

        room.visual.text(
            `⚡ ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            x, y + lineHeight,
            {align: 'left', color: '#ffaa00'}
        );

        room.visual.text(
            `👷 H:${creepCounts.harvester || 0} U:${creepCounts.upgrader || 0} B:${creepCounts.builder || 0}`,
            x, y + lineHeight * 2,
            {align: 'left', color: '#ffffff'}
        );

        room.visual.text(
            `🏗️ Sites: ${buildingSites.length}`,
            x, y + lineHeight * 3,
            {align: 'left', color: '#ffaa00'}
        );

        // CPU Usage
        room.visual.text(
            `🔄 CPU: ${Game.cpu.getUsed().toFixed(1)}`,
            x, y + lineHeight * 4,
            {align: 'left', color: '#00ff00'}
        );
    },

    displayStructureLabels: function(room) {
        // Show Maryland city names at sources
        const sources = room.find(FIND_SOURCES);
        sources.forEach((source, index) => {
            const name = index === 0 ? 'Baltimore' : 'Frederick';
            room.visual.text(
                `⚡ ${name}`,
                source.pos.x, source.pos.y - 1,
                {color: '#ffaa00', stroke: '#000000', strokeWidth: 0.2, font: 0.7}
            );
        });

        // Show spawn name
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(spawn) {
            room.visual.text(
                '🏛️ Annapolis',
                spawn.pos.x, spawn.pos.y - 1,
                {color: '#ffffff', stroke: '#000000', strokeWidth: 0.2, font: 0.7}
            );
        }
    },

    displayConstructionProgress: function(room) {
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        const significantSites = _.filter(sites, s => 
            s.structureType !== STRUCTURE_ROAD || 
            s.progress > s.progressTotal * 0.5
        );

        significantSites.forEach(site => {
            if(site.structureType === STRUCTURE_EXTENSION) {
                const extensionNames = ['Bethesda', 'Silver Spring', 'Gaithersburg', 'Bowie', 'Hagerstown'];
                const name = extensionNames[site.id % extensionNames.length];
                if(site.progress > 0) {
                    room.visual.text(
                        `${name}: ${Math.floor((site.progress/site.progressTotal) * 100)}%`,
                        site.pos.x, site.pos.y - 0.5,
                        {color: '#ffffff', font: 0.4}
                    );
                }
            } else if(site.structureType === STRUCTURE_TOWER) {
                room.visual.text(
                    `Tower: ${Math.floor((site.progress/site.progressTotal) * 100)}%`,
                    site.pos.x, site.pos.y - 0.5,
                    {color: '#ff0000', font: 0.4}
                );
            }
        });
    }
}; 