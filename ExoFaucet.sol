// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ExoFaucet {
    address public owner;
    uint256 public withdrawAmount;
    mapping(address => uint256) withdrawTimestamp;

    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor(uint256 _withdrawAmount) {
        owner = msg.sender;
        withdrawAmount = _withdrawAmount; // Amount of Ether users can withdraw
    }

    // Allow the contract to receive Ether
    receive() external payable {}

    function setWithdrawAmount(uint256 _amount) external onlyOwner {
        withdrawAmount = _amount;
    }

    function withdraw(address payable recipient) external onlyOwner {
        require(
            address(this).balance >= withdrawAmount,
            "Insufficient funds in the faucet"
        );
        require(
            block.timestamp - withdrawTimestamp[recipient] >= 1 days,
            "You need to wait for 24 hours"
        );
        withdrawTimestamp[recipient] = block.timestamp;
        recipient.transfer(withdrawAmount);
        emit FundsWithdrawn(recipient, withdrawAmount);
    }
}
