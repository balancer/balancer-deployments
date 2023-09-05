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
pragma experimental ABIEncoderV2;

/*
This contract is part of the build-info for the 20230811-avalanche-root-gauge-factory-v2, but is no longer in the
monorepo. We cannot actually include it here without introducing a dependency on liquidity-mining, but here is the
source code for reference.

import "../gauges/avalanche/AvalancheRootGauge.sol";

contract MockAvalancheRootGauge is AvalancheRootGauge {
    constructor(IMainnetBalancerMinter minter, ILayerZeroBALProxy lzBALProxy) AvalancheRootGauge(minter, lzBALProxy) {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
     * @dev It would be very difficult to contrive a fork test that set the mintAmount to a precise value,
     * so the bridge limits are best tested with a mock and unit tests.
     * It must be payable to send ETH to pay for gas in the child chain.
     * @param mintAmount Amount to be bridged
     *
    function bridge(uint256 mintAmount) external payable {
        _postMintAction(mintAmount);
    }
} */
