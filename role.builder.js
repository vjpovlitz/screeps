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
            // First, look specifically for tower construction sites
            const towerSites = creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: site => site.structureType === STRUCTURE_TOWER
            });
            
            if(towerSites.length > 0) {
                if(creep.build(towerSites[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(towerSites[0], {visualizePathStyle: {stroke: '#ff0000'}});
                }
                creep.say('🗼 tower');
                return;
            }

            // If no tower sites, look for other construction sites
            const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(sites.length > 0) {
                if(creep.build(sites[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(sites[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        } else {
            // Get energy from closest source
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(source) {
                if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
    }
}; 