module.exports = {
    run: function(room) {
        // Only run road planning every 100 ticks to save CPU
        if (Game.time % 100 !== 0) return;

        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;

        // Find all important destinations
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;
        
        // Skip Baltimore to Annapolis road planning since it's complete
        
        // Plan roads to other destinations if needed
        sources.forEach(source => {
            if (!this.roadExists(room, spawn.pos, source.pos)) {
                this.planRoad(room, spawn.pos, source.pos, '#ffffff');
            }
        });

        if (controller && !this.roadExists(room, spawn.pos, controller.pos)) {
            this.planRoad(room, spawn.pos, controller.pos, '#ffaa00');
        }
    },

    roadExists: function(room, startPos, endPos) {
        const path = room.findPath(startPos, endPos, {
            ignoreCreeps: true
        });

        // Check if road exists along the path
        return path.every(pos => {
            const structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
            return structures.some(s => s.structureType === STRUCTURE_ROAD);
        });
    },

    planRoad: function(room, fromPos, toPos, color) {
        const path = room.findPath(fromPos, toPos, {
            ignoreCreeps: true,
            swampCost: 2
        });
        
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
                room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            }
        });

        // Visualize the path
        room.visual.poly(path, {stroke: color, lineStyle: 'dashed'});
    }
}; 