const movementHelper = require('movement.helper');

module.exports = {
    run: function(creep) {
        // Switch states if full or empty
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            creep.say('🏗️ build');
        }

        if(creep.memory.building) {
            const towerSites = creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: site => site.structureType === STRUCTURE_TOWER
            });
            
            if(towerSites.length > 0) {
                const target = towerSites[0];
                if(creep.build(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {stroke: '#ff0000'},
                        reusePath: 5
                    });
                }
                creep.say('🗼 tower!');
                return;
            }

            const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(sites.length > 0) {
                if(creep.build(sites[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(sites[0], {
                        visualizePathStyle: {stroke: '#ffffff'},
                        reusePath: 5
                    });
                }
            }
        } else {
            const storage = creep.room.storage;
            if(storage && storage.store[RESOURCE_ENERGY] > 0) {
                if(creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if(source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
    }
}; 
}; 