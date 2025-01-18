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
        
        // Rename spawn if not already done
        if(!spawn.memory.renamed) {
            spawn.memory.renamed = true;
            // Note: actual spawn renaming requires Game.spawns['Spawn1'].rename('Annapolis')
            // which costs game currency
        }

        // Calculate needed creeps
        const minCreeps = {
            harvester: 4,
            upgrader: 3,
            builder: 3
        };

        // Get current creep counts
        const creepCounts = {};
        for(let role in minCreeps) {
            creepCounts[role] = _.filter(Game.creeps, creep => creep.memory.role === role).length;
        }

        // Determine what to spawn
        let roleToSpawn = null;
        for(let role in minCreeps) {
            if(creepCounts[role] < minCreeps[role]) {
                roleToSpawn = role;
                break;
            }
        }

        if(roleToSpawn) {
            // Get optimal body based on available energy
            const bodyParts = this.getOptimalBody(spawn.room.energyAvailable);
            
            // Get next available name
            const name = this.getNextName(roleToSpawn);
            
            console.log(`Spawning ${roleToSpawn} named ${name}`);
            
            const result = spawn.spawnCreep(bodyParts, name, {
                memory: {
                    role: roleToSpawn,
                    working: false,
                    originalName: name,
                    homeBase: this.townNames.spawn
                }
            });

            if(result === OK) {
                console.log(`Successfully spawned ${name} (${roleToSpawn})`);
            }
        }

        // Spawning visual
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

    getOptimalBody: function(energy) {
        if(energy >= 800) {
            return [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else if(energy >= 550) {
            return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if(energy >= 400) {
            return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else {
            return [WORK, CARRY, MOVE];
        }
    },

    getNextName: function(role) {
        const usedNames = new Set(Object.values(Game.creeps).map(creep => creep.name));
        
        // Try to assign an unused name from the pool
        for(let name of this.namePool) {
            if(!usedNames.has(name)) {
                return name;
            }
        }
        
        // If all names are used, create a new numbered version
        let counter = 1;
        while(usedNames.has(`${this.namePool[0]}_${counter}`)) {
            counter++;
        }
        return `${this.namePool[0]}_${counter}`;
    }
}; 