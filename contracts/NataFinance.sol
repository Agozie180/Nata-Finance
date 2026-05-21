// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * NATA FINANCE
 * Cross-border USDC payment infrastructure on Arc.
 *
 * Arc Testnet:
 * - Chain ID: 5042002
 * - RPC: https://rpc.testnet.arc.network
 * - Explorer: https://testnet.arcscan.app
 *
 * Arc uses native USDC for gas and value transfers, so payments are sent as
 * msg.value with 18 decimals. No ERC-20 approve() flow is needed.
 */
contract NataFinance {
    event PaymentSent(
        address indexed sender,
        address indexed recipient,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 fee,
        uint256 ngnReference,
        string memo,
        uint256 timestamp
    );

    event FeeWithdrawn(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed from, address indexed to);

    address public owner;
    uint256 public totalPayments;
    uint256 public totalVolumeWei;

    uint256 private constant FEE_DENOMINATOR = 200;

    struct Payment {
        address sender;
        address recipient;
        uint256 grossAmount;
        uint256 netAmount;
        uint256 fee;
        uint256 ngnReference;
        string memo;
        uint256 timestamp;
    }

    mapping(address => Payment[]) private _sent;
    mapping(address => Payment[]) private _received;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "NataFinance: not owner");
        _;
    }

    function sendPayment(
        address payable recipient,
        uint256 ngnReference,
        string calldata memo
    ) external payable {
        require(msg.value > 0, "NataFinance: amount must be > 0");
        require(recipient != address(0), "NataFinance: invalid recipient");
        require(recipient != msg.sender, "NataFinance: cannot send to yourself");
        require(bytes(memo).length > 0, "NataFinance: memo is required");
        require(bytes(memo).length <= 120, "NataFinance: memo max 120 chars");

        uint256 fee = msg.value / FEE_DENOMINATOR;
        uint256 netAmount = msg.value - fee;

        (bool ok, ) = recipient.call{value: netAmount}("");
        require(ok, "NataFinance: transfer to recipient failed");

        Payment memory p = Payment({
            sender: msg.sender,
            recipient: recipient,
            grossAmount: msg.value,
            netAmount: netAmount,
            fee: fee,
            ngnReference: ngnReference,
            memo: memo,
            timestamp: block.timestamp
        });

        _sent[msg.sender].push(p);
        _received[recipient].push(p);

        unchecked {
            totalPayments++;
            totalVolumeWei += msg.value;
        }

        emit PaymentSent(
            msg.sender,
            recipient,
            msg.value,
            netAmount,
            fee,
            ngnReference,
            memo,
            block.timestamp
        );
    }

    function getSentPayments(address user) external view returns (Payment[] memory) {
        return _sent[user];
    }

    function getReceivedPayments(address user) external view returns (Payment[] memory) {
        return _received[user];
    }

    function totalVolumeUSDC() external view returns (uint256) {
        return totalVolumeWei / 1e18;
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function withdrawFees(address payable to) external onlyOwner {
        require(to != address(0), "NataFinance: zero address");
        uint256 bal = address(this).balance;
        require(bal > 0, "NataFinance: no fees to withdraw");
        (bool ok, ) = to.call{value: bal}("");
        require(ok, "NataFinance: withdraw failed");
        emit FeeWithdrawn(to, bal);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "NataFinance: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
