module.exports = {
    EXTENSION_LAYOUTS: {
        // Bunker-style layout around spawn
        compact: [
            {x: -2, y: -2}, {x: -1, y: -2}, {x: 0, y: -2}, {x: 1, y: -2}, {x: 2, y: -2},
            {x: -2, y: -1}, {x: -1, y: -1},                {x: 1, y: -1}, {x: 2, y: -1},
            {x: -2, y: 0},                                                 {x: 2, y: 0},
            {x: -2, y: 1},  {x: -1, y: 1},                 {x: 1, y: 1},  {x: 2, y: 1},
            {x: -2, y: 2},  {x: -1, y: 2},  {x: 0, y: 2},  {x: 1, y: 2},  {x: 2, y: 2}
        ]
    },

    run: function(room) {
        // Only run every 100 ticks to save CPU
        if (Game.time % 100 !== 0) return;

        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(!spawn) return;

        // Plan containers first
        this.planContainers(room, spawn);

        // Then plan tower if we're ready
        this.planTower(room, spawn);

        // Finally plan extensions
        this.planExtensions(room, spawn);
    },

    planContainers: function(room, spawn) {
        const sources = room.find(FIND_SOURCES);
        const containers = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        });

        // Plan container near controller
        if(room.controller && !this.hasNearbyContainer(room.controller.pos, room)) {
            const controllerPos = this.findContainerPosition(room, room.controller.pos);
            if(controllerPos) {
                room.createConstructionSite(controllerPos.x, controllerPos.y, STRUCTURE_CONTAINER);
            }
        }

        // Plan containers near sources
        sources.forEach(source => {
            if(!this.hasNearbyContainer(source.pos, room)) {
                const sourcePos = this.findContainerPosition(room, source.pos);
                if(sourcePos) {
                    room.createConstructionSite(sourcePos.x, sourcePos.y, STRUCTURE_CONTAINER);
                }
            }
        });
    },

    planTower: function(room, spawn) {
        if(room.controller.level >= 3) {
            const towers = room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_TOWER
            });

            if(towers.length === 0) {
                // Place tower in a defensive position
                const towerPos = {x: spawn.pos.x + 2, y: spawn.pos.y + 2};
                if(this.isValidBuildPosition(room, towerPos)) {
                    room.createConstructionSite(towerPos.x, towerPos.y, STRUCTURE_TOWER);
                }
            }
        }
    },

    planExtensions: function(room, spawn) {
        const maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
        const currentExtensions = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        });

        if(currentExtensions.length < maxExtensions) {
            // Use the compact layout
            const layout = this.EXTENSION_LAYOUTS.compact;
            for(let i = currentExtensions.length; i < maxExtensions && i < layout.length; i++) {
                const pos = layout[i];
                const buildX = spawn.pos.x + pos.x;
                const buildY = spawn.pos.y + pos.y;
                if(this.isValidBuildPosition(room, {x: buildX, y: buildY})) {
                    room.createConstructionSite(buildX, buildY, STRUCTURE_EXTENSION);
                }
            }
        }
    },

    hasNearbyContainer: function(pos, room) {
        const nearbyContainers = room.lookForAtArea(
            LOOK_STRUCTURES,
            Math.max(0, pos.y - 1),
            Math.max(0, pos.x - 1),
            Math.min(49, pos.y + 1),
            Math.min(49, pos.x + 1),
            true
        );
        return nearbyContainers.some(item => item.structure.structureType === STRUCTURE_CONTAINER);
    },

    findContainerPosition: function(room, nearPos) {
        for(let x = -1; x <= 1; x++) {
            for(let y = -1; y <= 1; y++) {
                const pos = {
                    x: nearPos.x + x,
                    y: nearPos.y + y
                };
                if(this.isValidBuildPosition(room, pos)) {
                    return pos;
                }
            }
        }
        return null;
    },

    isValidBuildPosition: function(room, pos) {
        // Check boundaries
        if(pos.x < 1 || pos.x > 48 || pos.y < 1 || pos.y > 48) return false;

        // Check for existing structures or construction sites
        const structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
        const sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y);
        const terrain = room.lookForAt(LOOK_TERRAIN, pos.x, pos.y)[0];

        return structures.length === 0 && 
               sites.length === 0 && 
               terrain !== 'wall';
    }
}; 