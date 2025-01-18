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
        // Clear memory of dead creeps
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }

        const spawn = Game.spawns['Spawn1'];
        if(!spawn) return;

        // FIXED: Name Assignment - Only assign if no custom name exists
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            if(!creep.memory.customName || creep.memory.customName === 'undefined') {
                const availableName = this.getNextName();
                if(availableName) {
                    creep.memory.customName = availableName;
                    creep.memory.nameAssigned = true; // Add flag to prevent reassignment
                    console.log(`🏷️ Initial name assignment: ${availableName} to ${creep.name} (${creep.memory.role})`);
                }
            }
        }

        // Debug output every 15 ticks
        if(Game.time % 15 === 0) {
            console.log('=== Current Creep Names ===');
            for(let name in Game.creeps) {
                const creep = Game.creeps[name];
                console.log(`${creep.name} => ${creep.memory.customName} (${creep.memory.role})`);
            }
        }

        // Spawn logic
        const harvesters = _.filter(Game.creeps, creep => creep.memory.role === 'harvester');
        const upgraders = _.filter(Game.creeps, creep => creep.memory.role === 'upgrader');
        const builders = _.filter(Game.creeps, creep => creep.memory.role === 'builder');

        if(spawn.spawning) {
            this.showSpawningVisual(spawn);
            return;
        }

        // FIXED: Spawning with persistent names
        const energyAvailable = spawn.room.energyAvailable;
        if(harvesters.length < 4) {
            const newName = this.getNextName();
            if(newName) {
                const result = spawn.spawnCreep(
                    this.getOptimalBody(energyAvailable),
                    newName, // Use the custom name directly
                    {
                        memory: {
                            role: 'harvester',
                            working: false,
                            customName: newName,
                            nameAssigned: true
                        }
                    }
                );
                if(result === OK) {
                    console.log(`Spawned new harvester: ${newName}`);
                }
            }
        }
        else if(upgraders.length < 4) {
            const newName = this.getNextName();
            if(newName) {
                const result = spawn.spawnCreep(
                    this.getUpgraderBody(energyAvailable),
                    newName,
                    {
                        memory: {
                            role: 'upgrader',
                            working: false,
                            customName: newName,
                            nameAssigned: true
                        }
                    }
                );
                if(result === OK) {
                    console.log(`Spawned new upgrader: ${newName}`);
                }
            }
        }
        else if(builders.length < 2) {
            const newName = this.getNextName();
            if(newName) {
                const result = spawn.spawnCreep(
                    this.getOptimalBody(energyAvailable),
                    newName,
                    {
                        memory: {
                            role: 'builder',
                            working: false,
                            customName: newName,
                            nameAssigned: true
                        }
                    }
                );
                if(result === OK) {
                    console.log(`Spawned new builder: ${newName}`);
                }
            }
        }
    },

    getAvailableNames: function() {
        const usedNames = new Set();
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            if(creep.memory.customName) {
                usedNames.add(creep.memory.customName);
            }
        }
        return this.namePool.filter(name => !usedNames.has(name));
    },

    getNextName: function() {
        const usedNames = new Set();
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            if(creep.memory.customName) {
                usedNames.add(creep.memory.customName);
            }
        }
        
        const availableName = this.namePool.find(name => !usedNames.has(name));
        if(availableName) {
            return availableName;
        }
        return null;
    },

    getOptimalBody: function(energy) {
        if(energy >= 800) {
            return [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if(energy >= 550) {
            return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        return [WORK, WORK, CARRY, MOVE];
    },

    getUpgraderBody: function(energy) {
        if(energy >= 800) {
            return [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if(energy >= 550) {
            return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        return [WORK, WORK, CARRY, MOVE];
    },

    showSpawningVisual: function(spawn) {
        if(spawn.spawning) {
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️ ' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                {align: 'left', opacity: 0.8}
            );
        }
    }
}; 