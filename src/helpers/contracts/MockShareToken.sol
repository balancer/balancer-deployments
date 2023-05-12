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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.pragma solidity ^0.7.0;
pragma solidity ^0.7.0;

import "./MaliciousQueryReverter.sol";
import "./TestToken.sol";

contract MockShareToken is TestToken, MaliciousQueryReverter {
    address private immutable _silo;
    address private immutable _asset;
    uint256 private _supply;

    /// @dev Token is always deployed for specific Silo and asset
    /// @param name token name
    /// @param symbol token symbol
    /// @param silo Silo address for which tokens was deployed
    /// @param asset asset for which this tokens was deployed
    constructor(
        string memory name,
        string memory symbol,
        address silo,
        address asset,
        uint8 decimals
    ) TestToken(name, symbol, decimals) {
        _silo = address(silo);
        _asset = asset;
    }

    function asset() external view returns (address) {
        maybeRevertMaliciously();
        return _asset;
    }

    function silo() external view returns (address) {
        maybeRevertMaliciously();
        return _silo;
    }

    function totalSupply() public view override returns (uint256) {
        maybeRevertMaliciously();
        return _supply;
    }

    function setTotalSupply(uint256 supply) public {
        _supply = supply;
    }
}
