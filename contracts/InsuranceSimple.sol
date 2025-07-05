// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract InsuranceSimple {
    address public insurer;
    uint256 public premium;
    uint256 public payout;

    mapping(address => bool) public insured;

    event PolicyBought(address indexed buyer);
    event ClaimPaid(address indexed claimant, uint256 amount);

    constructor(uint256 _premium, uint256 _payout) {
        insurer = msg.sender;
        premium = _premium;
        payout = _payout;
    }

    function buyPolicy() external payable {
        require(msg.value == premium, "Incorrect premium");
        insured[msg.sender] = true;
        emit PolicyBought(msg.sender);
    }

    function payClaim(address claimant) external {
        require(msg.sender == insurer, "Only insurer");
        require(insured[claimant], "Not insured");
        insured[claimant] = false;
        payable(claimant).transfer(payout);
        emit ClaimPaid(claimant, payout);
    }

    // Fallback to receive funds for payouts
    receive() external payable {}
}
