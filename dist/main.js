'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var main = {};

var role_harvester = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // State management
        if(creep.memory.delivering && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.delivering = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.delivering && creep.store.getFreeCapacity() == 0) {
            creep.memory.delivering = true;
            creep.say('📦 deliver');
        }

        // Smart source selection
        if(!creep.memory.sourceId || Game.time % 100 === 0) {
            const sources = creep.room.find(FIND_SOURCES);
            let bestSource = null;
            let bestScore = -Infinity;

            sources.forEach(source => {
                // Count current harvesters at this source
                const harvestersHere = _.filter(Game.creeps, c => 
                    c.memory.role === 'harvester' && 
                    c.memory.sourceId === source.id
                ).length;

                // Calculate score based on multiple factors
                const distanceToSource = creep.pos.findPathTo(source).length;
                const distanceToSpawn = source.pos.findPathTo(creep.room.find(FIND_MY_SPAWNS)[0]).length;
                const energyAvailable = source.energy;
                
                // Score formula: higher is better
                const score = (energyAvailable * 0.5) - 
                            (distanceToSource * 0.3) - 
                            (distanceToSpawn * 0.2) - 
                            (harvestersHere * 50); // Heavy penalty for multiple harvesters

                if(score > bestScore) {
                    bestScore = score;
                    bestSource = source;
                }
            });

            if(bestSource) {
                creep.memory.sourceId = bestSource.id;
                creep.say('🎯 new src');
            }
        }

        if(!creep.memory.delivering) {
            const source = Game.getObjectById(creep.memory.sourceId);
            if(source) {
                if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {
                        visualizePathStyle: {stroke: '#ffaa00'},
                        reusePath: 20
                    });
                }
            }
        } else {
            // Prioritized delivery targets
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_EXTENSION) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });

            // Sort targets by priority and distance
            targets.sort((a, b) => {
                const distA = creep.pos.findPathTo(a).length;
                const distB = creep.pos.findPathTo(b).length;
                
                // Prioritize spawns when energy is low
                if(a.structureType === STRUCTURE_SPAWN && 
                   a.store.getFreeCapacity(RESOURCE_ENERGY) > 0) return -1;
                if(b.structureType === STRUCTURE_SPAWN && 
                   b.store.getFreeCapacity(RESOURCE_ENERGY) > 0) return 1;
                
                return distA - distB; // Otherwise, prefer closer targets
            });

            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {
                        visualizePathStyle: {stroke: '#ffffff'},
                        reusePath: 20
                    });
                }
            }
        }
    }
};

// Don't use these
// const roleHarvester = require('./role.harvester.js');  // wrong
// const roleHarvester = require('/role.harvester');      // wrong

var spawn_manager = {
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
    },

    getHaulerBody: function(energy) {
        if(energy >= 600) {
            return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
        return [CARRY, CARRY, CARRY, MOVE, MOVE];
    }
};

var role_upgrader = {
    run: function(creep) {
        if(creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }

        if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {
                    visualizePathStyle: {stroke: '#ffffff'},
                    reusePath: 5,
                    range: 3
                });
            }
            
            creep.room.visual.text(
                `RCL ${creep.room.controller.level}: ${creep.room.controller.progress}/${creep.room.controller.progressTotal}`,
                creep.room.controller.pos.x,
                creep.room.controller.pos.y - 1,
                {align: 'center', opacity: 0.8}
            );
        }
        else {
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {
                    visualizePathStyle: {stroke: '#ffaa00'},
                    reusePath: 5
                });
            }
        }
    }
};

var tower_manager = {
    run: function(room) {
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: structure => structure.structureType === STRUCTURE_TOWER
        });

        towers.forEach(tower => {
            // Priority 1: Attack hostile creeps
            const hostileCreep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(hostileCreep) {
                tower.attack(hostileCreep);
                return;
            }

            // Priority 2: Heal damaged creeps
            const damagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: creep => creep.hits < creep.hitsMax
            });
            if(damagedCreep) {
                tower.heal(damagedCreep);
                return;
            }

            // Priority 3: Repair critical structures (ramparts, walls below threshold)
            const criticalStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: structure => {
                    if(structure.structureType === STRUCTURE_RAMPART) {
                        return structure.hits < 10000;
                    }
                    if(structure.structureType === STRUCTURE_WALL) {
                        return structure.hits < 10000;
                    }
                    return false;
                }
            });
            if(criticalStructure) {
                tower.repair(criticalStructure);
                return;
            }

            // Priority 4: Repair roads (only if tower has >50% energy)
            if(tower.store.energy > tower.store.getCapacity(RESOURCE_ENERGY) * 0.5) {
                const damagedRoad = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: structure => 
                        structure.structureType === STRUCTURE_ROAD &&
                        structure.hits < structure.hitsMax * 0.7
                });
                if(damagedRoad) {
                    tower.repair(damagedRoad);
                }
            }
        });
    }
};

var visual_manager = {
    run: function(room) {
        // Display creep names and roles
        for(let name in Game.creeps) {
            const creep = Game.creeps[name];
            if(creep.room.name === room.name) {
                // Display custom name above creep
                const displayName = creep.memory.customName || creep.name;
                room.visual.text(
                    `${displayName} (${creep.memory.role})`,
                    creep.pos.x,
                    creep.pos.y - 0.5,
                    {
                        align: 'center',
                        opacity: 1,
                        color: this.getRoleColor(creep.memory.role),
                        stroke: '#000000',
                        strokeWidth: 0.2,
                        font: 0.5
                    }
                );
            }
        }
    },

    getRoleColor: function(role) {
        const colors = {
            harvester: '#ffaa00',
            upgrader: '#33ff33',
            builder: '#00aaff'
        };
        return colors[role] || '#ffffff';
    }
};

var role_builder = {
    run: function(creep) {
        // State management
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say('🔄');
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
            creep.say('🚧');
        }

        if(creep.memory.building) {
            // Get all construction sites
            const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            
            if(sites.length) {
                // Sort sites by priority and progress
                const prioritizedSites = this.prioritizeConstructionSites(sites);
                const target = prioritizedSites[0];

                // Log construction progress every 50 ticks
                if(Game.time % 50 === 0) {
                    console.log(`🏗️ Building ${target.structureType}: ${Math.floor((target.progress/target.progressTotal) * 100)}% complete`);
                }

                if(creep.build(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {stroke: '#ffffff'}
                    });
                }
            } else {
                // Repair logic - prioritize roads and containers
                const repairTarget = this.findRepairTarget(creep);
                if(repairTarget) {
                    if(creep.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(repairTarget, {
                            visualizePathStyle: {stroke: '#ffffff'}
                        });
                    }
                }
            }
        } else {
            // Harvesting logic
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {
                    visualizePathStyle: {stroke: '#ffaa00'}
                });
            }
        }
    },

    prioritizeConstructionSites: function(sites) {
        // Priority order: Spawn > Extension > Tower > Storage > Road > Container
        const priority = {
            'spawn': 1,
            'extension': 2,
            'tower': 3,
            'storage': 4,
            'road': 5,
            'container': 6
        };

        return sites.sort((a, b) => {
            // First sort by priority
            const priorityDiff = (priority[a.structureType] || 99) - (priority[b.structureType] || 99);
            if(priorityDiff !== 0) return priorityDiff;
            
            // Then by progress percentage
            const aProgress = a.progress / a.progressTotal;
            const bProgress = b.progress / b.progressTotal;
            return bProgress - aProgress; // Higher progress first
        });
    },

    findRepairTarget: function(creep) {
        return creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: structure => {
                if(structure.structureType === STRUCTURE_ROAD) {
                    return structure.hits < structure.hitsMax * 0.7;
                }
                if(structure.structureType === STRUCTURE_CONTAINER) {
                    return structure.hits < structure.hitsMax * 0.8;
                }
                return false;
            }
        });
    }
};

var road_planner = {
    run: function(room) {
        // Only run road planning every 100 ticks to save CPU
        if (Game.time % 100 !== 0) return;

        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;

        // Find all important destinations
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;
        
        // Plan and build roads from spawn to each source
        sources.forEach(source => {
            this.planRoad(room, spawn.pos, source.pos, '#ffffff');
        });

        // Plan and build road to controller
        if (controller) {
            this.planRoad(room, spawn.pos, controller.pos, '#ffaa00');
        }

        // Plan roads between sources for efficiency
        if (sources.length >= 2) {
            this.planRoad(room, sources[0].pos, sources[1].pos, '#ffffff');
        }
    },

    planRoad: function(room, fromPos, toPos, visualColor) {
        // Find path, avoiding swamps when possible
        const path = room.findPath(fromPos, toPos, {
            ignoreCreeps: true,
            swampCost: 5,
            plainCost: 2,
            ignoreRoads: true,
        });

        // Visualize the planned path
        room.visual.poly(path.map(p => [p.x, p.y]), {
            stroke: visualColor,
            lineStyle: 'dashed',
            opacity: 0.3
        });

        // Check for existing roads and construction sites
        path.forEach(pos => {
            const structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
            const constructionSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y);
            
            // Skip if there's already a road or construction site
            if (structures.some(s => s.structureType === STRUCTURE_ROAD) || 
                constructionSites.length > 0) {
                return;
            }

            // Create construction site if we have enough energy
            if (room.energyAvailable > room.energyCapacityAvailable * 0.5) {
                const result = room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                if (result === OK) {
                    console.log(`🛣️ Planned road at ${pos.x},${pos.y}`);
                }
            }
        });
    }
};

// Import all required modules
const roleHarvester = role_harvester;
const spawnManager = spawn_manager;
const roleUpgrader = role_upgrader;
const towerManager = tower_manager;
const visualManager = visual_manager;
const roleBuilder = role_builder;
const roadPlanner = road_planner;

// Restore your enhanced visuals function
function enhancedVisuals(room) {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if(spawn) {
        // Show Annapolis
        room.visual.text('🏛️ Annapolis',
            spawn.pos.x, spawn.pos.y - 1,
            {color: '#ffffff', stroke: '#000000', strokeWidth: 0.2, font: 0.7}
        );

        // Show future tower location
        room.visual.text('🗼 Future Tower',
            spawn.pos.x + 2, spawn.pos.y + 1,
            {color: '#ff0000', stroke: '#000000', strokeWidth: 0.2, font: 0.5}
        );
        
        // Visualize tower range
        room.visual.circle(spawn.pos.x + 2, spawn.pos.y + 2, {
            radius: 5,
            fill: 'transparent',
            stroke: '#ff0000',
            strokeWidth: 0.2,
            opacity: 0.3
        });
    }

    // Show Maryland city names at sources - Baltimore and Frederick swapped
    const sources = room.find(FIND_SOURCES);
    sources.forEach((source, index) => {
        const name = index === 0 ? 'Baltimore' : 'Frederick';  // Swapped the names here
        room.visual.text(`⚡ ${name}`,
            source.pos.x, source.pos.y - 1,
            {color: '#ffaa00', stroke: '#000000', strokeWidth: 0.2, font: 0.7}
        );

        // Show energy stats
        room.visual.text(
            `Energy: ${source.energy}/${source.energyCapacity}`,
            source.pos.x, source.pos.y - 0.5,
            {color: '#ffffff', stroke: '#000000', strokeWidth: 0.1, font: 0.5}
        );
    });

    // Show controller progress
    if(room.controller) {
        room.visual.text(
            `RCL ${room.controller.level}: ${room.controller.progress}/${room.controller.progressTotal}`,
            room.controller.pos.x, room.controller.pos.y - 1,
            {color: '#33ff33', stroke: '#000000', strokeWidth: 0.2, font: 0.7}
        );
    }

    // Visualize roads and paths
    visualizeRoads(room);
}

// Restore your road visualization
function visualizeRoads(room) {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if(!spawn) return;

    const sources = room.find(FIND_SOURCES);
    sources.forEach(source => {
        const path = room.findPath(spawn.pos, source.pos, {
            ignoreCreeps: true,
            swampCost: 2,
            plainCost: 2
        });
        
        room.visual.poly(path.map(p => [p.x, p.y]), {
            stroke: '#ffffff',
            lineStyle: 'dashed',
            opacity: 0.3
        });
    });

    // Visualize path to controller
    if(room.controller) {
        const controllerPath = room.findPath(spawn.pos, room.controller.pos, {
            ignoreCreeps: true,
            swampCost: 2,
            plainCost: 2
        });
        
        room.visual.poly(controllerPath.map(p => [p.x, p.y]), {
            stroke: '#ffaa00',
            lineStyle: 'dashed',
            opacity: 0.3
        });
    }
}

function showDetailedStatus() {
    // Only show creep names every 100 ticks instead of every 30
    const showCreepDetails = Game.time % 100 === 0;
    
    for(let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        const creeps = room.find(FIND_MY_CREEPS);
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        
        console.log(`\n=== Room ${roomName} Status ===`);
        
        // Energy and Controller status
        console.log(`Energy: ${room.energyAvailable}/${room.energyCapacityAvailable} (${Math.floor((room.energyAvailable/room.energyCapacityAvailable) * 100)}%)`);
        console.log(`Controller Level ${room.controller.level}: ${Math.floor((room.controller.progress/room.controller.progressTotal) * 100)}%`);
        
        // Construction Progress
        if(sites.length > 0) {
            console.log('\nConstruction Progress:');
            const sitesByType = _.groupBy(sites, 'structureType');
            for(let type in sitesByType) {
                const typeProgress = sitesByType[type].reduce((sum, site) => sum + site.progress, 0);
                const typeTotal = sitesByType[type].reduce((sum, site) => sum + site.progressTotal, 0);
                console.log(`${type}: ${Math.floor((typeProgress/typeTotal) * 100)}% (${sitesByType[type].length} sites)`);
            }
        }

        // Creep summary (always show)
        const roles = _.groupBy(creeps, c => c.memory.role);
        console.log('\nCreep Count:');
        for(let role in roles) {
            console.log(`${role}: ${roles[role].length}`);
        }

        // Detailed creep names (only every 100 ticks)
        if(showCreepDetails) {
            console.log('\nCreep Details:');
            for(let role in roles) {
                console.log(`${role}: ${roles[role].map(c => c.memory.customName).join(', ')}`);
            }
        }
    }
}

var loop = main.loop = function() {
    const mainLoopStart = Game.cpu.getUsed();

    // Batch memory cleanup (silently)
    if(Game.time % 100 === 0) {
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
    }

    // Run room logic and visualizations
    for(let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        enhancedVisuals(room);
        spawnManager.run();
        visualManager.run(room);
        roadPlanner.run(room);
        towerManager.run(room);

        room.visual.text(
            `Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`,
            1, 1,
            {align: 'left', opacity: 0.8}
        );
    }

    // Run creep logic
    const creeps = Game.creeps;
    Game.cpu.getUsed();
    for(let name in creeps) {
        const creep = creeps[name];
        switch(creep.memory.role) {
            case 'harvester':
                roleHarvester.run(creep);
                break;
            case 'upgrader':
                roleUpgrader.run(creep);
                break;
            case 'builder':
                roleBuilder.run(creep);
                break;
        }
    }

    // Performance reporting every 30 ticks
    if(Game.time % 30 === 0) {
        showDetailedStatus();
        const totalCPU = Game.cpu.getUsed() - mainLoopStart;
        console.log(`CPU: ${totalCPU.toFixed(2)}/${Game.cpu.limit} (${(totalCPU/Game.cpu.limit * 100).toFixed(1)}%)`);
    }
};

exports["default"] = main;
exports.loop = loop;
