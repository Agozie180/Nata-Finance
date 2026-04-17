// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║              NATA FINANCE                             ║
 * ║  Cross-border USDC payment infrastructure on Arc     ║
 * ║                                                       ║
 * ║  Built on Arc — Circle's EVM-compatible Layer-1       ║
 * ║  blockchain powered by USDC as native gas.            ║
 * ║                                                       ║
 * ║  Network  : Arc Testnet                               ║
 * ║  Chain ID : 5042002                                   ║
 * ║  RPC      : https://rpc.testnet.arc.network           ║
 * ║  Explorer : https://testnet.arcscan.app               ║
 * ╚═══════════════════════════════════════════════════════╝
 *
 * Features:
 *  - Send USDC cross-border with a NGN reference + memo
 *  - Full payment history per user (sent + received)
 *  - 0.5% protocol fee for sustainability
 *  - Owner-controlled fee withdrawal and ownership transfer
 */
contract NataFinance {

    // ── Events ────────────────────────────────────────────────────────────
    event PaymentSent(
        address indexed sender,
        address indexed recipient,
        uint256 grossAmount,    // total sent by caller (wei, 18 decimals)
        uint256 netAmount,      // amount recipient actually received
        uint256 fee,            // protocol fee retained
        uint256 ngnReference,   // informational NGN equivalent
        string  memo,
        uint256 timestamp
    );

    event FeeWithdrawn(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed from, address indexed to);

    // ── Storage ───────────────────────────────────────────────────────────
    address public owner;
    uint256 public totalPayments;
    uint256 public totalVolumeWei;   // cumulative USDC volume sent through protocol

    uint256 private constant FEE_DENOMINATOR = 200; // 0.5% = 1/200

    struct Payment {
        address sender;
        address recipient;
        uint256 grossAmount;   // what sender sent
        uint256 netAmount;     // what recipient received (after fee)
        uint256 fee;           // fee amount retained
        uint256 ngnReference;  // NGN equivalent at time of send
        string  memo;
        uint256 timestamp;
    }

    mapping(address => Payment[]) private _sent;
    mapping(address => Payment[]) private _received;

    // ── Constructor ───────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ── Modifier ──────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "NataFinance: not owner");
        _;
    }

    // ── Core: send payment ────────────────────────────────────────────────
    /**
     * @param recipient    Arc wallet address to receive USDC
     * @param ngnReference Approximate NGN value — informational only
     * @param memo         Purpose of payment (required, max 120 chars)
     *
     * Send USDC as msg.value — Arc's native token is USDC (18 decimals),
     * so no ERC-20 approve() is required. Just send value with this call.
     */
    function sendPayment(
        address payable recipient,
        uint256 ngnReference,
        string calldata memo
    ) external payable {
        require(msg.value > 0,              "NataFinance: amount must be > 0");
        require(recipient != address(0),    "NataFinance: invalid recipient");
        require(recipient != msg.sender,    "NataFinance: cannot send to yourself");
        require(bytes(memo).length > 0,     "NataFinance: memo is required");
        require(bytes(memo).length <= 120,  "NataFinance: memo max 120 chars");

        uint256 fee      = msg.value / FEE_DENOMINATOR;
        uint256 netAmount = msg.value - fee;

        // Transfer net amount to recipient
        (bool ok, ) = recipient.call{value: netAmount}("");
        require(ok, "NataFinance: transfer to recipient failed");

        // Record payment for both parties
        Payment memory p = Payment({
            sender:       msg.sender,
            recipient:    recipient,
            grossAmount:  msg.value,
            netAmount:    netAmount,
            fee:          fee,
            ngnReference: ngnReference,
            memo:         memo,
            timestamp:    block.timestamp
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

    // ── Views ─────────────────────────────────────────────────────────────
    function getSentPayments(address user)
        external view returns (Payment[] memory)
    {
        return _sent[user];
    }

    function getReceivedPayments(address user)
        external view returns (Payment[] memory)
    {
        return _received[user];
    }

    /// @notice Returns the total USDC volume in whole units (not wei)
    function totalVolumeUSDC() external view returns (uint256) {
        return totalVolumeWei / 1e18;
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ── Admin ─────────────────────────────────────────────────────────────
    function withdrawFees(address payable to) external onlyOwner {
        require(to != address(0),           "NataFinance: zero address");
        uint256 bal = address(this).balance;
        require(bal > 0,                    "NataFinance: no fees to withdraw");
        (bool ok, ) = to.call{value: bal}("");
        require(ok,                         "NataFinance: withdraw failed");
        emit FeeWithdrawn(to, bal);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "NataFinance: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
