const movementHelper = require('movement.helper');

module.exports = {
    run: function(creep) {
        if(creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄');
        }
        if(!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('⚡');
        }

        if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                movementHelper.moveOnRoad(creep, creep.room.controller);
            }
            else if(creep.pos.getRangeTo(creep.room.controller) > 2) {
                const betterPos = this.findOptimalUpgradePosition(creep);
                if(betterPos) {
                    movementHelper.moveOnRoad(creep, betterPos);
                }
            }
        } else {
            const source = this.findClosestEnergySource(creep);
            if(source) {
                if(source instanceof Source) {
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        movementHelper.moveOnRoad(creep, source);
                    }
                } else {
                    if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        movementHelper.moveOnRoad(creep, source);
                    }
                }
            }
        }
    },

    findOptimalUpgradePosition: function(creep) {
        const controller = creep.room.controller;
        const range = 2;
        
        for(let x = -range; x <= range; x++) {
            for(let y = -range; y <= range; y++) {
                const pos = new RoomPosition(
                    controller.pos.x + x,
                    controller.pos.y + y,
                    controller.room.name
                );
                if(pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD)) {
                    return pos;
                }
            }
        }
        return null;
    }
}; 

