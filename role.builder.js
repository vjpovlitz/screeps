module.exports = {
    run: function(creep) {
        // State management
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if(creep.memory.building) {
            // Find construction sites
            const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {
                        visualizePathStyle: {stroke: '#ffffff'},
                        reusePath: 20
                    });
                }
            } else {
                // Repair if nothing to build
                const repairs = creep.room.find(FIND_STRUCTURES, {
                    filter: object => object.hits < object.hitsMax
                });
                repairs.sort((a,b) => a.hits/a.hitsMax - b.hits/b.hitsMax);
                
                if(repairs.length > 0) {
                    if(creep.repair(repairs[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(repairs[0]);
                    }
                }
            }
        }
        else {
            // Find closest source
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {
                    visualizePathStyle: {stroke: '#ffaa00'},
                    reusePath: 20
                });
            }
        }
    }
}; 