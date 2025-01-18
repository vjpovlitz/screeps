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
        // Debug output every 15 ticks
        if(Game.time % 15 === 0) {
            console.log('=== Creep Name Status ===');
            for(let name in Game.creeps) {
                const creep = Game.creeps[name];
                console.log(`${creep.name}: Custom Name = ${creep.memory.customName || 'None'}, Role = ${creep.memory.role}`);
            }
            console.log('=== Available Names ===');
            console.log(this.getAvailableNames().join(', '));
        }

        // Clear memory of dead creeps
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing dead creep memory:', name);
            }
        }

        const spawn = Game.spawns['Spawn1'];
        if(!spawn) return;

        // Get current creep counts
        const harvesters = _.filter(Game.creeps, creep => creep.memory.role === 'harvester');
        const upgraders = _.filter(Game.creeps, creep => creep.memory.role === 'upgrader');
        const builders = _.filter(Game.creeps, creep => creep.memory.role === 'builder');

        // Force name assignment for unnamed creeps
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            if(!creep.memory.customName || creep.memory.customName === 'undefined') {
                const availableName = this.getNextName();
                if(availableName) {
                    creep.memory.customName = availableName;
                    console.log(`🏷️ Assigned name ${availableName} to ${creep.name}`);
                    // Visualize the name assignment
                    creep.room.visual.text(
                        `${availableName}`,
                        creep.pos.x,
                        creep.pos.y - 0.5,
                        {align: 'center', opacity: 0.8}
                    );
                }
            }
        }

        // Don't spawn if already spawning
        if(spawn.spawning) {
            this.showSpawningVisual(spawn);
            return;
        }

        const energyAvailable = spawn.room.energyAvailable;
        let spawnAttempted = false;
        let spawnedName = '';
        
        // Determine what to spawn
        if(harvesters.length < 4) {
            const newName = this.getNextName();
            if(newName) {
                spawnAttempted = true;
                spawnedName = newName;
                const result = spawn.spawnCreep(
                    this.getOptimalBody(energyAvailable),
                    newName,
                    {
                        memory: {
                            role: 'harvester',
                            working: false,
                            customName: newName
                        }
                    }
                );
                if(result === OK) {
                    console.log(`Spawning new harvester: ${newName}`);
                }
            }
        }
        else if(upgraders.length < 4) {
            const newName = this.getNextName();
            if(newName) {
                spawnAttempted = true;
                spawnedName = newName;
                const result = spawn.spawnCreep(
                    this.getUpgraderBody(energyAvailable),
                    newName,
                    {
                        memory: {
                            role: 'upgrader',
                            working: false,
                            customName: newName
                        }
                    }
                );
                if(result === OK) {
                    console.log(`Spawning new upgrader: ${newName}`);
                }
            }
        }
        else if(builders.length < 2) {
            const newName = this.getNextName();
            if(newName) {
                spawnAttempted = true;
                spawnedName = newName;
                const result = spawn.spawnCreep(
                    this.getOptimalBody(energyAvailable),
                    newName,
                    {
                        memory: {
                            role: 'builder',
                            working: false,
                            customName: newName
                        }
                    }
                );
                if(result === OK) {
                    console.log(`Spawning new builder: ${newName}`);
                }
            }
        }

        if(spawnAttempted) {
            console.log(`Spawn attempt with name: ${spawnedName}`);
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
        
        // Debug output for name selection
        const availableName = this.namePool.find(name => !usedNames.has(name));
        if(availableName) {
            console.log(`Found available name: ${availableName}`);
            console.log(`Currently used names: ${Array.from(usedNames).join(', ')}`);
        } else {
            console.log('No available names found!');
            console.log(`All names in use: ${Array.from(usedNames).join(', ')}`);
        }
        
        return availableName;
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