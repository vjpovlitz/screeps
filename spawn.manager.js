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
        }

        const spawn = Game.spawns['Spawn1'];
        if(!spawn) return;

        // IMPORTANT: Force rename ALL creeps, including harvesters
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            // Check if creep has no custom name OR has a generated name (contains numbers)
            if(!creep.memory.customName || /\d/.test(creep.name)) {
                const availableName = this.getNextName();
                if(availableName) {
                    // Store old name for logging
                    const oldName = creep.memory.customName || creep.name;
                    creep.memory.customName = availableName;
                    console.log(`🏷️ Renamed creep from ${oldName} to ${availableName} (Role: ${creep.memory.role})`);
                    
                    // Visual feedback for rename
                    creep.room.visual.text(
                        `${availableName}`,
                        creep.pos.x,
                        creep.pos.y - 0.5,
                        {align: 'center', opacity: 0.8, color: '#ffffff', stroke: '#000000', strokeWidth: 0.2}
                    );
                }
            }
        }

        // Get current creep counts
        const harvesters = _.filter(Game.creeps, creep => creep.memory.role === 'harvester');
        const upgraders = _.filter(Game.creeps, creep => creep.memory.role === 'upgrader');
        const builders = _.filter(Game.creeps, creep => creep.memory.role === 'builder');

        // Don't spawn if already spawning
        if(spawn.spawning) {
            this.showSpawningVisual(spawn);
            return;
        }

        const energyAvailable = spawn.room.energyAvailable;
        let spawnAttempted = false;
        let spawnedName = '';

        // IMPORTANT: Modified spawning logic to ensure names are assigned
        if(harvesters.length < 4) {
            const newName = this.getNextName();
            if(newName) {
                spawnAttempted = true;
                spawnedName = newName;
                const result = spawn.spawnCreep(
                    this.getOptimalBody(energyAvailable),
                    `harvester_${Game.time}`, // Temporary name that will be replaced
                    {
                        memory: {
                            role: 'harvester',
                            working: false,
                            customName: newName // Assign custom name immediately
                        }
                    }
                );
                if(result === OK) {
                    console.log(`Spawning new harvester with custom name: ${newName}`);
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
            console.log(`Spawn attempt completed with name: ${spawnedName}`);
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
        // Check both memory.customName and actual creep names
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            if(creep.memory.customName) {
                usedNames.add(creep.memory.customName);
            }
            // Also check if the creep's actual name is from our pool
            if(this.namePool.includes(creep.name)) {
                usedNames.add(creep.name);
            }
        }
        
        // Debug output
        if(Game.time % 15 === 0) {
            console.log('Used names:', Array.from(usedNames).join(', '));
            console.log('Available names:', this.namePool.filter(name => !usedNames.has(name)).join(', '));
        }
        
        return this.namePool.find(name => !usedNames.has(name));
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