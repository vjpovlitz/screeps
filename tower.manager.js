module.exports = {
    run: function(room) {
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: structure => structure.structureType === STRUCTURE_TOWER
        });

        towers.forEach(tower => {
            // Priority 1: Attack hostile creeps
            const hostileCreep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(hostileCreep) {
                tower.attack(hostileCreep);
                return;
            }

            // Priority 2: Heal damaged creeps
            const damagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: creep => creep.hits < creep.hitsMax
            });
            if(damagedCreep) {
                tower.heal(damagedCreep);
                return;
            }

            // Priority 3: Repair critical structures (ramparts, walls below threshold)
            const criticalStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: structure => {
                    if(structure.structureType === STRUCTURE_RAMPART) {
                        return structure.hits < 10000;
                    }
                    if(structure.structureType === STRUCTURE_WALL) {
                        return structure.hits < 10000;
                    }
                    return false;
                }
            });
            if(criticalStructure) {
                tower.repair(criticalStructure);
                return;
            }

            // Priority 4: Repair roads (only if tower has >50% energy)
            if(tower.store.energy > tower.store.getCapacity(RESOURCE_ENERGY) * 0.5) {
                const damagedRoad = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: structure => 
                        structure.structureType === STRUCTURE_ROAD &&
                        structure.hits < structure.hitsMax * 0.7
                });
                if(damagedRoad) {
                    tower.repair(damagedRoad);
                }
            }
        });
    }
}; 