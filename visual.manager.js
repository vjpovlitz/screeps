module.exports = {
    run: function(room) {
        // Dashboard position in top right
        const dashX = 45;
        const dashY = 1;
        const lineHeight = 1.2;

        // Draw dashboard background
        room.visual.rect(dashX - 1, dashY - 1, 15, 8, {
            fill: '#000000',
            opacity: 0.5,
            stroke: '#ffffff'
        });

        // Room Status Dashboard
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
            `RCL ${room.controller.level}: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`,
            dashX, dashY,
            {align: 'left', color: '#ffff00'}
        );

        room.visual.text(
            `⚡ ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            dashX, dashY + lineHeight,
            {align: 'left', color: '#ffaa00'}
        );

        room.visual.text(
            `👷 H:${creepCounts.harvester || 0}/${4} U:${creepCounts.upgrader || 0}/${2} B:${creepCounts.builder || 0}/${3}`,
            dashX, dashY + lineHeight * 2,
            {align: 'left', color: '#ffffff'}
        );

        // Show active construction
        if(buildingSites.length > 0) {
            const prioritySite = buildingSites[0];
            room.visual.text(
                `🏗️ ${prioritySite.structureType}: ${Math.floor((prioritySite.progress/prioritySite.progressTotal) * 100)}%`,
                dashX, dashY + lineHeight * 3,
                {align: 'left', color: '#ffaa00'}
            );
        }

        // Show creep capacity
        room.visual.text(
            `🤖 Creeps: ${creeps.length}/10`,
            dashX, dashY + lineHeight * 4,
            {align: 'left', color: '#00ff00'}
        );
    }
}; 