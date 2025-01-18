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
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        const spawn = Game.spawns['Spawn1'];
        
        // Don't try to spawn if already spawning
        if(spawn.spawning) {
            this.showSpawningVisual(spawn);
            return;
        }

        // Get current creep counts
        const creepsByRole = {
            harvester: _.filter(Game.creeps, creep => creep.memory.role === 'harvester'),
            upgrader: _.filter(Game.creeps, creep => creep.memory.role === 'upgrader'),
            builder: _.filter(Game.creeps, creep => creep.memory.role === 'builder')
        };

        // Track used names
        const usedNames = new Set(Object.values(Game.creeps).map(creep => creep.name));

        // Determine what to spawn based on minimum counts
        let roleToSpawn = null;
        if(creepsByRole.harvester.length < 4) roleToSpawn = 'harvester';
        else if(creepsByRole.upgrader.length < 2) roleToSpawn = 'upgrader';
        else if(creepsByRole.builder.length < 2) roleToSpawn = 'builder';

        // Only spawn if we need to and have enough energy
        if(roleToSpawn && spawn.room.energyAvailable >= 200) {
            // Find first unused name
            const availableName = this.namePool.find(name => !usedNames.has(name));
            if(!availableName) {
                console.log('All names are in use!');
                return;
            }

            const bodyParts = this.getOptimalBody(spawn.room.energyAvailable);
            
            console.log(`Attempting to spawn ${roleToSpawn} with name: ${availableName}`);
            
            const result = spawn.spawnCreep(bodyParts, availableName, {
                memory: {
                    role: roleToSpawn,
                    working: false,
                    homeBase: this.townNames.spawn
                }
            });

            if(result === OK) {
                console.log(`Successfully spawned ${availableName} as ${roleToSpawn}`);
            } else {
                console.log(`Failed to spawn with error: ${result}`);
            }
        }
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
    }
}; 