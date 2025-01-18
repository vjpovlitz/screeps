module.exports = {
    run: function(creep) {
        if(creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }

        if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {
                    visualizePathStyle: {stroke: '#ffffff'},
                    reusePath: 5,
                    range: 3
                });
            }
            
            creep.room.visual.text(
                `RCL ${creep.room.controller.level}: ${creep.room.controller.progress}/${creep.room.controller.progressTotal}`,
                creep.room.controller.pos.x,
                creep.room.controller.pos.y - 1,
                {align: 'center', opacity: 0.8}
            );
        }
        else {
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {
                    visualizePathStyle: {stroke: '#ffaa00'},
                    reusePath: 5
                });
            }
        }
    }
}; 