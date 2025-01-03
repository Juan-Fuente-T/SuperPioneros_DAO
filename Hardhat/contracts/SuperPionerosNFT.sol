// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
contract SuperPionerosNFT is ERC721Enumerable, Ownable{
    // Initialize the ERC-721 contract
    constructor() ERC721("Super Pioneros NFT", "SPN") Ownable(msg.sender) {}

    // Have a public mint function owner can call to get an NFT
    function mint(address member) public onlyOwner {
        _safeMint(member, totalSupply());
    }

    // Have a public mint function anyone can call to get an NFT
    // function mint() public {
    //     _safeMint(msg.sender, totalSupply());
    // }
}

