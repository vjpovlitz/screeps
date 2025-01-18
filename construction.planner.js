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
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(!spawn) return;

        // Plan tower placement if we don't have one
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        });

        if(towers.length === 0 && room.controller.level >= 3) {
            // Place tower in a defensive position
            const towerPos = {x: spawn.pos.x + 2, y: spawn.pos.y + 2};
            if(this.isValidBuildPosition(room, towerPos)) {
                room.createConstructionSite(towerPos.x, towerPos.y, STRUCTURE_TOWER);
                room.visual.circle(towerPos.x, towerPos.y, {
                    radius: 0.5,
                    fill: '#ff0000',
                    opacity: 0.3
                });
            }
        }

        // Plan extensions
        const maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
        const currentExtensions = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        });

        if(currentExtensions.length < maxExtensions) {
            this.planExtensions(room, spawn, currentExtensions.length);
        }
    },

    planExtensions: function(room, spawn, currentCount) {
        const layout = this.EXTENSION_LAYOUTS.compact;
        
        for(let pos of layout) {
            const buildPos = {
                x: spawn.pos.x + pos.x,
                y: spawn.pos.y + pos.y
            };

            if(this.isValidBuildPosition(room, buildPos)) {
                room.createConstructionSite(buildPos.x, buildPos.y, STRUCTURE_EXTENSION);
                // Visualize planned extension
                room.visual.structure(buildPos.x, buildPos.y, STRUCTURE_EXTENSION, {
                    opacity: 0.3
                });
            }
        }
    },

    isValidBuildPosition: function(room, pos) {
        // Check if position is available for building
        return room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y).length === 0 &&
               room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y).length === 0 &&
               room.getTerrain().get(pos.x, pos.y) !== TERRAIN_MASK_WALL;
    }
}; 