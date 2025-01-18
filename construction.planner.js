module.exports = {
    EXTENSION_LAYOUTS: {
        // Bunker-style layout around spawn
        compact: [
            {x: -2, y: -2}, {x: -1, y: -2}, {x: 0, y: -2}, {x: 1, y: -2}, {x: 2, y: -2},
            {x: -2, y: -1}, {x: -1, y: -1},                {x: 1, y: -1}, {x: 2, y: -1},
            {x: -2, y: 0},                                                 {x: 2, y: 0},
            {x: -2, y: 1},  {x: -1, y: 1},                 {x: 1, y: 1},  {x: 2, y: 1},
            {x: -2, y: 2},  {x: -1, y: 2},  {x: 0, y: 2},  {x: 1, y: 2},  {x: 2, y: 2}
        ],
        // Compact fortress pattern around spawn
        fortress: [
            // Inner ring (6 extensions)
            {x: -1, y: -1}, {x: 1, y: -1},
            {x: -1, y: 1},  {x: 1, y: 1},
            {x: 0, y: -1},  {x: 0, y: 1},
            
            // Middle ring (12 extensions)
            {x: -2, y: -2}, {x: -1, y: -2}, {x: 0, y: -2}, {x: 1, y: -2}, {x: 2, y: -2},
            {x: -2, y: 0},                                                  {x: 2, y: 0},
            {x: -2, y: 2},  {x: -1, y: 2},  {x: 0, y: 2},  {x: 1, y: 2},  {x: 2, y: 2},
            
            // Outer ring (for higher RCL)
            {x: -3, y: -1}, {x: -3, y: 0}, {x: -3, y: 1},
            {x: 3, y: -1},  {x: 3, y: 0},  {x: 3, y: 1},
            {x: -1, y: -3}, {x: 0, y: -3}, {x: 1, y: -3},
            {x: -1, y: 3},  {x: 0, y: 3},  {x: 1, y: 3}
        ]
    },

    MARYLAND_LANDMARKS: {
        towers: [
            { name: "Fort McHenry", pos: {x: 3, y: 3} },          // Better defensive position near spawn
            { name: "Fort Washington", pos: {x: 3, y: -14} },      // Adjusted to 7 units right, near North Beach
            { name: "Fort Baltimore", pos: {x: -2, y: -8} },       // Between Trevor and Jocelyn builders
            { name: "Fort Meade", pos: {x: -8, y: -6} }           // Keeping this position at the chokepoint
        ],
        extensions: [
            "Fairhaven", "North Beach", "Deale", "Shady Side", 
            "Mayo", "Arnold", "Severna Park", "Pasadena",
            "Gibson Island", "Lake Shore", "Cape St. Claire", "Galesville"
        ]
    },

    visualizeLandmarks: function(room) {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(!spawn) return;

        // Visualize existing and planned towers
        this.MARYLAND_LANDMARKS.towers.forEach(tower => {
            const towerX = spawn.pos.x + tower.pos.x;
            const towerY = spawn.pos.y + tower.pos.y;

            // Check if tower exists using room.lookForAt
            const existingTower = room.lookForAt(LOOK_STRUCTURES, towerX, towerY)
                .find(s => s.structureType === STRUCTURE_TOWER);

            const color = existingTower ? '#00ff00' : '#ff0000';
            
            // Draw tower name and range
            room.visual.text(
                `🗼 ${tower.name}`,
                towerX, towerY - 1,
                {color: color, stroke: '#000000', strokeWidth: 0.2, font: 0.5}
            );

            // Show tower range
            room.visual.circle(towerX, towerY, {
                radius: 5,
                fill: 'transparent',
                stroke: color,
                strokeWidth: 0.2,
                opacity: 0.3
            });
        });

        // Visualize extensions
        const extensions = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        });

        extensions.forEach((extension, index) => {
            if(index < this.MARYLAND_LANDMARKS.extensions.length) {
                room.visual.text(
                    `🏘️ ${this.MARYLAND_LANDMARKS.extensions[index]}`,
                    extension.pos.x, extension.pos.y - 0.5,
                    {color: '#ffffff', stroke: '#000000', strokeWidth: 0.1, font: 0.4}
                );
            }
        });
    },

    run: function(room) {
        // Run EVERY tick when no towers exist
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        });
        
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(!spawn) return;

        // Always try to build towers first at RCL 3+
        if(room.controller.level >= 3 && towers.length === 0) {
            this.planTowers(room, spawn);
        }
        
        // Only plan other structures every 20 ticks
        if(Game.time % 20 === 0) {
            this.planExtensions(room, spawn);
            this.planContainers(room);
            // Temporarily disable road planning until towers are up
            // this.planExtensionRoads(room, spawn);
        }
        
        this.visualizeLandmarks(room);
    },

    planContainers: function(room, spawn) {
        const sources = room.find(FIND_SOURCES);
        const containers = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        });

        // Plan container near controller
        if(room.controller && !this.hasNearbyContainer(room.controller.pos, room)) {
            const controllerPos = this.findContainerPosition(room, room.controller.pos);
            if(controllerPos) {
                room.createConstructionSite(controllerPos.x, controllerPos.y, STRUCTURE_CONTAINER);
            }
        }

        // Plan containers near sources
        sources.forEach(source => {
            if(!this.hasNearbyContainer(source.pos, room)) {
                const sourcePos = this.findContainerPosition(room, source.pos);
                if(sourcePos) {
                    room.createConstructionSite(sourcePos.x, sourcePos.y, STRUCTURE_CONTAINER);
                }
            }
        });
    },

    planTowers: function(room, spawn) {
        if(room.controller.level >= 3) {
            // Try to build all possible towers
            this.MARYLAND_LANDMARKS.towers.forEach(tower => {
                const towerPos = {
                    x: spawn.pos.x + tower.pos.x,
                    y: spawn.pos.y + tower.pos.y
                };

                // Check existing towers at this position
                const existingTower = room.lookForAt(LOOK_STRUCTURES, towerPos.x, towerPos.y)
                    .find(s => s.structureType === STRUCTURE_TOWER);
                
                if(!existingTower) {
                    // Clear any roads or other structures
                    const structures = room.lookForAt(LOOK_STRUCTURES, towerPos.x, towerPos.y);
                    structures.forEach(structure => {
                        if(structure.structureType === STRUCTURE_ROAD) {
                            structure.destroy();
                        }
                    });

                    // Create the tower construction site
                    const result = room.createConstructionSite(towerPos.x, towerPos.y, STRUCTURE_TOWER);
                    if(result === OK) {
                        console.log(`🏗️ Planning tower ${tower.name} at (${towerPos.x},${towerPos.y})`);
                        
                        // Visualize planned tower
                        room.visual.structure(towerPos.x, towerPos.y, STRUCTURE_TOWER, {
                            opacity: 0.5,
                            stroke: '#ff0000'
                        });
                        
                        // Show coverage
                        room.visual.circle(towerPos.x, towerPos.y, {
                            radius: 5,
                            fill: 'transparent',
                            stroke: '#ff0000',
                            opacity: 0.3
                        });
                    }
                }
            });
        }
    },

    planExtensions: function(room, spawn) {
        const maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
        const currentExtensions = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        });

        if(currentExtensions.length < maxExtensions) {
            const layout = this.EXTENSION_LAYOUTS.fortress;
            for(let i = currentExtensions.length; i < maxExtensions && i < layout.length; i++) {
                const pos = layout[i];
                const buildX = spawn.pos.x + pos.x;
                const buildY = spawn.pos.y + pos.y;
                
                if(this.isValidBuildPosition(room, {x: buildX, y: buildY})) {
                    room.createConstructionSite(buildX, buildY, STRUCTURE_EXTENSION);
                }
            }
        }
    },

    planExtensionRoads: function(room, x, y, spawnPos) {
        // Plan roads around extensions in a way that connects them
        const roadPositions = [
            {x: x, y: y-1},  // North
            {x: x+1, y: y},  // East
            {x: x, y: y+1},  // South
            {x: x-1, y: y}   // West
        ];

        roadPositions.forEach(pos => {
            if(this.isValidBuildPosition(room, pos)) {
                room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            }
        });
    },

    hasNearbyContainer: function(pos, room) {
        const nearbyContainers = room.lookForAtArea(
            LOOK_STRUCTURES,
            Math.max(0, pos.y - 1),
            Math.max(0, pos.x - 1),
            Math.min(49, pos.y + 1),
            Math.min(49, pos.x + 1),
            true
        );
        return nearbyContainers.some(item => item.structure.structureType === STRUCTURE_CONTAINER);
    },

    findContainerPosition: function(room, nearPos) {
        for(let x = -1; x <= 1; x++) {
            for(let y = -1; y <= 1; y++) {
                const pos = {
                    x: nearPos.x + x,
                    y: nearPos.y + y
                };
                if(this.isValidBuildPosition(room, pos)) {
                    return pos;
                }
            }
        }
        return null;
    },

    isValidBuildPosition: function(room, pos) {
        // Check boundaries
        if(pos.x < 2 || pos.x > 47 || pos.y < 2 || pos.y > 47) return false;

        // Check for existing structures or construction sites
        const structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
        const sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y);
        const terrain = room.lookForAt(LOOK_TERRAIN, pos.x, pos.y)[0];

        return structures.length === 0 && 
               sites.length === 0 && 
               terrain !== 'wall';
    },

    visualizeTowerCoverage: function(room) {
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        });

        towers.forEach((tower, index) => {
            // Show effective range (green)
            room.visual.circle(tower.pos.x, tower.pos.y, {
                radius: 5,
                fill: 'transparent',
                stroke: '#00ff00',
                strokeWidth: 0.15,
                opacity: 0.2
            });

            // Show optimal range (yellow)
            room.visual.circle(tower.pos.x, tower.pos.y, {
                radius: 3,
                fill: 'transparent',
                stroke: '#ffff00',
                strokeWidth: 0.15,
                opacity: 0.3
            });
        });
    }
}; 