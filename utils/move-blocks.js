const { network } = require("hardhat")

function sleep(timeMs) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs)
    })
}

async function moveBlocks(amount, sleepAmount = 0) {
    console.log("Moving blocks...")
    for (let index = 0; index < amount; index++) {
        await network.provider.request({
            method: "evm_mine",
            params: [],
        })
        if (sleepAmount) {
            console.log(`Sleepimg for ${sleepAmount}`)
            await sleep(sleepAmount)
        }
    }
}

module.exports = { moveBlocks, sleep }
