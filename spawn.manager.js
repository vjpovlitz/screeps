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

        // Adjust minimum counts to favor upgraders
        const minCreeps = {
            harvester: 4,
            upgrader: 4,  // Increased upgrader count
            builder: 1
        };

        // Spawn priority system
        if(creepsByRole.harvester.length < minCreeps.harvester) {
            this.spawnCreep(spawn, 'harvester', this.getOptimalBody(spawn.room.energyAvailable));
        }
        else if(creepsByRole.upgrader.length < minCreeps.upgrader) {
            // Use specialized upgrader body
            this.spawnCreep(spawn, 'upgrader', this.getUpgraderBody(spawn.room.energyAvailable));
        }
        else if(creepsByRole.builder.length < minCreeps.builder) {
            this.spawnCreep(spawn, 'builder', this.getOptimalBody(spawn.room.energyAvailable));
        }

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
            this.spawnCreep(spawn, 'mineralHarvester', this.getOptimalMineralBody(spawn.room.energyAvailable));
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
        // Enhanced body configurations
        if(energy >= 1200) {
            return [
                WORK, WORK, WORK, WORK, WORK,    // 500
                CARRY, CARRY, CARRY, CARRY,      // 200
                MOVE, MOVE, MOVE, MOVE, MOVE     // 500
            ];
        } else if(energy >= 800) {
            return [
                WORK, WORK, WORK, WORK,          // 400
                CARRY, CARRY, CARRY,             // 150
                MOVE, MOVE, MOVE, MOVE           // 250
            ];
        }
        return [WORK, WORK, CARRY, CARRY, MOVE, MOVE]; // Basic 400 energy build
    },

    getOptimalMineralBody: function(energy) {
        if(energy >= 800) {
            return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
        return [WORK, WORK, CARRY, MOVE, MOVE];
    },

    getUpgraderBody: function(energy) {
        // Specialized upgrader bodies
        if(energy >= 800) {
            return [
                WORK, WORK, WORK, WORK,  // More WORK parts = faster upgrading
                CARRY, CARRY,
                MOVE, MOVE, MOVE
            ];
        } else if(energy >= 550) {
            return [
                WORK, WORK, WORK,
                CARRY, CARRY,
                MOVE, MOVE, MOVE
            ];
        }
        return [WORK, WORK, CARRY, MOVE];
    }
}; 