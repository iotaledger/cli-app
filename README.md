# IOTA CLI Wallet

Command line interface (CLI) app that acts as an IOTA wallet and node management tool.

## Installation

You need node and a functioning IOTA node to connect to.  The IOTA node is often on the same computer as the CLI, but the CLI can work with remote nodes as well.

** NOTE ** This is still being built, and has yet to be published to npm.  When it is, we'll have a nice little npm install command.  For now, clone this repo, cd into it, and do:

`npm install`

## Usage

After installing, execute the CLI:

`iota-cli`

This will connect to a node on the same computer as the CLI by default.  If your node is in another location use the `node` command to switch to the remote computer.  Make sure the remote node is configured to allow remote connections.

For a list of all the commands available in the CLI use `help`.
