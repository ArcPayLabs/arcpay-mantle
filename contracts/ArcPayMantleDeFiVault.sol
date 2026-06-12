// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IArcPayMintableToken {
    function mint(address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ArcPayMantleDeFiVault {
    struct Position {
        uint256 nativeBalance;
        uint256 tokenBalance;
        uint256 yieldPoints;
        uint256 updatedAt;
    }

    address public immutable usdy;
    uint256 public nativeToUsdyRate;
    uint256 public yieldBps;

    mapping(address => Position) public positions;

    event NativeSwappedForToken(address indexed operator, address indexed recipient, uint256 nativeAmount, uint256 tokenAmount, string routeUri);
    event TokenSwappedForNative(address indexed operator, address indexed recipient, uint256 tokenAmount, uint256 nativeAmount, string routeUri);
    event NativeYieldDeposited(address indexed operator, uint256 amount, uint256 yieldPoints, string strategyUri);
    event TokenYieldDeposited(address indexed operator, uint256 amount, uint256 yieldPoints, string strategyUri);
    event NativeYieldWithdrawn(address indexed operator, address indexed recipient, uint256 amount);
    event TokenYieldWithdrawn(address indexed operator, address indexed recipient, uint256 amount);
    event StrategyUpdated(uint256 nativeToUsdyRate, uint256 yieldBps);

    constructor(address usdy_, uint256 nativeToUsdyRate_, uint256 yieldBps_) {
        require(usdy_ != address(0), "token required");
        require(nativeToUsdyRate_ > 0, "rate required");
        usdy = usdy_;
        nativeToUsdyRate = nativeToUsdyRate_;
        yieldBps = yieldBps_;
    }

    function quoteNativeToToken(uint256 nativeAmount) public view returns (uint256) {
        return (nativeAmount * nativeToUsdyRate) / 1 ether;
    }

    function swapNativeToToken(address recipient, string calldata routeUri) external payable returns (uint256 tokenAmount) {
        require(msg.value > 0, "amount required");
        require(recipient != address(0), "recipient required");
        tokenAmount = quoteNativeToToken(msg.value);
        IArcPayMintableToken(usdy).mint(recipient, tokenAmount);
        emit NativeSwappedForToken(msg.sender, recipient, msg.value, tokenAmount, routeUri);
    }

    function swapTokenToNative(uint256 tokenAmount, address payable recipient, string calldata routeUri) external returns (uint256 nativeAmount) {
        require(tokenAmount > 0, "amount required");
        require(recipient != address(0), "recipient required");
        nativeAmount = (tokenAmount * 1 ether) / nativeToUsdyRate;
        require(address(this).balance >= nativeAmount, "insufficient native liquidity");
        require(IArcPayMintableToken(usdy).transferFrom(msg.sender, address(this), tokenAmount), "token transfer failed");
        recipient.transfer(nativeAmount);
        emit TokenSwappedForNative(msg.sender, recipient, tokenAmount, nativeAmount, routeUri);
    }

    function depositNativeYield(string calldata strategyUri) external payable {
        require(msg.value > 0, "amount required");
        Position storage position = positions[msg.sender];
        position.nativeBalance += msg.value;
        uint256 points = (msg.value * yieldBps) / 10_000;
        position.yieldPoints += points;
        position.updatedAt = block.timestamp;
        emit NativeYieldDeposited(msg.sender, msg.value, points, strategyUri);
    }

    function depositTokenYield(uint256 amount, string calldata strategyUri) external {
        require(amount > 0, "amount required");
        require(IArcPayMintableToken(usdy).transferFrom(msg.sender, address(this), amount), "token transfer failed");
        Position storage position = positions[msg.sender];
        position.tokenBalance += amount;
        uint256 points = (amount * yieldBps) / 10_000;
        position.yieldPoints += points;
        position.updatedAt = block.timestamp;
        emit TokenYieldDeposited(msg.sender, amount, points, strategyUri);
    }

    function withdrawNativeYield(uint256 amount, address payable recipient) external {
        require(recipient != address(0), "recipient required");
        Position storage position = positions[msg.sender];
        require(amount > 0 && amount <= position.nativeBalance, "invalid amount");
        position.nativeBalance -= amount;
        position.updatedAt = block.timestamp;
        recipient.transfer(amount);
        emit NativeYieldWithdrawn(msg.sender, recipient, amount);
    }

    function withdrawTokenYield(uint256 amount, address recipient) external {
        require(recipient != address(0), "recipient required");
        Position storage position = positions[msg.sender];
        require(amount > 0 && amount <= position.tokenBalance, "invalid amount");
        position.tokenBalance -= amount;
        position.updatedAt = block.timestamp;
        require(IArcPayMintableToken(usdy).transfer(recipient, amount), "token transfer failed");
        emit TokenYieldWithdrawn(msg.sender, recipient, amount);
    }

    function setStrategy(uint256 nativeToUsdyRate_, uint256 yieldBps_) external {
        require(nativeToUsdyRate_ > 0, "rate required");
        nativeToUsdyRate = nativeToUsdyRate_;
        yieldBps = yieldBps_;
        emit StrategyUpdated(nativeToUsdyRate_, yieldBps_);
    }
}
