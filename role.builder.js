const movementHelper = require('movement.helper');

module.exports = {
    run: function(creep) {
        // State management
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            creep.say('🏗️ build');
        }

        if(creep.memory.building) {
            // First priority: Towers
            const towerSites = creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: site => site.structureType === STRUCTURE_TOWER
            });
            
            if(towerSites.length > 0) {
                // Find closest tower site
                const closestTower = creep.pos.findClosestByPath(towerSites);
                if(creep.build(closestTower) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestTower, {
                        visualizePathStyle: {stroke: '#ff0000'},
                        reusePath: 5
                    });
                }
                creep.say('🗼 tower!');
                return;
            }

            // Second priority: Other structures
            const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(sites.length > 0) {
                const target = creep.pos.findClosestByPath(sites);
                if(creep.build(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {stroke: '#ffffff'},
                        reusePath: 5
                    });
                }
            }
        } else {
            // Get energy from closest source or storage
            const storage = creep.room.storage;
            if(storage && storage.store[RESOURCE_ENERGY] > 100) {
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