const { exec } = require("child_process");
const { getConfigPath, getWhitelistedNetworks } = require("./_helpers.js");
const { setupIbcPacketEventListener } = require("./_events.js");

const source = process.argv[2];
if (!source) {
  console.error("Usage: node bridge-tokens-config.js <source_network>");
  process.exit(1);
}

function runBridgeTokens(config) {
  // Check if the source chain from user input is whitelisted
  const allowedNetworks = getWhitelistedNetworks();
  if (!allowedNetworks.includes(source)) {
    console.error("❌ Please provide a valid source chain");
    process.exit(1);
  }

  // Run the bridge-tokens or send-universal-packet script based on the config
  exec(`npx hardhat run scripts/bridge-tokens.js --network ${source}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    } else {
      console.log(stdout);
    }
  });
}

async function main() {
  const configPath = getConfigPath();
  const config = require(configPath);

  await setupIbcPacketEventListener();

  runBridgeTokens(config);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
