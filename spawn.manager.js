// This is correct
const roleHarvester = require('role.harvester');

// Don't use these
// const roleHarvester = require('./role.harvester.js');  // wrong
// const roleHarvester = require('/role.harvester');      // wrong

module.exports = {
    namePool: [
        'Vinson', 'Sean', 'Lenny', 'Cam', 'Kimi', 'Dave', 'Smokey',
        'Trish', 'Jocelyn', 'Trevor', 'Cat', 'Hellboy', 'Thor',
        'Geralt', 'Gwen'
    ],
    
    townNames: {
        'spawn': 'Annapolis',
        'sources': ['Baltimore', 'Frederick', 'Rockville', 'Ocean City', 'Columbia'],
        'extensions': ['Bethesda', 'Silver Spring', 'Gaithersburg', 'Bowie', 'Hagerstown']
    },

    run: function() {
        // Force rename all unnamed creeps first
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            // Check if creep has a generated name (contains numbers)
            if(/\d/.test(creep.name) && !creep.memory.hasCustomName) {
                const availableName = this.getNextName();
                if(availableName) {
                    console.log(`Assigning ${availableName} to creep ${creep.name}`);
                    creep.memory.customName = availableName;
                    creep.memory.hasCustomName = true;
                    // Display custom name above creep
                    creep.room.visual.text(
                        availableName,
                        creep.pos.x,
                        creep.pos.y - 1,
                        {align: 'center', opacity: 0.8}
                    );
                }
            }
        }

        // Get currently used names
        const usedNames = new Set();
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            if(creep.memory.customName) {
                usedNames.add(creep.memory.customName);
            }
            if(this.namePool.includes(creep.name)) {
                usedNames.add(creep.name);
            }
        }

        console.log('Currently used names:', Array.from(usedNames));

        const spawn = Game.spawns['Spawn1'];
        if(spawn.spawning) {
            this.showSpawningVisual(spawn);
            return;
        }

        // Get current creep counts and available names
        const creepsByRole = {
            harvester: _.filter(Game.creeps, creep => creep.memory.role === 'harvester'),
            upgrader: _.filter(Game.creeps, creep => creep.memory.role === 'upgrader'),
            builder: _.filter(Game.creeps, creep => creep.memory.role === 'builder')
        };

        // Determine what to spawn
        let roleToSpawn = null;
        if(creepsByRole.harvester.length < 4) roleToSpawn = 'harvester';
        else if(creepsByRole.upgrader.length < 2) roleToSpawn = 'upgrader';
        else if(creepsByRole.builder.length < 2) roleToSpawn = 'builder';

        // Check for mineral harvester - Fix the syntax error
        const mineral = spawn.room.find(FIND_MINERALS)[0];
        let extractor = null;
        
        if(mineral) {
            extractor = mineral.pos.lookFor(LOOK_STRUCTURES).find(
                s => s.structureType == STRUCTURE_EXTRACTOR
            );
        }

        const mineralHarvesters = _.filter(Game.creeps, 
            creep => creep.memory.role === 'mineralHarvester'
        );

        if(extractor && mineralHarvesters.length < 1) {
            roleToSpawn = 'mineralHarvester';
            bodyParts = this.getOptimalMineralBody(spawn.room.energyAvailable);
        }

        if(roleToSpawn && spawn.room.energyAvailable >= 200) {
            const newName = this.getNextName();
            if(newName) {
                const bodyParts = this.getOptimalBody(spawn.room.energyAvailable);
                console.log(`Spawning new ${roleToSpawn} with name: ${newName}`);
                
                const result = spawn.spawnCreep(bodyParts, newName, {
                    memory: {
                        role: roleToSpawn,
                        working: false,
                        homeBase: this.townNames.spawn,
                        originalName: newName
                    }
                });

                if(result === OK) {
                    console.log(`Successfully spawned ${newName}`);
                }
            }
        }
    },

    getNextName: function() {
        const usedNames = new Set();
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            if(creep.memory.customName) {
                usedNames.add(creep.memory.customName);
            }
            if(this.namePool.includes(creep.name)) {
                usedNames.add(creep.name);
            }
        }

        return this.namePool.find(name => !usedNames.has(name));
    },

    showSpawningVisual: function(spawn) {
        const spawningCreep = Game.creeps[spawn.spawning.name];
        spawn.room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            spawn.pos.x + 1, 
            spawn.pos.y, 
            {align: 'left', opacity: 0.8}
        );
    },

    getOptimalBody: function(energy) {
        if(energy >= 800) {
            return [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else if(energy >= 550) {
            return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if(energy >= 400) {
            return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        return [WORK, CARRY, MOVE];
    },

    getOptimalMineralBody: function(energy) {
        if(energy >= 800) {
            return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
        return [WORK, WORK, CARRY, MOVE, MOVE];
    }
}; 