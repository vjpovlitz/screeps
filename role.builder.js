const movementHelper = require('movement.helper');

module.exports = {
    run: function(creep) {
        // State management
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say('🔄');
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
            creep.say('🚧');
        }

        if(creep.memory.building) {
            // Get all construction sites
            const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            
            if(sites.length) {
                // Sort sites by priority and progress
                const prioritizedSites = this.prioritizeConstructionSites(sites);
                const target = prioritizedSites[0];

                // Log construction progress every 50 ticks
                if(Game.time % 50 === 0) {
                    console.log(`🏗️ Building ${target.structureType}: ${Math.floor((target.progress/target.progressTotal) * 100)}% complete`);
                }

                if(creep.build(target) == ERR_NOT_IN_RANGE) {
                    movementHelper.moveOnRoad(creep, target);
                }
            } else {
                // Repair logic - prioritize roads and containers
                const repairTarget = this.findRepairTarget(creep);
                if(repairTarget) {
                    if(creep.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                        movementHelper.moveOnRoad(creep, repairTarget);
                    }
                }
            }
        } else {
            // Harvesting logic
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                movementHelper.moveOnRoad(creep, source);
            }
        }
    },

    prioritizeConstructionSites: function(sites) {
        // Updated priority order: Tower > Extension > Spawn > Storage > Road > Container
        const priority = {
            'tower': 1,
            'extension': 2,
            'spawn': 3,
            'storage': 4,
            'road': 5,
            'container': 6
        };

        // Extension names from Maryland cities
        const extensionNames = [
            'Bethesda', 'Silver Spring', 'Gaithersburg', 
            'Bowie', 'Hagerstown', 'Rockville', 'Laurel'
        ];

        return sites.sort((a, b) => {
            // First sort by priority
            const priorityDiff = (priority[a.structureType] || 99) - (priority[b.structureType] || 99);
            if(priorityDiff !== 0) return priorityDiff;
            
            // Then by progress percentage
            const aProgress = a.progress / a.progressTotal;
            const bProgress = b.progress / b.progressTotal;
            return bProgress - aProgress;
        });
    },

    findRepairTarget: function(creep) {
        return creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: structure => {
                if(structure.structureType === STRUCTURE_ROAD) {
                    return structure.hits < structure.hitsMax * 0.7;
                }
                if(structure.structureType === STRUCTURE_CONTAINER) {
                    return structure.hits < structure.hitsMax * 0.8;
                }
                return false;
            }
        });
    }
}; 