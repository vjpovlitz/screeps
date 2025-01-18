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
        const priority = {
            'tower': 0,
            'extension': 3,
            'spawn': 4,
            'road': 5,
            'container': 6
        };

        // Debug output for available sites
        if(Game.time % 10 === 0) {
            console.log('🏗️ Available construction sites:');
            sites.forEach(site => {
                console.log(`- ${site.structureType} at (${site.pos.x},${site.pos.y}): ${Math.floor((site.progress/site.progressTotal) * 100)}%`);
            });
        }

        return sites.sort((a, b) => {
            if(a.structureType === STRUCTURE_TOWER) return -1;
            if(b.structureType === STRUCTURE_TOWER) return 1;
            
            const priorityDiff = (priority[a.structureType] || 99) - (priority[b.structureType] || 99);
            if(priorityDiff !== 0) return priorityDiff;
            
            return (b.progress/b.progressTotal) - (a.progress/a.progressTotal);
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