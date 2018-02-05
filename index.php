<?php

require 'vendor/autoload.php';

$firebaseFeeder = new \MidoriKocak\FirebaseFeeder();
$rootId = 82127;

try {
    $root = \MidoriKocak\ImageNetNode::nodeFactory($rootId);
    $firebaseFeeder->bfs($root);
} catch (Exception $e) {
    // Has to continue to feed data even exception
    $root = \MidoriKocak\ImageNetNode::nodeFactory($rootId);
    $firebaseFeeder->bfs($root);
}