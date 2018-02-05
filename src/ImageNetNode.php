<?php

namespace MidoriKocak;

/**
 * Class ImageNetNode
 * @package MidoriKocak
 */
class ImageNetNode
{
    /**
     * @var string
     */
    public $name;

    /**
     * @var int
     */
    public $id;

    /**
     * @var int
     */
    public $size;

    /**
     * @var array
     */
    public $children;

    /**
     * @var
     */
    public $flatName;


    /**
     * ImageNetNode constructor.
     * @param int $id
     * @param string $name
     * @param int $size
     */
    public function __construct(int $id, string $name, int $size)
    {
        $this->id = $id;
        $this->size = $size;
        $this->name = $name;
        $this->children = [];
    }

    /**
     * @param ImageNetNode $node
     */
    public function addChildren(ImageNetNode $node)
    {
        $this->children[$node->id] = $node;
    }

    /**
     * @return array
     */
    public function toArray()
    {
        $node = [];
        $node['id'] = $this->id;
        $node['name'] = $this->name;
        $node['size'] = $this->size;
        $node['children'] = [];
        foreach ($this->children as $subnode) {
            $node['children'][$subnode->id] = $subnode->toArray();
        }

        return $node;
    }

    /**
     * @param int $id
     * @return ImageNetNode
     */
    public static function nodeFactory(int $id)
    {
        $urlPrefix = "http://imagenet.stanford.edu/python/tree.py/SubtreeXML?rootid=";
        $node = simplexml_load_file($urlPrefix . $id);
        $imageNetNode = new ImageNetNode((int)$node['synsetid'], (string)$node['words'], (int)$node['subtree_size']);
        foreach ($node->children() as $subnodeData) {
            $subnode = new ImageNetNode((int)$subnodeData['synsetid'], (string)$subnodeData['words'], (int)$subnodeData['subtree_size']);
            $imageNetNode->addChildren($subnode);
        }
        return $imageNetNode;
    }
}