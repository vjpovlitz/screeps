module.exports = {
    run: function(room) {
        // Plan extensions
        this.planExtensions(room);
        // Plan containers
        this.planContainers(room);
        // Plan roads
        this.planRoads(room);
    },

    planExtensions: function(room) {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(!spawn) return;

        // Create a spiral pattern around spawn
        const positions = this.getSpiralPositions(spawn.pos, 3);
        
        positions.forEach(pos => {
            if(this.isValidBuildPosition(room, pos)) {
                room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
            }
        });
    },

    planContainers: function(room) {
        const sources = room.find(FIND_SOURCES);
        
        sources.forEach(source => {
            // Find position 1 tile away from source
            const positions = this.getAdjacentPositions(source.pos);
            
            for(let pos of positions) {
                if(this.isValidBuildPosition(room, pos)) {
                    room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
                    break;
                }
            }
        });
    },

    isValidBuildPosition: function(room, pos) {
        // Check if position is available for building
        return room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y).length === 0 &&
               room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y).length === 0 &&
               pos.lookFor(LOOK_TERRAIN)[0] !== 'wall';
    },

    getSpiralPositions: function(center, radius) {
        const positions = [];
        for(let r = 1; r <= radius; r++) {
            for(let dx = -r; dx <= r; dx++) {
                for(let dy = -r; dy <= r; dy++) {
                    if(Math.abs(dx) === r || Math.abs(dy) === r) {
                        positions.push({
                            x: center.x + dx,
                            y: center.y + dy
                        });
                    }
                }
            }
        }
        return positions;
    },

    getAdjacentPositions: function(pos) {
        const positions = [];
        for(let dx = -1; dx <= 1; dx++) {
            for(let dy = -1; dy <= 1; dy++) {
                if(dx !== 0 || dy !== 0) {
                    positions.push({
                        x: pos.x + dx,
                        y: pos.y + dy
                    });
                }
            }
        }
        return positions;
    }
}; 