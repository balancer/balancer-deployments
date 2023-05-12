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

contract MockOmniVotingEscrow {
    event SendUserBalance(address user, uint16 chainId, address refundAddress);

    uint256 private _nativeFee;
    uint256 private _zroFee;

    function estimateSendUserBalance(
        uint16,
        bool,
        bytes calldata
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        return (_nativeFee, _zroFee);
    }

    // solhint-disable no-unused-vars
    function sendUserBalance(
        address _user,
        uint16 _dstChainId,
        address payable _refundAddress,
        address,
        bytes memory
    ) external payable {
        emit SendUserBalance(_user, _dstChainId, _refundAddress);
    }

    function setNativeFee(uint256 nativeFee) external {
        _nativeFee = nativeFee;
    }
}
