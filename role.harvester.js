const constructionManager = require('construction.manager');

module.exports = {
    run: function(creep) {
        // Assign source if not already assigned
        constructionManager.assignSources(creep);
        
        if(creep.store.getFreeCapacity() > 0) {
            const source = Game.getObjectById(creep.memory.sourceId);
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {
                    visualizePathStyle: {stroke: '#ffaa00'},
                    reusePath: 20  // Reuse path for 20 ticks for efficiency
                });
            }
        }
        else {
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_EXTENSION) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {
                        visualizePathStyle: {stroke: '#ffffff'},
                        reusePath: 20
                    });
                }
            }
        }
    }
}; 