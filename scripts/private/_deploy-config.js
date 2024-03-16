const { exec } = require("child_process");
const { updateConfigDeploy, getWhitelistedNetworks, updateConfigBridgeTokens } = require("./_helpers");
const hre = require("hardhat");

// Run script with source and destination networks as arguments
// Example:
// $ node deploy-config.js optimism base
const source = process.argv[2];
const destination = process.argv[3];

if (!source || !destination) {
  console.error("Usage: node deploy-config.js <source_network> <destination_network>");
  process.exit(1);
}

// Function to run the deploy script and capture output
function deployAndCapture(network, accounts, isSource) {
  const allowedNetworks = getWhitelistedNetworks();
  if (!allowedNetworks.includes(network)) {
    console.error("Invalid network. Please provide a valid network as an argument.");
    return;
  }
  exec(`npx hardhat run scripts/deploy.js --network ${network}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    } else {
      console.log(stdout);
    }

    // Process stdout to find the contract address and network
    const output = stdout.trim();
    const match = output.match(/Contract (\S+) deployed to (\S+) on network (\S+)/);

    if (match) {
      const contractType = match[1];
      const address = match[2];
      const network = match[3];

      console.log(`
          ✅   Deployment Successful   ✅
          -------------------------------
          📄 Contract Type: ${contractType}
          📍 Address: ${address}
          🌍 Network: ${network}
          -------------------------------\n
      `);

      // Update the config.json file
      updateConfigDeploy(network, address, isSource);
      if (contractType === "XErc20") {
        const account = accounts[0].address;
        console.log(`🔗 Updating bridge tokens for ${network}..., public key is ${account}`);
        updateConfigBridgeTokens(network, account, account, "1000000000000000000");
      }
      console.log(
        `🆗 Updated ${process.env.CONFIG_PATH || "config.json"} with address ${address} on network ${network}`
      );
    } else {
      console.error("❌ Could not find contract address and network in output");
    }
  });
}

async function main() {
  const accounts = await hre.ethers.getSigners();
  deployAndCapture(source, accounts, true);
  deployAndCapture(destination, accounts, false);
}

main();
