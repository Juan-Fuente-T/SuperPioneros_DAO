// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract SuperPionerosNFT is ERC721Enumerable {
    // Initialize the ERC-721 contract
    constructor() ERC721("Super Pioneros NFT", "SPN") {}

    // Have a public mint function anyone can call to get an NFT
    function mint() public {
        _safeMint(msg.sender, totalSupply());
    }
}

