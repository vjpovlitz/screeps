module.exports = {
    run: function(room) {
        // Find all towers in the room
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_TOWER
        });

        towers.forEach(tower => {
            // Priority 1: Attack hostile creeps
            const hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(hostile) {
                tower.attack(hostile);
                return;
            }

            // Priority 2: Heal damaged creeps
            const damagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (creep) => creep.hits < creep.hitsMax
            });
            if(damagedCreep) {
                tower.heal(damagedCreep);
                return;
            }

            // Priority 3: Repair critical structures (ramparts, walls under 10k hits)
            const criticalStructures = tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_RAMPART ||
                            structure.structureType === STRUCTURE_WALL) &&
                            structure.hits < 10000;
                }
            });
            if(criticalStructures.length > 0) {
                tower.repair(criticalStructures[0]);
                return;
            }

            // Priority 4: Repair other structures below 75% health
            if(tower.store.energy > tower.store.getCapacity(RESOURCE_ENERGY) * 0.75) {
                const damagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax * 0.75 &&
                                         structure.structureType !== STRUCTURE_WALL &&
                                         structure.structureType !== STRUCTURE_RAMPART
                });
                if(damagedStructure) {
                    tower.repair(damagedStructure);
                }
            }
        });
    }
}; 