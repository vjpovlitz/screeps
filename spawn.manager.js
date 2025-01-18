// This is correct
const roleHarvester = require('role.harvester');

// Don't use these
// const roleHarvester = require('./role.harvester.js');  // wrong
// const roleHarvester = require('/role.harvester');      // wrong

module.exports = {
    namePool: ['Vinson', 'Sean', 'Lenny', 'Cam', 'Kimi', 'Dave', 'Smokey'],
    
    getNextName: function(role) {
        // Get currently used names
        const usedNames = new Set(Object.values(Game.creeps).map(creep => creep.name));
        
        // First, try to find an unused name from our pool
        for (let name of this.namePool) {
            if (!usedNames.has(name)) {
                return name;
            }
        }
        
        // If all names are used, append a number to the first available name
        for (let name of this.namePool) {
            let counter = 1;
            while (usedNames.has(`${name}_${counter}`)) {
                counter++;
            }
            return `${name}_${counter}`;
        }
    },

    getOptimalBody: function(energyAvailable) {
        // Scale creep body based on available energy
        if(energyAvailable >= 550) {
            return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if(energyAvailable >= 400) {
            return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else {
            return [WORK, CARRY, MOVE];
        }
    },

    run: function() {
        // Clear memory of dead creeps
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        const harvesters = _.filter(Game.creeps, c => c.memory.role == 'harvester');
        const upgraders = _.filter(Game.creeps, c => c.memory.role == 'upgrader');
        const builders = _.filter(Game.creeps, c => c.memory.role == 'builder');
        
        const spawn = Game.spawns['Spawn1'];
        const energyAvailable = spawn.room.energyAvailable;
        
        // Get optimal body parts based on energy
        const bodyParts = this.getOptimalBody(energyAvailable);

        // Spawn priority system
        if(harvesters.length < 4) {
            this.spawnCreep(spawn, 'harvester', bodyParts);
        }
        else if(upgraders.length < 2) {
            this.spawnCreep(spawn, 'upgrader', bodyParts);
        }
        else if(builders.length < 2) {
            this.spawnCreep(spawn, 'builder', bodyParts);
        }

        // Show spawning visual
        if(spawn.spawning) {
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                spawn.pos.x + 1, 
                spawn.pos.y, 
                {align: 'left', opacity: 0.8}
            );
        }
    },

    spawnCreep: function(spawn, role, body) {
        const name = this.getNextName(role);
        return spawn.spawnCreep(body, name, {
            memory: {
                role: role,
                working: false
            }
        });
    }
}; 