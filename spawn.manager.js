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

        // Get current creep counts
        const harvesters = _.filter(Game.creeps, creep => creep.memory.role === 'harvester');
        const upgraders = _.filter(Game.creeps, creep => creep.memory.role === 'upgrader');
        const builders = _.filter(Game.creeps, creep => creep.memory.role === 'builder');

        // Adjusted minimum counts
        const minCreeps = {
            harvester: 4,
            upgrader: 2,
            builder: 6  // Increased for multiple tower construction
        };

        // Debug output every 30 ticks
        if(Game.time % 30 === 0) {
            console.log(`Creep Balance - H:${harvesters.length}/${minCreeps.harvester} U:${upgraders.length}/${minCreeps.upgrader} B:${builders.length}/${minCreeps.builder}`);
        }

        // Don't spawn if already spawning
        if(spawn.spawning) {
            this.showSpawningVisual(spawn);
            return;
        }

        const energyAvailable = spawn.room.energyAvailable;
        
        // Spawn priority logic
        if(harvesters.length < minCreeps.harvester) {
            this.spawnCreep(spawn, 'harvester', energyAvailable);
        }
        else if(builders.length < minCreeps.builder) {  // Prioritize builders over upgraders
            this.spawnCreep(spawn, 'builder', energyAvailable);
        }
        else if(upgraders.length < minCreeps.upgrader) {
            this.spawnCreep(spawn, 'upgrader', energyAvailable);
        }

        // If we have construction sites, spawn extra builders
        const constructionSites = spawn.room.find(FIND_CONSTRUCTION_SITES);
        if(constructionSites.length > 10 && builders.length < 4 && 
           harvesters.length >= minCreeps.harvester) {
            this.spawnCreep(spawn, 'builder', energyAvailable);
        }

        // If we're near RCL upgrade, add an upgrader
        const controller = spawn.room.controller;
        if(controller && controller.progress > controller.progressTotal * 0.8 &&
           upgraders.length < 3 && harvesters.length >= minCreeps.harvester) {
            this.spawnCreep(spawn, 'upgrader', energyAvailable);
        }
    },

    spawnCreep: function(spawn, role, energy) {
        const newName = this.getNextName();
        if(!newName) return;

        let body;
        switch(role) {
            case 'builder':
                body = this.getBuilderBody(energy);
                break;
            case 'upgrader':
                body = this.getUpgraderBody(energy);
                break;
            default:
                body = this.getOptimalBody(energy);
        }

        const result = spawn.spawnCreep(body, newName, {
            memory: {
                role: role,
                working: false,
                customName: newName
            }
        });

        if(result === OK) {
            console.log(`Spawning new ${role}: ${newName}`);
        }
    },

    getBuilderBody: function(energy) {
        if(energy >= 800) {
            return [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if(energy >= 550) {
            return [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
        return [WORK, CARRY, MOVE, MOVE];
    },

    getUpgraderBody: function(energy) {
        if(energy >= 800) {
            return [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if(energy >= 550) {
            return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        return [WORK, WORK, CARRY, MOVE];
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
    },

    getHaulerBody: function(energy) {
        if(energy >= 600) {
            return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
        return [CARRY, CARRY, CARRY, MOVE, MOVE];
    },

    spawnExtraBuilders: function(room, constructionSites, currentBuilders) {
        // Spawn more builders if we have lots of construction
        if(constructionSites.length > 5 && currentBuilders < 8 && 
           room.energyAvailable >= room.energyCapacityAvailable * 0.8) {
            return true;
        }
        return false;
    }
}; 