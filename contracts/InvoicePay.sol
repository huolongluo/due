// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

/// @title QuayUSD — demo stable for the Sepolia payment leg
/// @dev Mint is open on testnet so judges can pay an invoice without a faucet dance.
contract QuayUSD {
    string public constant name = "Quay USD";
    string public constant symbol = "qUSD";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "allowance");
            allowance[from][msg.sender] = allowed - amount;
        }
        _move(from, to, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

/// @title InvoicePay — source-chain payment desk
/// @notice Buyer pays qUSD here. Creditcoin will only accept InvoicePaid logs from this address.
contract InvoicePay {
    QuayUSD public immutable token;

    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        address indexed token,
        uint256 amount
    );

    constructor(QuayUSD token_) {
        token = token_;
    }

    function pay(uint256 invoiceId, uint256 amount) external {
        require(amount > 0, "amount");
        require(token.transferFrom(msg.sender, address(this), amount), "transfer");
        emit InvoicePaid(invoiceId, msg.sender, address(token), amount);
    }
}
