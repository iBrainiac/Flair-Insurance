// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Flare FTSO Registry Interface
interface IFtsoRegistry {
    function getCurrentPrice(string memory _symbol) external view returns (uint256 _price, uint256 _timestamp, uint256 _decimals);
    function getCurrentPriceWithDecimals(string memory _symbol) external view returns (uint256 _price, uint256 _timestamp, uint256 _decimals);
}

/**
 * @title WeatherInsurance
 * @dev Smart contract for decentralized crop insurance using Flare FTSO price feeds
 * @author FlareWeather Team
 */
contract WeatherInsurance is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    // Role definitions
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // Flare FTSO Registry
    IFtsoRegistry public immutable ftsoRegistry;
    
    // Contract state
    uint256 private policyCounter;
    uint256 public totalPremiumsCollected;
    uint256 public totalPayoutsProcessed;
    
    // Policy structure
    struct Policy {
        uint256 policyId;
        address farmer;
        uint256 premium;              // Premium paid in FLR
        uint256 coverageAmount;       // Coverage amount in USD (scaled by 1e18)
        uint256 createdAt;
        uint256 expiryDate;
        bool isActive;
        bool claimed;
        PolicyType policyType;
        WeatherCondition condition;
        string location;              // GPS coordinates or region identifier
        bytes32 locationHash;         // Hash of location for privacy
    }
    
    // Policy types
    enum PolicyType {
        RAINFALL,
        TEMPERATURE,
        DROUGHT,
        FLOOD,
        COMBINED
    }
    
    // Weather condition thresholds
    struct WeatherCondition {
        int256 thresholdValue;        // Threshold value (scaled)
        uint256 measurementPeriod;    // Period in days
        bool isMinimumThreshold;      // true = payout if below threshold, false = payout if above
    }
    
    // Claim structure
    struct Claim {
        uint256 policyId;
        uint256 claimAmount;          // Amount in FLR
        uint256 processedAt;
        bytes32 weatherProof;         // Hash of weather data proof
        bool verified;
    }
    
    // Storage mappings
    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public farmerPolicies;
    mapping(uint256 => Claim) public claims;
    
    // Events
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed farmer,
        uint256 premium,
        uint256 coverageAmount,
        PolicyType policyType,
        string location
    );
    
    event PayoutProcessed(
        uint256 indexed policyId,
        address indexed farmer,
        uint256 payoutAmount,
        bytes32 weatherProof
    );
    
    event PolicyExpired(
        uint256 indexed policyId,
        address indexed farmer
    );
    
    event PremiumRefunded(
        uint256 indexed policyId,
        address indexed farmer,
        uint256 refundAmount
    );
    
    event FTSOPriceQueried(
        string symbol,
        uint256 price,
        uint256 timestamp
    );
    
    // Constructor
    constructor(address _ftsoRegistry) {
        require(_ftsoRegistry != address(0), "Invalid FTSO Registry address");
        
        ftsoRegistry = IFtsoRegistry(_ftsoRegistry);
        
        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BACKEND_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        
        policyCounter = 0;
    }
    
    // Modifiers
    modifier onlyBackend() {
        require(hasRole(BACKEND_ROLE, msg.sender), "Caller is not backend");
        _;
    }
    
    modifier onlyOracle() {
        require(hasRole(ORACLE_ROLE, msg.sender), "Caller is not oracle");
        _;
    }
    
    modifier validPolicy(uint256 _policyId) {
        require(_policyId > 0 && _policyId <= policyCounter, "Invalid policy ID");
        require(policies[_policyId].isActive, "Policy not active");
        require(!policies[_policyId].claimed, "Policy already claimed");
        require(block.timestamp <= policies[_policyId].expiryDate, "Policy expired");
        _;
    }
    
    /**
     * @dev Create a new insurance policy
     * @param _coverageAmount Coverage amount in USD (scaled by 1e18)
     * @param _policyType Type of weather insurance
     * @param _condition Weather condition thresholds
     * @param _location Location identifier
     * @param _durationDays Policy duration in days
     */
    function createPolicy(
        uint256 _coverageAmount,
        PolicyType _policyType,
        WeatherCondition memory _condition,
        string memory _location,
        uint256 _durationDays
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Premium must be greater than 0");
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");
        require(bytes(_location).length > 0, "Location required");
        
        // Calculate minimum premium based on coverage and current FLR price
        uint256 minimumPremium = calculateMinimumPremium(_coverageAmount);
        require(msg.value >= minimumPremium, "Insufficient premium");
        
        // Create policy
        policyCounter++;
        uint256 policyId = policyCounter;
        
        bytes32 locationHash = keccak256(abi.encodePacked(_location, msg.sender, block.timestamp));
        
        policies[policyId] = Policy({
            policyId: policyId,
            farmer: msg.sender,
            premium: msg.value,
            coverageAmount: _coverageAmount,
            createdAt: block.timestamp,
            expiryDate: block.timestamp + (_durationDays * 1 days),
            isActive: true,
            claimed: false,
            policyType: _policyType,
            condition: _condition,
            location: _location,
            locationHash: locationHash
        });
        
        // Update farmer's policy list
        farmerPolicies[msg.sender].push(policyId);
        
        // Update contract state
        totalPremiumsCollected = totalPremiumsCollected.add(msg.value);
        
        emit PolicyCreated(
            policyId,
            msg.sender,
            msg.value,
            _coverageAmount,
            _policyType,
            _location
        );
    }
    
    /**
     * @dev Process insurance payout (called by backend after weather verification)
     * @param _policyId Policy ID to process
     * @param _weatherProof Hash of weather data proof
     */
    function processPayout(
        uint256 _policyId,
        bytes32 _weatherProof
    ) external nonReentrant onlyBackend validPolicy(_policyId) {
        Policy storage policy = policies[_policyId];
        
        // Calculate payout amount in FLR based on current price
        uint256 payoutAmount = calculatePayoutAmount(policy.coverageAmount);
        
        // Ensure contract has sufficient balance
        require(address(this).balance >= payoutAmount, "Insufficient contract balance");
        
        // Mark policy as claimed
        policy.claimed = true;
        policy.isActive = false;
        
        // Record claim
        claims[_policyId] = Claim({
            policyId: _policyId,
            claimAmount: payoutAmount,
            processedAt: block.timestamp,
            weatherProof: _weatherProof,
            verified: true
        });
        
        // Update contract state
        totalPayoutsProcessed = totalPayoutsProcessed.add(payoutAmount);
        
        // Transfer payout to farmer
        (bool success, ) = payable(policy.farmer).call{value: payoutAmount}("");
        require(success, "Payout transfer failed");
        
        emit PayoutProcessed(_policyId, policy.farmer, payoutAmount, _weatherProof);
    }
    
    /**
     * @dev Mark policy as expired (called by backend)
     * @param _policyId Policy ID to expire
     */
    function expirePolicy(uint256 _policyId) external onlyBackend {
        require(_policyId > 0 && _policyId <= policyCounter, "Invalid policy ID");
        require(policies[_policyId].isActive, "Policy not active");
        require(block.timestamp > policies[_policyId].expiryDate, "Policy not yet expired");
        
        policies[_policyId].isActive = false;
        
        emit PolicyExpired(_policyId, policies[_policyId].farmer);
    }
    
    /**
     * @dev Get current FLR/USD price from FTSO
     * @return price Current FLR price in USD (scaled)
     * @return timestamp Price timestamp
     * @return decimals Price decimals
     */
    function getFLRUSDPrice() public view returns (uint256 price, uint256 timestamp, uint256 decimals) {
        try ftsoRegistry.getCurrentPriceWithDecimals("FLR") returns (uint256 _price, uint256 _timestamp, uint256 _decimals) {
            return (_price, _timestamp, _decimals);
        } catch {
            // Fallback to standard price call
            return ftsoRegistry.getCurrentPrice("FLR");
        }
    }
    
    /**
     * @dev Calculate minimum premium based on coverage amount and current FLR price
     * @param _coverageAmount Coverage amount in USD (scaled by 1e18)
     * @return minimumPremium Minimum premium in FLR
     */
    function calculateMinimumPremium(uint256 _coverageAmount) public view returns (uint256) {
        (uint256 flrPrice, , uint256 decimals) = getFLRUSDPrice();
        
        // Premium is 5% of coverage amount
        uint256 premiumUSD = _coverageAmount.mul(5).div(100);
        
        // Convert USD to FLR
        uint256 premiumFLR = premiumUSD.mul(10**decimals).div(flrPrice);
        
        return premiumFLR;
    }
    
    /**
     * @dev Calculate payout amount in FLR based on USD coverage
     * @param _coverageAmount Coverage amount in USD (scaled by 1e18)
     * @return payoutAmount Payout amount in FLR
     */
    function calculatePayoutAmount(uint256 _coverageAmount) public view returns (uint256) {
        (uint256 flrPrice, , uint256 decimals) = getFLRUSDPrice();
        
        // Convert USD coverage to FLR
        uint256 payoutFLR = _coverageAmount.mul(10**decimals).div(flrPrice);
        
        return payoutFLR;
    }
    
    /**
     * @dev Get policy details
     * @param _policyId Policy ID
     * @return Policy details
     */
    function getPolicy(uint256 _policyId) external view returns (Policy memory) {
        require(_policyId > 0 && _policyId <= policyCounter, "Invalid policy ID");
        return policies[_policyId];
    }
    
    /**
     * @dev Get farmer's policies
     * @param _farmer Farmer address
     * @return Array of policy IDs
     */
    function getFarmerPolicies(address _farmer) external view returns (uint256[] memory) {
        return farmerPolicies[_farmer];
    }
    
    /**
     * @dev Get claim details
     * @param _policyId Policy ID
     * @return Claim details
     */
    function getClaim(uint256 _policyId) external view returns (Claim memory) {
        return claims[_policyId];
    }
    
    /**
     * @dev Get contract statistics
     * @return totalPolicies Total number of policies created
     * @return totalPremiums Total premiums collected
     * @return totalPayouts Total payouts processed
     * @return contractBalance Current contract balance
     */
    function getContractStats() external view returns (
        uint256 totalPolicies,
        uint256 totalPremiums,
        uint256 totalPayouts,
        uint256 contractBalance
    ) {
        return (
            policyCounter,
            totalPremiumsCollected,
            totalPayoutsProcessed,
            address(this).balance
        );
    }
    
    // Admin functions
    
    /**
     * @dev Grant backend role to address
     * @param _backend Backend address
     */
    function grantBackendRole(address _backend) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(BACKEND_ROLE, _backend);
    }
    
    /**
     * @dev Grant oracle role to address
     * @param _oracle Oracle address
     */
    function grantOracleRole(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ORACLE_ROLE, _oracle);
    }
    
    /**
     * @dev Emergency pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw (only for unclaimed expired policies)
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Withdrawal failed");
    }
    
    // Receive function to accept FLR deposits
    receive() external payable {
        // Allow contract to receive FLR for payouts
    }
    
    // Fallback function
    fallback() external payable {
        revert("Function not found");
    }
}