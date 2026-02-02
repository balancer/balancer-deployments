// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.24;

import { IVault } from "@balancer-labs/v3-interfaces/contracts/vault/IVault.sol";

/**
 * @notice Helper contract to facilitate testing calls while the Vault is unlocked.
 * @dev See v3/tasks/20260202-v3-weighted-pool-oracle-v2/test/task.fork.ts for usage.
 */
contract VaultUnlockTestHelper {
    IVault private immutable _vault;

    error CallerIsNotVault();

    constructor(IVault vault_) {
        _vault = vault_;
    }

    function callWhileUnlocked(address target, bytes calldata callData) external returns (bytes memory) {
        return _vault.unlock(abi.encodeCall(this.unlockCallback, (target, callData)));
    }

    function unlockCallback(address target, bytes calldata callData) external returns (bytes memory) {
        if (msg.sender != address(_vault)) {
            revert CallerIsNotVault();
        }

        // Vault is unlocked here
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory result) = target.call(callData);

        if (!success) {
            // Bubble up the revert
            // solhint-disable-next-line no-inline-assembly
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        return result;
    }
}
