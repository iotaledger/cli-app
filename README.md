# IOTA CLI Wallet

Command line interface (CLI) app that acts as an IOTA wallet and node management tool.

## Installation

You need:
1. [Node.js](https://nodejs.org) installed on your machine.  
1. A functioning [IOTA node](https://github.com/iotaledger/iri) to connect to.  The IOTA node can be on the same computer as the CLI, but the CLI can work with remote nodes as well if they are configured using `--remote`.

To install:
`npm install -g iota-cli-app`

## Usage

After installing, execute the CLI:

`iota-cli`

This will connect to a node on the same computer as the CLI by default.  If your node is in another location use the `node` command to switch to the remote computer.  Make sure the remote node is configured to allow remote connections.

For a list of all the commands available in the CLI use `help`.
