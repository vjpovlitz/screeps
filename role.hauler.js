module.exports = {
    run: function(creep) {
        if(creep.store.getFreeCapacity() > 0) {
            // Find dropped resources or containers
            const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES) ||
                          creep.pos.findClosestByPath(FIND_STRUCTURES, {
                              filter: s => s.structureType == STRUCTURE_CONTAINER &&
                                         s.store[RESOURCE_ENERGY] > 0
                          });
            
            if(target) {
                if(target.resourceType) { // Dropped resource
                    if(creep.pickup(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                } else { // Container
                    if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                }
            }
        } else {
            // Find structures needing energy
            const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            
            if(target) {
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
}; 