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

import "./TestToken.sol";

contract MockStaticAToken is TestToken {
    // solhint-disable-next-line var-name-mixedcase
    address private immutable _ASSET;
    address private immutable _lendingPool;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address underlyingAsset,
        address lendingPool
    ) TestToken(name, symbol, decimals) {
        _ASSET = underlyingAsset;
        _lendingPool = lendingPool;
    }

    // solhint-disable-next-line func-name-mixedcase
    function ASSET() external view returns (address) {
        return _ASSET;
    }

    // solhint-disable-next-line func-name-mixedcase
    function LENDING_POOL() external view returns (address) {
        return _lendingPool;
    }

    function rate() external pure returns (uint256) {
        revert("Should not call this");
    }

    function deposit(
        address,
        uint256,
        uint16,
        bool
    ) external pure returns (uint256) {
        return 0;
    }

    function withdraw(
        address,
        uint256,
        bool
    ) external pure returns (uint256, uint256) {
        return (0, 0);
    }

    function staticToDynamicAmount(uint256 amount) external pure returns (uint256) {
        return amount;
    }
}
