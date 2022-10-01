const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mint() {
    const basicNft = await ethers.getContract("BasicNftTwo")
    console.log("Minting...")
    const mintTrx = await basicNft.mintNft()
    const mintTrxReceipt = await mintTrx.wait(1)
    const tokenId = mintTrxReceipt.events[0].args.tokenId
    console.log("Got tokenId: ", tokenId)
    console.log("NFT address: ", basicNft.address)

    if (network.config.chainId == 31337) {
        await moveBlocks(2, 1000)
    }
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
