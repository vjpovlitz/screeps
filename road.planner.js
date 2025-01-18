module.exports = {
    run: function(room) {
        // Only run road planning every 100 ticks to save CPU
        if (Game.time % 100 !== 0) return;

        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;

        // Find all important destinations
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;
        
        // Plan and build roads from spawn to each source
        sources.forEach(source => {
            this.planRoad(room, spawn.pos, source.pos, '#ffffff');
        });

        // Plan and build road to controller
        if (controller) {
            this.planRoad(room, spawn.pos, controller.pos, '#ffaa00');
        }

        // Plan roads between sources for efficiency
        if (sources.length >= 2) {
            this.planRoad(room, sources[0].pos, sources[1].pos, '#ffffff');
        }
    },

    planRoad: function(room, fromPos, toPos, visualColor) {
        // Find path, avoiding swamps when possible
        const path = room.findPath(fromPos, toPos, {
            ignoreCreeps: true,
            swampCost: 5,
            plainCost: 2,
            ignoreRoads: true,
        });

        // Visualize the planned path
        room.visual.poly(path.map(p => [p.x, p.y]), {
            stroke: visualColor,
            lineStyle: 'dashed',
            opacity: 0.3
        });

        // Check for existing roads and construction sites
        path.forEach(pos => {
            const structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
            const constructionSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y);
            
            // Skip if there's already a road or construction site
            if (structures.some(s => s.structureType === STRUCTURE_ROAD) || 
                constructionSites.length > 0) {
                return;
            }

            // Create construction site if we have enough energy
            if (room.energyAvailable > room.energyCapacityAvailable * 0.5) {
                const result = room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                if (result === OK) {
                    console.log(`🛣️ Planned road at ${pos.x},${pos.y}`);
                }
            }
        });
    }
}; 