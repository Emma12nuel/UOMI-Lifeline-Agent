// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Uomi Lifeline Faucet Agent
 * @notice Native-UOMI faucet for the UOMI testnet.
 *         Fair drips, cooldowns, optional anti-bot EOA gate, donations,
 *         and basic admin ops (pause + ownership transfer).
 */
contract UomiLifeline {
    address public owner;
    uint256 public dripAmount;
    uint256 public cooldownTime;
    uint256 public minBalance;
    bool public paused;

    mapping(address => uint256) public lastClaimed;

    event TokensClaimed(address indexed user, uint256 amount);
    event DonationReceived(address indexed donor, uint256 amount);
    event DripAdjusted(uint256 newDrip);
    event ConfigUpdated(uint256 dripAmount, uint256 cooldownTime, uint256 minBalance);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event Paused(bool status);

    // NOTE: Keeping EOA-only protection for faucet UX. Remove if you need composability.
    modifier onlyEOA() {
        require(msg.sender == tx.origin, "EOA only");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier notPaused() {
        require(!paused, "Paused");
        _;
    }

    constructor(
        uint256 _dripAmount,
        uint256 _cooldownTime,
        uint256 _minBalance
    ) {
        owner = msg.sender;
        dripAmount = _dripAmount;
        cooldownTime = _cooldownTime;
        minBalance = _minBalance;
    }

    receive() external payable {
        emit DonationReceived(msg.sender, msg.value);
    }

    function claim() external onlyEOA notPaused {
        require(block.timestamp >= lastClaimed[msg.sender] + cooldownTime, "Wait before claiming again");

        // Compute intended amount first, then verify balance
        uint256 amount = dripAmount;
        if (address(this).balance < minBalance) {
            amount = dripAmount / 2;
            emit DripAdjusted(amount);
        }

        require(address(this).balance >= amount, "Faucet dry, donate!");

        // Effects before interaction (reentrancy-safe sequencing)
        lastClaimed[msg.sender] = block.timestamp;

        // Use call() instead of transfer() for forward-compat gas semantics
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Send failed");

        emit TokensClaimed(msg.sender, amount);
    }

    function donate() external payable {
        require(msg.value > 0, "Send something");
        emit DonationReceived(msg.sender, msg.value);
    }

    function updateConfig(
        uint256 _dripAmount,
        uint256 _cooldownTime,
        uint256 _minBalance
    ) external onlyOwner {
        dripAmount = _dripAmount;
        cooldownTime = _cooldownTime;
        minBalance = _minBalance;
        emit ConfigUpdated(_dripAmount, _cooldownTime, _minBalance);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }
}
