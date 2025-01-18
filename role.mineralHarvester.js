module.exports = {
    run: function(creep) {
        if(creep.store.getFreeCapacity() > 0) {
            const mineral = creep.room.find(FIND_MINERALS)[0];
            const extractor = mineral.pos.lookFor(LOOK_STRUCTURES).find(
                s => s.structureType == STRUCTURE_EXTRACTOR
            );
            
            if(!extractor) {
                // If no extractor exists, try to build one
                mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
                return;
            }
            
            if(creep.harvest(mineral) == ERR_NOT_IN_RANGE) {
                creep.moveTo(mineral, {
                    visualizePathStyle: {stroke: '#9370db'}
                });
            }
        }
        else {
            // Find storage
            const storage = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_STORAGE
            })[0];
            
            if(storage) {
                if(creep.transfer(storage, RESOURCE_HYDROGEN) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {
                        visualizePathStyle: {stroke: '#9370db'}
                    });
                }
            }
        }
    }
}; 