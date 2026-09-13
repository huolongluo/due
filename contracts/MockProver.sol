// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

import {INativeQueryVerifier} from "./DueVault.sol";

/// @dev Local stand-in for 0x0FD2. Never deployed to Creditcoin.
contract MockProver {
    bool public pass = true;

    function setPass(bool v) external {
        pass = v;
    }

    function verifyAndEmit(
        uint64,
        uint64,
        bytes calldata,
        INativeQueryVerifier.MerkleProof calldata,
        INativeQueryVerifier.ContinuityProof calldata
    ) external view returns (bool) {
        return pass;
    }
}
