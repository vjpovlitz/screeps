// This is correct
const roleHarvester = require('role.harvester');

// Don't use these
// const roleHarvester = require('./role.harvester.js');  // wrong
// const roleHarvester = require('/role.harvester');      // wrong

module.exports = {
    namePool: [
        'Vinson', 'Sean', 'Lenny', 'Cam', 'Kimi', 'Dave', 'Smokey',
        'Trish', 'Jocelyn', 'Trevor', 'Cat', 'Hellboy', 'Thor'
    ],
    
    getNextName: function(role) {
        // Force clean up old memory entries
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
        
        // Get currently active creeps
        const activeNames = new Set(Object.values(Game.creeps).map(creep => creep.name));
        
        // Find first unused name
        const availableName = this.namePool.find(name => !activeNames.has(name));
        if (availableName) {
            console.log(`Assigning name: ${availableName}`);
            return availableName;
        }
        
        // Fallback with numbered names
        return `${role}${Game.time}`;
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
        console.log(`Attempting to spawn ${role} with name: ${name}`); // Debug log
        
        const result = spawn.spawnCreep(body, name, {
            memory: {
                role: role,
                working: false,
                originalName: name // Store original name
            }
        });
        
        if(result === OK) {
            console.log(`Successfully spawned ${role} named ${name}`);
        }
        return result;
    }
}; 