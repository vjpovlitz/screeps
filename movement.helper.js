module.exports = {
    moveOnRoad: function(creep, target) {
        const cityLocations = {
            'Baltimore': {x: 12, y: 8},    // Adjust based on your map
            'Annapolis': {x: 25, y: 25},   // Your spawn location
            'Frederick': {x: 35, y: 15},   // Second source
            'Controller': creep.room.controller.pos
        };

        const opts = {
            reusePath: 20,
            visualizePathStyle: {
                stroke: '#ffffff',
                opacity: 0.3
            },
            costCallback: function(roomName, costMatrix) {
                const room = Game.rooms[roomName];
                if (!room) return;
                
                room.find(FIND_STRUCTURES).forEach(struct => {
                    if (struct.structureType === STRUCTURE_ROAD) {
                        costMatrix.set(struct.pos.x, struct.pos.y, 1);
                    } else if (struct.structureType === STRUCTURE_WALL) {
                        costMatrix.set(struct.pos.x, struct.pos.y, 255);
                    } else {
                        costMatrix.set(struct.pos.x, struct.pos.y, 15);
                    }
                });
            }
        };

        return creep.moveTo(target, opts);
    }
}; 