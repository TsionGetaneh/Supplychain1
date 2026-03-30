// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    enum Status { Created, InTransit, Delivered }
    
    struct Product {
        uint256 id;
        string name;
        string description;
        address currentOwner;
        Status status;
        uint256 createdAt;
        address[] ownershipHistory;
        uint256[] timestamps;
    }

    mapping(uint256 => Product) public products;
    uint256 public productCount;

    event ProductCreated(uint256 indexed productId, string name, address indexed manufacturer);
    event OwnershipTransferred(uint256 indexed productId, address indexed oldOwner, address indexed newOwner);
    event StatusUpdated(uint256 indexed productId, Status newStatus);

    function createProduct(string memory _name, string memory _description) external returns (uint256) {
        productCount++;
        Product storage p = products[productCount];
        p.id = productCount;
        p.name = _name;
        p.description = _description;
        p.currentOwner = msg.sender;
        p.status = Status.Created;
        p.createdAt = block.timestamp;
        p.ownershipHistory.push(msg.sender);
        p.timestamps.push(block.timestamp);

        emit ProductCreated(productCount, _name, msg.sender);
        return productCount;
    }

    function transferProduct(uint256 _productId, address _newOwner) external {
        require(_productId > 0 && _productId <= productCount, "Product does not exist");
        Product storage p = products[_productId];
        require(p.currentOwner == msg.sender, "Only current owner can transfer");
        require(_newOwner != address(0), "Invalid address");
        
        p.currentOwner = _newOwner;
        p.ownershipHistory.push(_newOwner);
        p.timestamps.push(block.timestamp);

        emit OwnershipTransferred(_productId, msg.sender, _newOwner);
    }

    function updateStatus(uint256 _productId, Status _status) external {
        require(_productId > 0 && _productId <= productCount, "Product does not exist");
        Product storage p = products[_productId];
        require(p.currentOwner == msg.sender, "Only current owner can update status");
        require(uint256(_status) >= uint256(p.status), "Cannot revert status");
        
        p.status = _status;
        emit StatusUpdated(_productId, _status);
    }

    function getProduct(uint256 _productId) external view returns (
        uint256 id, string memory name, string memory description, 
        address currentOwner, Status status, uint256 createdAt
    ) {
        require(_productId > 0 && _productId <= productCount, "Product does not exist");
        Product memory p = products[_productId];
        return (p.id, p.name, p.description, p.currentOwner, p.status, p.createdAt);
    }

    function getProductHistory(uint256 _productId) external view returns (address[] memory, uint256[] memory) {
        require(_productId > 0 && _productId <= productCount, "Product does not exist");
        Product memory p = products[_productId];
        return (p.ownershipHistory, p.timestamps);
    }
}