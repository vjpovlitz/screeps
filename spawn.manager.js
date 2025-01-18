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

    run: function() {
        // Clear memory of dead creeps
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        const harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        const upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
        
        console.log('Harvesters: ' + harvesters.length);
        
        const spawn = Game.spawns['Spawn1'];
        const bodyParts = [WORK, CARRY, MOVE];
        const energyCost = 200;

        // Spawn harvesters with custom names
        if(harvesters.length < 4) {
            if(spawn.room.energyAvailable >= energyCost) {
                const newName = this.getNextName('Harvester');
                console.log('Attempting to spawn harvester: ' + newName);
                const result = spawn.spawnCreep(bodyParts, newName, 
                    {memory: {
                        role: 'harvester',
                        isNamed: true
                    }});
                
                if(result == OK) {
                    console.log('Successfully spawning new harvester: ' + newName);
                } else {
                    console.log('Failed to spawn harvester with error: ' + result);
                }
            } else {
                console.log('Waiting for energy: ' + spawn.room.energyAvailable + '/' + energyCost);
            }
        }
        // Spawn upgraders with custom names
        else if(upgraders.length < 2 && spawn.room.energyAvailable >= energyCost) {
            const newName = this.getNextName('Upgrader');
            spawn.spawnCreep(bodyParts, newName,
                {memory: {
                    role: 'upgrader',
                    isNamed: true
                }});
        }

        // Visual notification when spawning
        if(spawn.spawning) { 
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                spawn.pos.x + 1, 
                spawn.pos.y, 
                {align: 'left', opacity: 0.8});
        }
    }
}; 