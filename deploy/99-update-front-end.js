const { ethers, network } = require("hardhat")
const fs = require("fs")

const frontEndContractsFile = "../nextjs-nft-marketplace-fcc/constants/networkMapping.json"
const frontEndAbiLocation = "../nextjs-nft-marketplace-fcc/constants/"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...")
        await updateContractAddresses()
        await updateAbi()
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NFTMarketplace")
    fs.writeFileSync(
        `${frontEndAbiLocation}NFTMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )
    const basicNft = await ethers.getContract("BasicNft")
    fs.writeFileSync(
        `${frontEndAbiLocation}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddresses() {
    const nftMarketplace = await ethers.getContract("NFTMarketplace")
    const chainId = network.config.chainId.toString()
    console.log(chainId)
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId]["nftMarketplace"].includes(nftMarketplace.address)) {
            contractAddresses[chainId]["nftMarketplace"].push(nftMarketplace.address)
        }
    } else {
        console.log("work")
        contractAddresses[chainId] = { nftMarketplace: [nftMarketplace.address] }
        console.log(contractAddresses)
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
