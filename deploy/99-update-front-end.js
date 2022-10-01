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
    const basicNftTwo = await ethers.getContract("BasicNftTwo")
    fs.writeFileSync(
        `${frontEndAbiLocation}BasicNftTwo.json`,
        basicNftTwo.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddresses() {
    const nftMarketplace = await ethers.getContract("NFTMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    const basicNftTwo = await ethers.getContract("BasicNftTwo")
    const basicNFT3 = await ethers.getContract("BasicNftThree")
    const chainId = network.config.chainId.toString()
    console.log(chainId)
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId]["nftMarketplace"].includes(nftMarketplace.address)) {
            contractAddresses[chainId]["nftMarketplace"].push(nftMarketplace.address)
        }
        if (!contractAddresses[chainId]["basicNft"].includes(basicNft.address)) {
            contractAddresses[chainId]["basicNft"].push(basicNft.address)
        }
        if (!contractAddresses[chainId]["basicNftTwo"].includes(basicNftTwo.address)) {
            contractAddresses[chainId]["basicNftTwo"].push(basicNftTwo.address)
        }
        if (!contractAddresses[chainId]["basicNFT3"].includes(basicNFT3.address)) {
            contractAddresses[chainId]["basicNFT3"].push(basicNFT3.address)
        }
    } else {
        contractAddresses[chainId] = { nftMarketplace: [nftMarketplace.address] }
        console.log(contractAddresses)
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
