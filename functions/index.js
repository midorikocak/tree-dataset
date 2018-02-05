const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.graph = functions.https.onRequest((request, response) => {
    var db = admin.database();
    var ref = db.ref();

    var nodeMap = {};
    var edgeMap = {};

    var nodes = [];
    var edges = [];

    ref.once('value', function (snapshot) {
        // O(V) size of vertices
        snapshot.forEach(function (childSnapshot) {

            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();

            var flatName = childData.name;
            if (flatName) {
                var keys = flatName.split(' > ');
                var size = childData.size;
                for (var level = 0; level < keys.length; level++) {
                    if (level > 0) {
                        var edgeId = keys[level - 1] + " > " + keys[level];
                        if (!edgeMap[edgeId]) {
                            var newEdge = {
                                id: edgeId,
                                name: "CONTAINS",
                                type_id: "1",
                                from: keys[level - 1],
                                to: keys[level],
                                weight:1,
                                directed:0,
                                properties:{
                                }
                            };
                            edgeMap[edgeId] = newEdge;
                            edges.push(newEdge);
                        }
                    }
                    var existingNode = nodeMap[keys[level]];
                    if (!existingNode) {
                        var newNode = {
                            id: keys[level],
                            type: "IMAGESET",
                            type_id: "1",
                            name: keys[level],
                            properties:{
                                size: 0
                            }

                        };
                        if (level == keys.length - 1) newNode.properties.size = size;
                        nodeMap[keys[level]] = newNode;
                        nodes.push(newNode);
                    }
                }
            }

        });

        var responseData = {};
        var graph = {};
        graph.id = ref.push().key;
        graph.name = "ImageSet Database";
        graph.subtitle = null;
        graph.description = null;
        graph.status = 0;
        graph.nodes = nodes;
        graph.edges = edges;
        var edgeTypes = [
            {
                "id": "1",
                "name": "CONTAINS",
                "name_alias":null,
                "description":null,
                "weighted":1,
                "directed":0,
                "durational":null,
                "color":"#e377c2",
                "properties":[
                ]
            }
        ];

        var nodeTypes = [
            {
                "id":"1",
                "name":"IMAGESET",
                "name_alias":null,
                "description":null,
                "image":null,
                "image_as_icon":false,
                "color":"#e377c2",
                "properties":[
                    {
                    }
                ],
                "hide_name":null,
                "size":"metric_degree",
                "size_limit":48
            }
        ];
        graph.nodeTypes = nodeTypes;
        graph.edgeTypes = edgeTypes;

        responseData.graph = graph;

        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        response.setHeader('Access-Control-Allow-Credentials', true);
        response.send(JSON.stringify(responseData));
    });
});

exports.withChildren = functions.https.onRequest((request, response) => {
    var tree = [];

    // Using maps for O(1) lookups
    // Adds to space complexity O(V);
    var map = {};
    var db = admin.database();
    var ref = db.ref();
    ref.once('value', function (snapshot) {
        // O(V) size of vertices
        snapshot.forEach(function (childSnapshot) {
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();

            var flatName = childData.name;
            if (flatName) {
                var keys = flatName.split(' > ');
                var size = childData.size;

                var currentLevel = tree;
                for (var level = 0; level < keys.length; level++) {
                    var existingPath = map[keys[level]];
                    if (existingPath) {
                        currentLevel = existingPath.children;
                        if (level == keys.length - 1) existingPath.size = size;
                    } else {
                        // Total number of children is EDGE SIZE: E
                        var newItem = {
                            name: keys[level],
                            size: 0,
                            children: []
                        };
                        if (level == keys.length - 1) newItem.size = size;
                        map[keys[level]] = newItem;
                        if (currentLevel.children) currentLevel.children.push(newItem);
                        else currentLevel.push(newItem);
                        currentLevel = newItem.children;
                    }
                }
            }
        });
        // Final complexity is O(V*E) because of Breadth First Search with a queue.
        /*
         Vikipedia definition:

         When working with graphs that are too large to store explicitly (or infinite),
         it is more practical to describe the complexity of breadth-first search in different terms:
         to find the nodes that are at distance d from the start node (measured in number of edge traversals),
         BFS takes O(bd + 1) time and memory, where b is the "branching factor" of the graph (the average out-degree).
         */
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        response.setHeader('Access-Control-Allow-Credentials', true);
        response.send(JSON.stringify(tree));
    });
});


exports.jsTree = functions.https.onRequest((request, response) => {
    var tree = [];

    // Using maps for O(1) lookups
    // Adds to space complexity O(V);
    var map = {};
    var db = admin.database();
    var ref = db.ref();
    ref.once('value', function (snapshot) {
        // O(V) size of vertices
        snapshot.forEach(function (childSnapshot) {
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();

            var flatName = childData.name;
            if (flatName) {
                var keys = flatName.split(' > ');
                var size = childData.size;

                var currentLevel = tree;
                for (var level = 0; level < keys.length; level++) {
                    var existingPath = map[keys[level]];
                    if (existingPath) {
                        currentLevel = existingPath.children;
                        if (level == keys.length - 1) existingPath.text = keys[level]+" ("+size+")";
                    } else {
                        // Total number of children is EDGE SIZE: E
                        var newItem = {
                            id: ref.push().key,
                            text: keys[level],
                            state:{
                                opened: false,
                                disabled: false,
                                selected: false
                            },
                            children: []
                        };
                        if (level == keys.length - 1) newItem.text = keys[level]+" ("+size+")";
                        map[keys[level]] = newItem;
                        if (currentLevel.children) currentLevel.children.push(newItem);
                        else currentLevel.push(newItem);
                        currentLevel = newItem.children;
                    }
                }
            }
        });
        // Final complexity is O(V*E) because of Breadth First Search with a queue.
        /*
         Vikipedia definition:

         When working with graphs that are too large to store explicitly (or infinite),
         it is more practical to describe the complexity of breadth-first search in different terms:
         to find the nodes that are at distance d from the start node (measured in number of edge traversals),
         BFS takes O(bd + 1) time and memory, where b is the "branching factor" of the graph (the average out-degree).
         */
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        response.setHeader('Access-Control-Allow-Credentials', true);
        response.send(JSON.stringify(tree));
    });
});