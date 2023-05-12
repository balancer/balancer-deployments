// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.7.0;

import "@balancer-labs/v2-interfaces/contracts/liquidity-mining/IVeDelegation.sol";
import "./TestToken.sol";

// For compatibility, we're keeping the same function names as in the original Curve code, including the mixed-case
// naming convention.
// solhint-disable func-name-mixedcase

contract MockVeDelegation is IVeDelegation, TestToken {
    constructor() TestToken("Mock VE delegation", "dveBAL", 18) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function adjusted_balance_of(address user) external view override returns (uint256) {
        return balanceOf(user);
    }

    function totalSupply() public view override(ERC20, IVeDelegation) returns (uint256) {
        return ERC20.totalSupply();
    }
}
