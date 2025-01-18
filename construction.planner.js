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

    TOWER_POSITIONS: [
        {x: 2, y: 2},   // First tower - existing position
        {x: -2, y: -2}  // Second tower - opposite corner for better coverage
    ],

    MARYLAND_LANDMARKS: {
        towers: [
            { name: "Fort McHenry", pos: {x: 2, y: 2} },    // South tower
            { name: "Fort Washington", pos: {x: 0, y: -8} }  // Adjusted to protect Fairhaven
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
        // Only run every 100 ticks to save CPU
        if (Game.time % 100 !== 0) return;

        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if(!spawn) return;

        // Plan extensions first
        this.planExtensions(room, spawn);
        
        // Plan towers to protect the extensions
        this.planTowers(room, spawn);
        
        // Plan containers and roads
        this.planContainers(room);
        this.planExtensionRoads(room, spawn);
        
        // Add visualization
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
        if(room.controller.level >= 3) {  // First tower at RCL 3
            const towers = room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_TOWER
            });

            // Plan towers based on RCL and existing towers
            const maxTowers = CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level];
            
            for(let i = towers.length; i < maxTowers && i < this.TOWER_POSITIONS.length; i++) {
                const towerPos = {
                    x: spawn.pos.x + this.TOWER_POSITIONS[i].x,
                    y: spawn.pos.y + this.TOWER_POSITIONS[i].y
                };

                if(this.isValidBuildPosition(room, towerPos)) {
                    room.createConstructionSite(towerPos.x, towerPos.y, STRUCTURE_TOWER);
                    
                    // Visualize tower coverage
                    room.visual.circle(towerPos.x, towerPos.y, {
                        radius: 5,
                        fill: 'transparent',
                        stroke: '#ff0000',
                        strokeWidth: 0.15,
                        opacity: 0.3
                    });

                    // Add text label
                    room.visual.text(
                        `🗼 Tower ${i + 1}`,
                        towerPos.x, towerPos.y - 1,
                        {color: '#ff0000', font: 0.5}
                    );
                }
            }
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