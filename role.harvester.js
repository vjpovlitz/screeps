const constructionManager = require('construction.manager');
const movementHelper = require('movement.helper');

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // State management
        if(creep.memory.delivering && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.delivering = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.delivering && creep.store.getFreeCapacity() === 0) {
            creep.memory.delivering = true;
            creep.say('📦 deliver');
        }

        // Smart source selection
        if(!creep.memory.sourceId || Game.time % 100 === 0) {
            const sources = creep.room.find(FIND_SOURCES);
            let bestSource = null;
            let bestScore = -Infinity;

            sources.forEach(source => {
                // Count current harvesters at this source
                const harvestersHere = _.filter(Game.creeps, c => 
                    c.memory.role === 'harvester' && 
                    c.memory.sourceId === source.id
                ).length;

                // Calculate score based on multiple factors
                const distanceToSource = creep.pos.findPathTo(source).length;
                const distanceToSpawn = source.pos.findPathTo(creep.room.find(FIND_MY_SPAWNS)[0]).length;
                const energyAvailable = source.energy;
                
                // Score formula: higher is better
                const score = (energyAvailable * 0.5) - 
                            (distanceToSource * 0.3) - 
                            (distanceToSpawn * 0.2) - 
                            (harvestersHere * 50); // Heavy penalty for multiple harvesters

                if(score > bestScore) {
                    bestScore = score;
                    bestSource = source;
                }
            });

            if(bestSource) {
                creep.memory.sourceId = bestSource.id;
                creep.say('🎯 new src');
            }
        }

        if(creep.memory.delivering) {
            // Prioritized delivery targets
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    if(structure.structureType === STRUCTURE_SPAWN ||
                       structure.structureType === STRUCTURE_EXTENSION) {
                        return structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                    // Add tower as delivery target
                    if(structure.structureType === STRUCTURE_TOWER) {
                        return structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                    return false;
                }
            });

            if(targets.length > 0) {
                // Sort by priority: Spawn > Extensions > Tower
                targets.sort((a, b) => {
                    if(a.structureType === STRUCTURE_SPAWN) return -1;
                    if(b.structureType === STRUCTURE_SPAWN) return 1;
                    if(a.structureType === STRUCTURE_EXTENSION) return -1;
                    if(b.structureType === STRUCTURE_EXTENSION) return 1;
                    return 0;
                });

                if(creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                // If no delivery targets, become a temporary builder
                const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
                if(sites.length > 0) {
                    if(creep.build(sites[0]) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(sites[0], {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                }
            }
        } else {
            // Harvesting logic remains the same
            const source = Game.getObjectById(creep.memory.sourceId);
            if(source) {
                if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
    }
}; 