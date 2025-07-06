// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// For Flare integration, we'll use interfaces directly
// The flare-periphery-contracts package contains deployed addresses, not source code

interface IFtso {
    function getCurrentPrice() external view returns (uint256, uint256);
    function getEpochPrice(uint256 _epochId) external view returns (uint256, uint256);
}

interface IFlareContractRegistry {
    function getContractAddressByName(string calldata _name) external view returns (address);
}

contract FlareTest {
    string public message = "Flare integration working!";
    
    // Flare Contract Registry address on Coston2
    address public constant FLARE_CONTRACT_REGISTRY = 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019;
    
    // Basic test function
    function testFlareImport() public pure returns (bool) {
        return true;
    }
    
    // Test that we can interact with the network
    function getBlockNumber() public view returns (uint256) {
        return block.number;
    }
    
    // Test that we can get network info
    function getChainId() public view returns (uint256) {
        return block.chainid;
    }
    
    // Test Flare contract registry
    function getFlareContractAddress(string memory contractName) public view returns (address) {
        IFlareContractRegistry registry = IFlareContractRegistry(FLARE_CONTRACT_REGISTRY);
        return registry.getContractAddressByName(contractName);
    }
    
    // Test FTSO price feed (example)
    function getFtsoPrice(string memory symbol) public view returns (uint256 price, uint256 timestamp) {
        IFlareContractRegistry registry = IFlareContractRegistry(FLARE_CONTRACT_REGISTRY);
        address ftsoAddress = registry.getContractAddressByName(symbol);
        
        if (ftsoAddress != address(0)) {
            IFtso ftso = IFtso(ftsoAddress);
            return ftso.getCurrentPrice();
        }
        
        return (0, 0);
    }
}