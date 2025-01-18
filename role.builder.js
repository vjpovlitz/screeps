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
            // First priority: Roads under construction
            const roadSites = creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: site => site.structureType === STRUCTURE_ROAD
            });
            
            // Second priority: Other construction sites
            const otherSites = creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: site => site.structureType !== STRUCTURE_ROAD
            });
            
            const target = roadSites.length > 0 ? roadSites[0] : 
                          otherSites.length > 0 ? otherSites[0] : null;

            if(target) {
                if(creep.build(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {stroke: '#ffffff'}
                    });
                }
            } else {
                // No construction sites, repair roads instead
                const damagedRoad = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: structure => structure.structureType === STRUCTURE_ROAD && 
                                      structure.hits < structure.hitsMax
                });
                if(damagedRoad) {
                    if(creep.repair(damagedRoad) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(damagedRoad, {
                            visualizePathStyle: {stroke: '#ffffff'}
                        });
                    }
                }
            }
        }
        else {
            // Find closest source
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {
                    visualizePathStyle: {stroke: '#ffaa00'}
                });
            }
        }
    }
}; 