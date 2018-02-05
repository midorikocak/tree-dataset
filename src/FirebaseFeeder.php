<?php

namespace MidoriKocak;

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;

/**
 * Class FirebaseFeeder
 * @package MidoriKocak
 */
class FirebaseFeeder
{
    const API_KEY = 'AIzaSyCHvVRs9NBZQOWzqvUS2oiFqpxMx4whPaQ';
    const SERVICE_ACCOUNT_FILE = 'treedataset-firebase-adminsdk-o7v9l-2c932b5ea3.json';
    const APP_URL = 'https://treedataset.firebaseio.com';

    private $serviceAccount;
    private $apiKey;
    private $firebase;
    private $database;

    /**
     * FirebaseFeeder constructor.
     */
    public function __construct()
    {
        $serviceAccount = ServiceAccount::fromJsonFile(self::SERVICE_ACCOUNT_FILE);
        $apiKey = self::API_KEY;
        $this->firebase = (new Factory)
            ->withServiceAccountAndApiKey($serviceAccount, $apiKey)
            ->withDatabaseUri('https://treedataset.firebaseio.com')
            ->create();
        $this->database = $this->firebase->getDatabase();
    }

    /**
     * @param $root
     */
    public function bfs($root)
    {
        $queue = [];
        array_push($queue, ['parent' => '', 'node' => $root]);
        while (!empty($queue)) {
            $item = array_shift($queue);
            $node = $item['node'];
            $parent = $item['parent'];
            $size = $node->size - 1;

            if ($parent != "") $name = $parent . " > " . $node->name;
            else $name = $node->name;
            echo "Node: ".$node->id." saved to firebase." . "\n";
            if ($this->database->getReference($node->id)->getValue() == null) {
                $this->database->getReference($node->id)->set(
                    ['name' => $name, 'size' => $size]
                );
            }
            if (!empty($node->children)) {
                foreach ($node->children as $subnode) {
                    array_push($queue, ['parent' => $name, 'node' => $subnode]);
                }
            } elseif ($node->size != 0) {
                $node = ImageNetNode::nodeFactory($node->id);
                foreach ($node->children as $subnode) {
                    array_push($queue, ['parent' => $name, 'node' => $subnode]);
                }
            }
        }
    }
}